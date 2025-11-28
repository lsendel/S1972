import json
from unittest.mock import patch, MagicMock
import pytest
from django.urls import reverse
from rest_framework import status
from apps.subscriptions.models import Subscription
from apps.billing.models import StripeEvent
from apps.organizations.models import Organization
from apps.subscriptions.models import Plan
from django.utils import timezone

@pytest.mark.django_db
class TestStripeWebhooks:
    
    @pytest.fixture
    def organization(self):
        return Organization.objects.create(name="Test Org", slug="test-org")

    @pytest.fixture
    def plan(self):
        return Plan.objects.create(
            id="starter",
            name="Starter",
            stripe_price_id_monthly="price_monthly",
            stripe_price_id_yearly="price_yearly",
            price_monthly=10,
            price_yearly=100
        )

    @patch('apps.billing.webhooks._get_stripe_client')
    def test_checkout_session_completed(self, mock_stripe, client, organization, plan):
        # Mock the event object returned by construct_event
        # It needs to behave like a dict for json serialization in the view
        event_dict = {
            'id': 'evt_test',
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'subscription': 'sub_test',
                    'customer': 'cus_test',
                    'metadata': {
                        'organization_id': str(organization.id)
                    }
                }
            }
        }
        
        mock_event = MagicMock()
        mock_event.get.side_effect = lambda k, default=None: event_dict.get(k, default)
        # Make the mock iterable and subscriptable so it behaves like the dict for other operations
        mock_event.__getitem__.side_effect = event_dict.__getitem__
        mock_event.__iter__.side_effect = event_dict.__iter__
        mock_event.__contains__.side_effect = event_dict.__contains__
        
        # IMPORTANT: When Django tries to serialize this for JSONField, it might fail if it's a Mock.
        # But `record_event` uses `event` which is the return value of `construct_event`.
        # If we return a real dict, `construct_event` usually returns a StripeObject which is dict-like.
        # Let's just return the dict directly, as Stripe's library often returns objects that act like dicts.
        # However, the view code does `event.get('id')`.
        
        mock_stripe.return_value.Webhook.construct_event.return_value = event_dict
        
        mock_sub = {
            'id': 'sub_test',
            'customer': 'cus_test',
            'status': 'active',
            'items': {'data': [{'price': {'id': 'price_monthly'}}]},
            'current_period_start': 1600000000,
            'current_period_end': 1600000000,
            'metadata': {'organization_id': str(organization.id)}
        }
        mock_stripe.return_value.Subscription.retrieve.return_value = mock_sub

        url = reverse('stripe-webhook')
        response = client.post(
            url, 
            data=json.dumps({'id': 'evt_test'}), 
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_sig'
        )

        if response.status_code != 200:
            print(f"Response content: {response.content}")
            
        assert response.status_code == 200
        assert Subscription.objects.filter(organization=organization).exists()
        sub = Subscription.objects.get(organization=organization)
        assert sub.stripe_subscription_id == 'sub_test'
        assert sub.status == 'active'

    @patch('apps.billing.webhooks._get_stripe_client')
    def test_invoice_payment_failed(self, mock_stripe, client, organization, plan):
        # Setup existing subscription
        Subscription.objects.create(
            organization=organization,
            plan=plan,
            stripe_subscription_id='sub_test',
            stripe_price_id='price_monthly',
            billing_cycle='monthly',
            current_period_start=timezone.now(),
            current_period_end=timezone.now(),
            status='active'
        )

        mock_event_data = {
            'id': 'sub_test',
            'customer': 'cus_test',
            'items': {'data': [{'price': {'id': 'price_monthly'}}]},
            'current_period_start': 1600000000,
            'current_period_end': 1600000000,
            'metadata': {'organization_id': str(organization.id)}
        }

        event_dict = {
            'id': 'evt_fail',
            'type': 'invoice.payment_failed',
            'data': {
                'object': mock_event_data
            }
        }
        
        mock_stripe.return_value.Webhook.construct_event.return_value = event_dict

        url = reverse('stripe-webhook')
        response = client.post(
            url, 
            data=json.dumps({'id': 'evt_fail'}), 
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_sig'
        )

        if response.status_code != 200:
            print(f"Response content: {response.content}")

        assert response.status_code == 200
        sub = Subscription.objects.get(organization=organization)
        assert sub.status == 'past_due'

    @patch('apps.billing.webhooks._get_stripe_client')
    def test_invoice_paid(self, mock_stripe, client, organization, plan):
        # Setup existing subscription as past_due
        Subscription.objects.create(
            organization=organization,
            plan=plan,
            stripe_subscription_id='sub_test',
            stripe_price_id='price_monthly',
            billing_cycle='monthly',
            current_period_start=timezone.now(),
            current_period_end=timezone.now(),
            status='past_due'
        )

        mock_event_data = {
            'id': 'inv_test',
            'subscription': 'sub_test',
            'customer': 'cus_test',
        }

        event_dict = {
            'id': 'evt_paid',
            'type': 'invoice.paid',
            'data': {
                'object': mock_event_data
            }
        }
        
        mock_stripe.return_value.Webhook.construct_event.return_value = event_dict
        
        # Mock subscription retrieval to return active status
        mock_sub = {
            'id': 'sub_test',
            'customer': 'cus_test',
            'status': 'active',
            'items': {'data': [{'price': {'id': 'price_monthly'}}]},
            'current_period_start': 1600000000,
            'current_period_end': 1600000000,
            'metadata': {'organization_id': str(organization.id)}
        }
        mock_stripe.return_value.Subscription.retrieve.return_value = mock_sub

        url = reverse('stripe-webhook')
        response = client.post(
            url, 
            data=json.dumps({'id': 'evt_paid'}), 
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE='test_sig'
        )

        if response.status_code != 200:
            print(f"Response content: {response.content}")

        assert response.status_code == 200
        sub = Subscription.objects.get(organization=organization)
        assert sub.status == 'active'
