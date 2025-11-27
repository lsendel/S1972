import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from rest_framework import status
from apps.organizations.models import Organization, Membership
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestOrganizationFlow:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="orgowner@example.com", password="password123")
        self.client.force_authenticate(user=self.user)
        self.list_create_url = reverse('organization-list')

    def test_create_organization(self):
        data = {"name": "Test Org", "slug": "test-org"}
        response = self.client.post(self.list_create_url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Organization.objects.filter(slug="test-org").exists()
        # Check if user is owner/member
        org = Organization.objects.get(slug="test-org")
        assert Membership.objects.filter(organization=org, user=self.user, role="owner").exists()

    def test_list_organizations(self):
        org1 = Organization.objects.create(name="Org 1", slug="org-1")
        Membership.objects.create(organization=org1, user=self.user, role="owner")

        response = self.client.get(self.list_create_url)
        assert response.status_code == status.HTTP_200_OK
        # Standard PageNumberPagination returns 'results'
        results = response.data['results'] if 'results' in response.data else response.data

        assert len(results) >= 1
        assert results[0]["slug"] == "org-1"
