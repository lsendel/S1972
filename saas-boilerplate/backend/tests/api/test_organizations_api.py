import pytest
from django.urls import reverse
from rest_framework import status
from apps.organizations.models import Organization, Membership

@pytest.mark.django_db
class TestOrganizationAPI:
    def test_list_organizations(self, api_client, organization, admin_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('organization-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['meta']['total_count'] == 1
        assert response.data['data'][0]['name'] == organization.name

    def test_create_organization(self, api_client, user):
        api_client.force_authenticate(user=user)
        url = reverse('organization-list')
        data = {
            'name': 'New Org',
            'slug': 'new-org'
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Organization.objects.count() == 1
        assert Membership.objects.filter(user=user, role='owner').exists()

    def test_get_organization_details(self, api_client, organization, admin_user):
        api_client.force_authenticate(user=admin_user)
        url = reverse('organization-detail', kwargs={'slug': organization.slug})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == organization.name
        assert response.data['role'] == 'owner'

    def test_get_organization_unauthorized(self, api_client, organization, user):
        # User is not a member
        api_client.force_authenticate(user=user)
        url = reverse('organization-detail', kwargs={'slug': organization.slug})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND # Filtered out by queryset
