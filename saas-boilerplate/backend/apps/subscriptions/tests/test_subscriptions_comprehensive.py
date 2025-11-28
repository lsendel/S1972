"""
Comprehensive subscription tests covering Stripe integration.

This test suite covers:
- Plan listing and retrieval
- Subscription creation and retrieval
- Stripe webhook handling (signature verification, event processing)
- Subscription status updates
- Billing cycle changes
- Subscription cancellation
- Payment failures and retries
"""
import pytest
import json
import stripe
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from django.urls import reverse
from django.utils import timezone
from django.test import RequestFactory
from rest_framework import status
from apps.subscriptions.models import Subscription, Plan
from apps.subscriptions.webhooks import stripe_webhook, handle_subscription_updated, handle_subscription_deleted
from apps.subscriptions.models import StripeEvent
from apps.organizations.tests.factories import OrganizationFactory, MembershipFactory
from apps.organizations.models import Membership
from apps.accounts.tests.factories import UserFactory


@pytest.fixture
def subscription_factory():
    """Factory for creating test subscriptions."""
    def _create_subscription(organization, plan, **kwargs):
        defaults = {
            'billing_cycle': 'monthly',
            'status': 'active',
            'stripe_subscription_id': f'sub_test_{organization.id}',
            'stripe_price_id': plan.stripe_price_id_monthly,
            'current_period_start': timezone.now(),
            'current_period_end': timezone.now() + timedelta(days=30),
        }
        defaults.update(kwargs)
        return Subscription.objects.create(
            organization=organization,
            plan=plan,
            **defaults
        )
    return _create_subscription


@pytest.fixture
def plan():
    """Create a test plan."""
    return Plan.objects.create(
        id='starter',
        name='Starter Plan',
        description='Perfect for small teams',
        stripe_price_id_monthly='price_monthly_test',
        stripe_price_id_yearly='price_yearly_test',
        price_monthly=29.00,
        price_yearly=290.00,
        limits={'users': 5, 'projects': 10},
        features=['Feature 1', 'Feature 2'],
        is_active=True,
        display_order=1
    )


@pytest.fixture
def pro_plan():
    """Create a pro test plan."""
    return Plan.objects.create(
        id='pro',
        name='Pro Plan',
        description='For growing businesses',
        stripe_price_id_monthly='price_pro_monthly_test',
        stripe_price_id_yearly='price_pro_yearly_test',
        price_monthly=99.00,
        price_yearly=990.00,
        limits={'users': 25, 'projects': 100},
        features=['Feature 1', 'Feature 2', 'Feature 3', 'Priority Support'],
        is_active=True,
        display_order=2
    )


