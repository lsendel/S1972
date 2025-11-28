import pytest
from rest_framework.test import APIClient
from apps.accounts.tests.factories import UserFactory
from apps.organizations.tests.factories import OrganizationFactory, MembershipFactory

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user():
    return UserFactory()

@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def organization(user):
    org = OrganizationFactory()
    MembershipFactory(user=user, organization=org, role='owner')
    return org
