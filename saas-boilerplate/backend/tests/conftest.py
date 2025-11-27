import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.organizations.models import Organization, Membership

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user():
    return User.objects.create_user(
        email='test@example.com',
        password='password123',
        full_name='Test User'
    )

@pytest.fixture
def admin_user():
    return User.objects.create_user(
        email='admin@example.com',
        password='password123',
        full_name='Admin User'
    )

@pytest.fixture
def organization(admin_user):
    org = Organization.objects.create(
        name='Test Org',
        slug='test-org'
    )
    Membership.objects.create(
        user=admin_user,
        organization=org,
        role='owner'
    )
    return org

@pytest.fixture
def member_user(organization):
    user = User.objects.create_user(
        email='member@example.com',
        password='password123',
        full_name='Member User'
    )
    Membership.objects.create(
        user=user,
        organization=organization,
        role='member'
    )
    return user