@pytest.mark.django_db
class TestPlanList:
    """Tests for plan listing endpoint."""

    def test_list_active_plans(self, api_client, plan, pro_plan):
        """Test listing all active plans."""
        url = reverse('plan-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

        plan_ids = [p['id'] for p in response.data]
        assert 'starter' in plan_ids
        assert 'pro' in plan_ids

    def test_list_plans_excludes_inactive(self, api_client, plan):
        """Test inactive plans are not listed."""
        # Create inactive plan
        Plan.objects.create(
            id='inactive',
            name='Inactive Plan',
            stripe_price_id_monthly='price_inactive',
            stripe_price_id_yearly='price_inactive_yearly',
            price_monthly=0,
            price_yearly=0,
            is_active=False
        )

        url = reverse('plan-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        plan_ids = [p['id'] for p in response.data]
        assert 'inactive' not in plan_ids

    def test_list_plans_ordered_by_display_order(self, api_client):
        """Test plans are ordered by display_order."""
        Plan.objects.create(
            id='plan3',
            name='Plan 3',
            stripe_price_id_monthly='price_3',
            stripe_price_id_yearly='price_3_yearly',
            price_monthly=10,
            price_yearly=100,
            display_order=3
        )
        Plan.objects.create(
            id='plan1',
            name='Plan 1',
            stripe_price_id_monthly='price_1',
            stripe_price_id_yearly='price_1_yearly',
            price_monthly=5,
            price_yearly=50,
            display_order=1
        )
        Plan.objects.create(
            id='plan2',
            name='Plan 2',
            stripe_price_id_monthly='price_2',
            stripe_price_id_yearly='price_2_yearly',
            price_monthly=15,
            price_yearly=150,
            display_order=2
        )

        url = reverse('plan-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        plan_ids = [p['id'] for p in response.data]
        assert plan_ids == ['plan1', 'plan2', 'plan3']

    def test_list_plans_requires_no_authentication(self, api_client, plan):
        """Test plan listing is public (no authentication required)."""
        url = reverse('plan-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestSubscriptionRetrieval:
    """Tests for subscription retrieval."""

    def test_get_organization_subscription(self, authenticated_client, user, plan, subscription_factory):
        """Test retrieving organization subscription."""
        org = OrganizationFactory(slug='test-org')
        MembershipFactory(user=user, organization=org, role=Membership.ROLE_OWNER)
        subscription = subscription_factory(organization=org, plan=plan)

        url = reverse('subscription-current')
        response = authenticated_client.get(url, {'organization': 'test-org'})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['plan_details']['id'] == 'starter'
        assert response.data['billing_cycle'] == 'monthly'
        assert response.data['status'] == 'active'

    def test_get_subscription_requires_organization_param(self, authenticated_client):
        """Test subscription retrieval requires organization parameter."""
        url = reverse('subscription-current')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'required' in response.data['detail'].lower()

    def test_get_subscription_not_member(self, authenticated_client, user, plan, subscription_factory):
        """Test cannot retrieve subscription for organization user is not member of."""
        org = OrganizationFactory(slug='other-org')
        # User is NOT a member
        subscription_factory(organization=org, plan=plan)

        url = reverse('subscription-current')
        response = authenticated_client.get(url, {'organization': 'other-org'})

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_subscription_nonexistent_organization(self, authenticated_client):
        """Test retrieving subscription for non-existent organization."""
        url = reverse('subscription-current')
        response = authenticated_client.get(url, {'organization': 'nonexistent'})

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_subscription_no_subscription_exists(self, authenticated_client, user):
        """Test retrieving subscription when organization has no subscription."""
        org = OrganizationFactory(slug='test-org')
        MembershipFactory(user=user, organization=org)

        url = reverse('subscription-current')
        response = authenticated_client.get(url, {'organization': 'test-org'})

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_subscription_requires_authentication(self, api_client):
        """Test subscription retrieval requires authentication."""
        url = reverse('subscription-current')
        response = api_client.get(url, {'organization': 'test-org'})

        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestCheckoutAndBilling:
    """Tests for checkout session and billing portal endpoints."""

    def test_create_checkout_session(self, authenticated_client, organization, plan, user):
        url = reverse('subscription-checkout-session')
        with patch('apps.subscriptions.views.create_checkout_session') as mock_create:
            mock_create.return_value = MagicMock(id='cs_test_123', url='https://checkout.stripe.com/cs_test_123')

            payload = {
                'plan_id': plan.id,
                'organization': organization.slug,
                'billing_cycle': 'monthly',
                'success_url': 'https://example.com/success',
                'cancel_url': 'https://example.com/cancel',
            }
            response = authenticated_client.post(url, payload, format='json')

            assert response.status_code == status.HTTP_200_OK
            assert response.data['checkout_url'].startswith('https://checkout.stripe.com/')
            mock_create.assert_called_once_with(
                organization=organization,
                plan=plan,
                billing_cycle='monthly',
                success_url='https://example.com/success',
                cancel_url='https://example.com/cancel',
                user_email=user.email,
            )

    def test_billing_portal_requires_customer(self, authenticated_client, organization):
        url = reverse('subscription-billing-portal')
        payload = {
            'organization': organization.slug,
            'return_url': 'https://example.com/account',
        }
        response = authenticated_client.post(url, payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'no Stripe customer' in response.data['detail']

    def test_billing_portal_success(self, authenticated_client, organization):
        organization.stripe_customer_id = 'cus_123'
        organization.save()

        url = reverse('subscription-billing-portal')
        with patch('apps.subscriptions.views.create_billing_portal_session') as mock_portal:
            mock_portal.return_value = {'id': 'bps_123', 'url': 'https://billing.stripe.com/p/session/123'}
            payload = {
                'organization': organization.slug,
                'return_url': 'https://example.com/account',
            }
            response = authenticated_client.post(url, payload, format='json')

            assert response.status_code == status.HTTP_200_OK
            assert response.data['portal_url'].startswith('https://billing.stripe.com/')
            mock_portal.assert_called_once_with(
                organization=organization,
                return_url='https://example.com/account',
            )

    def test_checkout_requires_owner(self, api_client, user, organization, plan):
        # Downgrade membership to member
        membership = organization.memberships.first()
        membership.role = Membership.ROLE_MEMBER
        membership.save()

        api_client.force_authenticate(user=user)

        url = reverse('subscription-checkout-session')
        payload = {
            'plan_id': plan.id,
            'organization': organization.slug,
            'billing_cycle': 'monthly',
            'success_url': 'https://example.com/success',
            'cancel_url': 'https://example.com/cancel',
        }
        response = api_client.post(url, payload, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'owners' in response.data['detail'].lower()

    def test_billing_portal_requires_owner(self, api_client, user, organization):
        membership = organization.memberships.first()
        membership.role = Membership.ROLE_MEMBER
        membership.save()

        api_client.force_authenticate(user=user)

        url = reverse('subscription-billing-portal')
        payload = {
            'organization': organization.slug,
            'return_url': 'https://example.com/account',
        }
        response = api_client.post(url, payload, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'owners' in response.data['detail'].lower()


@pytest.mark.django_db
class TestStripeWebhook:
    """Tests for Stripe webhook handling."""

    def test_webhook_signature_verification_failure(self):
        """Test webhook rejects invalid signatures."""
        factory = RequestFactory()
        request = factory.post(
            '/webhooks/stripe/',
            data=json.dumps({'type': 'test.event'}),
            content_type='application/json'
        )
        request.META['HTTP_STRIPE_SIGNATURE'] = 'invalid_signature'

        with patch('stripe.Webhook.construct_event') as mock_construct:
            mock_construct.side_effect = stripe.error.SignatureVerificationError('Invalid signature', 'sig_header', 'secret')
            response = stripe_webhook(request)

            assert response.status_code == 400

    def test_webhook_signature_verification_success(self):
        """Test webhook accepts valid signatures."""
        factory = RequestFactory()
        payload = json.dumps({'type': 'customer.subscription.updated', 'data': {'object': {'id': 'sub_123'}}})
        request = factory.post(
            '/webhooks/stripe/',
            data=payload,
            content_type='application/json'
        )
        request.META['HTTP_STRIPE_SIGNATURE'] = 'valid_signature'

        mock_event = {
            'id': 'evt_test_123',
            'type': 'customer.subscription.updated',
            'data': {
                'object': {
                    'id': 'sub_123',
                    'status': 'active'
                }
            }
        }

        with patch('stripe.Webhook.construct_event', return_value=mock_event):
            with patch('apps.subscriptions.webhooks.handle_subscription_updated') as mock_handler:
                response = stripe_webhook(request)

                assert response.status_code == 200
                mock_handler.assert_called_once()

    def test_webhook_handles_checkout_session_completed(self):
        """Test webhook handles checkout.session.completed event."""
        factory = RequestFactory()
        mock_event = {
            'id': 'evt_checkout_123',
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'id': 'cs_test_123',
                    'subscription': 'sub_123'
                }
            }
        }

        request = factory.post('/webhooks/stripe/', data=json.dumps(mock_event), content_type='application/json')
        request.META['HTTP_STRIPE_SIGNATURE'] = 'sig'

        with patch('stripe.Webhook.construct_event', return_value=mock_event):
            with patch('apps.subscriptions.webhooks.handle_checkout_session_completed') as mock_handler:
                response = stripe_webhook(request)

                assert response.status_code == 200
                mock_handler.assert_called_once()

    def test_webhook_handles_subscription_updated(self):
        """Test webhook handles customer.subscription.updated event."""
        factory = RequestFactory()
        mock_event = {
            'id': 'evt_sub_updated_123',
            'type': 'customer.subscription.updated',
            'data': {
                'object': {
                    'id': 'sub_123',
                    'status': 'past_due'
                }
            }
        }

        request = factory.post('/webhooks/stripe/', data=json.dumps(mock_event), content_type='application/json')
        request.META['HTTP_STRIPE_SIGNATURE'] = 'sig'

        with patch('stripe.Webhook.construct_event', return_value=mock_event):
            with patch('apps.subscriptions.webhooks.handle_subscription_updated') as mock_handler:
                response = stripe_webhook(request)

                assert response.status_code == 200
                mock_handler.assert_called_once()

    def test_webhook_handles_subscription_deleted(self):
        """Test webhook handles customer.subscription.deleted event."""
        factory = RequestFactory()
        mock_event = {
            'id': 'evt_sub_deleted_123',
            'type': 'customer.subscription.deleted',
            'data': {
                'object': {
                    'id': 'sub_123'
                }
            }
        }

        request = factory.post('/webhooks/stripe/', data=json.dumps(mock_event), content_type='application/json')
        request.META['HTTP_STRIPE_SIGNATURE'] = 'sig'

        with patch('stripe.Webhook.construct_event', return_value=mock_event):
            with patch('apps.subscriptions.webhooks.handle_subscription_deleted') as mock_handler:
                response = stripe_webhook(request)

                assert response.status_code == 200
                mock_handler.assert_called_once()

    def test_webhook_ignores_unknown_event_types(self):
        """Test webhook gracefully handles unknown event types."""
        factory = RequestFactory()
        mock_event = {
            'id': 'evt_unknown_123',
            'type': 'unknown.event.type',
            'data': {'object': {}}
        }

        request = factory.post('/webhooks/stripe/', data=json.dumps(mock_event), content_type='application/json')
        request.META['HTTP_STRIPE_SIGNATURE'] = 'sig'

        with patch('stripe.Webhook.construct_event', return_value=mock_event):
            response = stripe_webhook(request)

            # Should still return 200 (acknowledge receipt)
            assert response.status_code == 200

    def test_webhook_idempotency_skips_processed_event(self, db):
        """Test webhook returns 200 without reprocessing duplicates."""
        factory = RequestFactory()
        event_id = 'evt_duplicate'
        StripeEvent.objects.create(event_id=event_id, type='customer.subscription.updated', payload={}, status='processed')

        mock_event = {
            'id': event_id,
            'type': 'customer.subscription.updated',
            'data': {
                'object': {
                    'id': 'sub_123',
                    'status': 'active',
                    'items': {'data': [{'price': {'id': 'price_monthly_test'}}]},
                }
            }
        }

        request = factory.post('/webhooks/stripe/', data=json.dumps(mock_event), content_type='application/json')
        request.META['HTTP_STRIPE_SIGNATURE'] = 'sig'

        with patch('stripe.Webhook.construct_event', return_value=mock_event):
            with patch('apps.subscriptions.webhooks.handle_subscription_updated') as mock_handler:
                response = stripe_webhook(request)

                assert response.status_code == 200
                mock_handler.assert_not_called()

    def test_webhook_invoice_payment_failed_maps_to_past_due(self):
        """Test invoice.payment_failed maps status to past_due before sync."""
        factory = RequestFactory()
        mock_event = {
            'id': 'evt_invoice_failed',
            'type': 'invoice.payment_failed',
            'data': {
                'object': {
                    'id': 'in_123',
                    'status': 'open',
                    'subscription': 'sub_123',
                    'lines': {'data': [{'price': {'id': 'price_monthly_test'}}]},
                }
            }
        }

        request = factory.post('/webhooks/stripe/', data=json.dumps(mock_event), content_type='application/json')
        request.META['HTTP_STRIPE_SIGNATURE'] = 'sig'

        with patch('stripe.Webhook.construct_event', return_value=mock_event):
            with patch('apps.subscriptions.webhooks.handle_subscription_updated') as mock_handler:
                response = stripe_webhook(request)

                assert response.status_code == 200
                mock_handler.assert_called_once()
                # Ensure the status was forced to past_due
                updated_subscription = mock_handler.call_args[0][0]
                assert updated_subscription['status'] == 'past_due'


@pytest.mark.django_db
class TestSubscriptionStatus:
    """Tests for subscription status management."""

    def test_subscription_one_to_one_with_organization(self, plan):
        """Test subscription has one-to-one relationship with organization."""
        org = OrganizationFactory()

        # Create first subscription
        subscription1 = Subscription.objects.create(
            organization=org,
            plan=plan,
            billing_cycle='monthly',
            status='active',
            stripe_price_id=plan.stripe_price_id_monthly,
            current_period_start=timezone.now(),
            current_period_end=timezone.now() + timedelta(days=30)
        )

        # Try to create second subscription for same org
        from django.db import IntegrityError
        with pytest.raises(IntegrityError):
            Subscription.objects.create(
                organization=org,
                plan=plan,
                billing_cycle='monthly',
                status='active',
                stripe_price_id=plan.stripe_price_id_monthly,
                current_period_start=timezone.now(),
                current_period_end=timezone.now() + timedelta(days=30)
            )

    def test_subscription_status_choices(self, plan, subscription_factory):
        """Test subscription can have various status values."""
        org = OrganizationFactory()

        valid_statuses = ['trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete']

        for status_value in valid_statuses:
            subscription = subscription_factory(
                organization=OrganizationFactory(),
                plan=plan,
                status=status_value
            )
            assert subscription.status == status_value

    def test_subscription_cancel_at_period_end(self, plan, subscription_factory):
        """Test subscription cancellation scheduled for period end."""
        org = OrganizationFactory()
        subscription = subscription_factory(
            organization=org,
            plan=plan,
            status='active',
            cancel_at_period_end=False
        )

        # Schedule cancellation
        subscription.cancel_at_period_end = True
        subscription.save()

        subscription.refresh_from_db()
        assert subscription.cancel_at_period_end is True
        # Status should remain active until period end
        assert subscription.status == 'active'


@pytest.mark.django_db
class TestBillingCycle:
    """Tests for billing cycle management."""

    def test_monthly_billing_cycle(self, plan, subscription_factory):
        """Test subscription with monthly billing cycle."""
        org = OrganizationFactory()
        subscription = subscription_factory(
            organization=org,
            plan=plan,
            billing_cycle='monthly',
            stripe_price_id=plan.stripe_price_id_monthly
        )

        assert subscription.billing_cycle == 'monthly'
        assert subscription.stripe_price_id == plan.stripe_price_id_monthly

    def test_yearly_billing_cycle(self, plan, subscription_factory):
        """Test subscription with yearly billing cycle."""
        org = OrganizationFactory()
        subscription = subscription_factory(
            organization=org,
            plan=plan,
            billing_cycle='yearly',
            stripe_price_id=plan.stripe_price_id_yearly
        )

        assert subscription.billing_cycle == 'yearly'
        assert subscription.stripe_price_id == plan.stripe_price_id_yearly


@pytest.mark.django_db
class TestPlanFeatures:
    """Tests for plan features and limits."""

    def test_plan_features_stored_as_list(self, plan):
        """Test plan features are stored as JSON list."""
        assert isinstance(plan.features, list)
        assert 'Feature 1' in plan.features
        assert 'Feature 2' in plan.features

    def test_plan_limits_stored_as_dict(self, plan):
        """Test plan limits are stored as JSON dict."""
        assert isinstance(plan.limits, dict)
        assert plan.limits['users'] == 5
        assert plan.limits['projects'] == 10

    def test_plan_pricing_structure(self, plan):
        """Test plan has both monthly and yearly pricing."""
        assert plan.price_monthly == 29.00
        assert plan.price_yearly == 290.00
        # Yearly should be ~10 months price (2 months free)
        assert plan.price_yearly < plan.price_monthly * 12


@pytest.mark.django_db
class TestSubscriptionTrials:
    """Tests for subscription trial periods."""

    def test_subscription_with_trial(self, plan, subscription_factory):
        """Test subscription can have trial period."""
        org = OrganizationFactory()
        trial_end = timezone.now() + timedelta(days=14)

        subscription = subscription_factory(
            organization=org,
            plan=plan,
            status='trialing',
            trial_end=trial_end
        )

        assert subscription.status == 'trialing'
        assert subscription.trial_end is not None
        assert subscription.trial_end > timezone.now()

    def test_subscription_without_trial(self, plan, subscription_factory):
        """Test subscription can start without trial."""
        org = OrganizationFactory()

        subscription = subscription_factory(
            organization=org,
            plan=plan,
            status='active',
            trial_end=None
        )

        assert subscription.status == 'active'
        assert subscription.trial_end is None


@pytest.mark.django_db
class TestStripeIntegration:
    """Tests for Stripe integration fields."""

    def test_subscription_has_stripe_ids(self, plan, subscription_factory):
        """Test subscription stores Stripe IDs."""
        org = OrganizationFactory()

        subscription = subscription_factory(
            organization=org,
            plan=plan,
            stripe_subscription_id='sub_1234567890',
            stripe_price_id='price_1234567890'
        )

        assert subscription.stripe_subscription_id == 'sub_1234567890'
        assert subscription.stripe_price_id == 'price_1234567890'

    def test_stripe_subscription_id_unique(self, plan, subscription_factory):
        """Test Stripe subscription ID must be unique."""
        org1 = OrganizationFactory()
        org2 = OrganizationFactory()

        subscription1 = subscription_factory(
            organization=org1,
            plan=plan,
            stripe_subscription_id='sub_duplicate'
        )

        # Try to create another subscription with same Stripe ID
        from django.db import IntegrityError
        with pytest.raises(IntegrityError):
            subscription_factory(
                organization=org2,
                plan=plan,
                stripe_subscription_id='sub_duplicate'
            )

    def test_organization_has_stripe_customer_id(self):
        """Test organization can store Stripe customer ID."""
        org = OrganizationFactory()
        org.stripe_customer_id = 'cus_1234567890'
        org.save()

        org.refresh_from_db()
        assert org.stripe_customer_id == 'cus_1234567890'
