import pytest
from django.urls import reverse
from rest_framework import status
from apps.organizations.models import Organization, Membership
from apps.invitations.models import Invitation
from apps.organizations.tests.factories import OrganizationFactory, MembershipFactory, InvitationFactory
from apps.accounts.tests.factories import UserFactory

@pytest.mark.django_db
class TestTeamManagement:
    
    @pytest.fixture
    def organization(self):
        return OrganizationFactory(name="Test Org", slug="test-org")

    @pytest.fixture
    def owner(self, organization):
        user = UserFactory(email="owner@example.com")
        MembershipFactory(user=user, organization=organization, role=Membership.ROLE_OWNER)
        return user

    @pytest.fixture
    def admin(self, organization):
        user = UserFactory(email="admin@example.com")
        MembershipFactory(user=user, organization=organization, role=Membership.ROLE_ADMIN)
        return user

    @pytest.fixture
    def member(self, organization):
        user = UserFactory(email="member@example.com")
        MembershipFactory(user=user, organization=organization, role=Membership.ROLE_MEMBER)
        return user

    def test_update_member_role_as_owner(self, authenticated_client, owner, organization, member):
        """Owner can update member role."""
        authenticated_client.force_authenticate(user=owner)
        membership = Membership.objects.get(user=member, organization=organization)
        
        url = reverse('organization-members-detail', kwargs={'organization_slug': organization.slug, 'pk': membership.id})
        data = {'role': Membership.ROLE_ADMIN}
        
        response = authenticated_client.patch(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        membership.refresh_from_db()
        assert membership.role == Membership.ROLE_ADMIN

    def test_update_member_role_as_admin(self, authenticated_client, admin, organization, member):
        """Admin can update member role."""
        authenticated_client.force_authenticate(user=admin)
        membership = Membership.objects.get(user=member, organization=organization)
        
        url = reverse('organization-members-detail', kwargs={'organization_slug': organization.slug, 'pk': membership.id})
        data = {'role': Membership.ROLE_ADMIN}
        
        response = authenticated_client.patch(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        membership.refresh_from_db()
        assert membership.role == Membership.ROLE_ADMIN

    def test_update_member_role_as_member(self, authenticated_client, member, organization, owner):
        """Regular member cannot update roles."""
        authenticated_client.force_authenticate(user=member)
        membership = Membership.objects.get(user=owner, organization=organization)
        
        url = reverse('organization-members-detail', kwargs={'organization_slug': organization.slug, 'pk': membership.id})
        data = {'role': Membership.ROLE_MEMBER}
        
        response = authenticated_client.patch(url, data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_remove_member_as_owner(self, authenticated_client, owner, organization, member):
        """Owner can remove a member."""
        authenticated_client.force_authenticate(user=owner)
        membership = Membership.objects.get(user=member, organization=organization)
        
        url = reverse('organization-members-detail', kwargs={'organization_slug': organization.slug, 'pk': membership.id})
        
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Membership.objects.filter(id=membership.id).exists()

    def test_remove_last_owner_fails(self, authenticated_client, owner, organization):
        """Cannot remove the last owner."""
        authenticated_client.force_authenticate(user=owner)
        membership = Membership.objects.get(user=owner, organization=organization)
        
        url = reverse('organization-members-detail', kwargs={'organization_slug': organization.slug, 'pk': membership.id})
        
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "last owner" in str(response.data)

    def test_revoke_invitation_as_owner(self, authenticated_client, owner, organization):
        """Owner can revoke an invitation."""
        authenticated_client.force_authenticate(user=owner)
        invitation = InvitationFactory(organization=organization, status=Invitation.STATUS_PENDING)
        
        url = reverse('organization-invitations-detail', kwargs={'organization_slug': organization.slug, 'pk': invitation.id})
        
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        invitation.refresh_from_db()
        assert invitation.status == Invitation.STATUS_REVOKED

    def test_revoke_invitation_as_member(self, authenticated_client, member, organization):
        """Regular member cannot revoke invitations."""
        authenticated_client.force_authenticate(user=member)
        invitation = InvitationFactory(organization=organization, status=Invitation.STATUS_PENDING)
        
        url = reverse('organization-invitations-detail', kwargs={'organization_slug': organization.slug, 'pk': invitation.id})
        
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
