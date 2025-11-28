import pytest
from django.urls import reverse
from rest_framework import status
from apps.organizations.models import Organization, Membership
from apps.organizations.tests.factories import OrganizationFactory, MembershipFactory

@pytest.mark.django_db
class TestOrganizationAPI:
    def test_list_organizations(self, authenticated_client, user):
        # Create orgs where user is a member
        org1 = OrganizationFactory(name="Org 1")
        MembershipFactory(user=user, organization=org1, role='owner')
        
        # Create org where user is NOT a member
        OrganizationFactory(name="Org 2")

        url = reverse('organization-list')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['data']) == 1
        assert response.data['data'][0]['name'] == "Org 1"

    def test_create_organization(self, authenticated_client, user):
        url = reverse('organization-list')
        data = {'name': 'New Org'}
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert Organization.objects.count() == 1
        org = Organization.objects.first()
        assert org.name == 'New Org'
        assert org.memberships.filter(user=user, role='owner').exists()

    def test_invite_member(self, authenticated_client, organization):
        url = reverse('organization-members-invite', kwargs={'organization_slug': organization.slug})
        data = {'email': 'invitee@example.com', 'role': 'member'}
        response = authenticated_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert organization.invitations.count() == 1
        assert organization.invitations.first().email == 'invitee@example.com'
