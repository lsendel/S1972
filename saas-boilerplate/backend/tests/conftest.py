"""
Pytest configuration and fixtures for testing.
"""
import pytest
from django.conf import settings
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.organizations.models import Organization, Membership
from apps.subscriptions.models import Plan, Subscription
from datetime import datetime, timedelta
from django.utils import timezone


@pytest.fixture
def api_client():
    """Provide an API client for testing."""
    return APIClient()


@pytest.fixture
def user(db):
    """Create a test user."""
    return User.objects.create_user(
        email='test@example.com',
        password='testpass123456',
        full_name='Test User',
        email_verified=True
    )


@pytest.fixture
def unverified_user(db):
    """Create an unverified test user."""
    return User.objects.create_user(
        email='unverified@example.com',
        password='testpass123456',
        full_name='Unverified User',
        email_verified=False
    )


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    return User.objects.create_superuser(
        email='admin@example.com',
        password='adminpass123456',
        full_name='Admin User'
    )


@pytest.fixture
def organization(db, user):
    """Create a test organization with the user as owner."""
    org = Organization.objects.create(
        name='Test Organization',
        slug='test-org'
    )
    Membership.objects.create(
        user=user,
        organization=org,
        role='owner'
    )
    return org


@pytest.fixture
def organization_with_member(db, user, organization):
    """Create an organization with an additional member."""
    member = User.objects.create_user(
        email='member@example.com',
        password='memberpass123456',
        full_name='Member User',
        email_verified=True
    )
    Membership.objects.create(
        user=member,
        organization=organization,
        role='member'
    )
    return organization, member


@pytest.fixture
def organization_with_admin(db, user, organization):
    """Create an organization with an admin."""
    admin = User.objects.create_user(
        email='orgadmin@example.com',
        password='adminpass123456',
        full_name='Org Admin',
        email_verified=True
    )
    Membership.objects.create(
        user=admin,
        organization=organization,
        role='admin'
    )
    return organization, admin


@pytest.fixture
def plan(db):
    """Create a test subscription plan."""
    return Plan.objects.create(
        id='starter',
        name='Starter Plan',
        description='Perfect for small teams',
        price_monthly=29.00,
        price_yearly=290.00,
        stripe_price_id_monthly='price_test_monthly',
        stripe_price_id_yearly='price_test_yearly',
        limits={'seats': 5, 'projects': 10},
        features=['feature1', 'feature2'],
        is_active=True,
        display_order=1
    )


@pytest.fixture
def subscription(db, organization, plan):
    """Create a test subscription."""
    return Subscription.objects.create(
        organization=organization,
        plan=plan,
        stripe_subscription_id='sub_test_123',
        stripe_price_id='price_test_monthly',
        billing_cycle='monthly',
        status='active',
        current_period_start=timezone.now(),
        current_period_end=timezone.now() + timedelta(days=30)
    )


@pytest.fixture
def authenticated_client(api_client, user):
    """Provide an authenticated API client."""
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """Provide an admin authenticated API client."""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def stripe_webhook_payload():
    """Sample Stripe webhook payload for testing."""
    return {
        'id': 'evt_test_123',
        'type': 'checkout.session.completed',
        'data': {
            'object': {
                'id': 'cs_test_123',
                'subscription': 'sub_test_123',
                'customer': 'cus_test_123',
                'metadata': {
                    'organization_id': '',  # Set in test
                    'plan_id': 'starter',
                    'billing_cycle': 'monthly'
                }
            }
        }
    }


# Django settings overrides for testing
@pytest.fixture(scope='session')
def django_db_setup(django_db_setup, django_db_blocker):
    """Override Django database settings for tests."""
    with django_db_blocker.unblock():
        # Any test-specific database setup can go here
        pass
