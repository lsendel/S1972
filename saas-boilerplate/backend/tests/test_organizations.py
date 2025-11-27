"""
Tests for organization management and permissions.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from apps.organizations.models import Organization, Membership
from .factories import UserFactory, OrganizationFactory, MembershipFactory


@pytest.mark.django_db
class TestOrganizationList:
    """Tests for listing organizations."""

    def test_list_user_organizations(self, authenticated_client, user, organization):
        """Test listing organizations where user is a member."""
        url = reverse('organization-list')

        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['slug'] == organization.slug

    def test_list_organizations_unauthenticated(self, api_client):
        """Test listing organizations without authentication fails."""
        url = reverse('organization-list')

        response = api_client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestOrganizationCreate:
    """Tests for creating organizations."""

    def test_create_organization(self, authenticated_client):
        """Test creating a new organization."""
        url = reverse('organization-list')
        data = {
            'name': 'New Organization',
            'slug': 'new-org'
        }

        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert Organization.objects.filter(slug='new-org').exists()

        # User should be owner
        org = Organization.objects.get(slug='new-org')
        membership = Membership.objects.get(user=authenticated_client.handler._force_user, organization=org)
        assert membership.role == 'owner'

    def test_create_organization_duplicate_slug(self, authenticated_client, organization):
        """Test creating organization with duplicate slug fails."""
        url = reverse('organization-list')
        data = {
            'name': 'Another Organization',
            'slug': organization.slug  # Duplicate
        }

        response = authenticated_client.post(url, data, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestOrganizationRetrieve:
    """Tests for retrieving organization details."""

    def test_retrieve_organization(self, authenticated_client, organization):
        """Test retrieving organization details."""
        url = reverse('organization-detail', kwargs={'slug': organization.slug})

        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['slug'] == organization.slug
        assert response.data['name'] == organization.name

    def test_retrieve_organization_not_member(self, api_client):
        """Test retrieving organization as non-member fails."""
        other_user = UserFactory.create()
        org = OrganizationFactory.create(owner=other_user)

        api_client.force_authenticate(user=UserFactory.create())
        url = reverse('organization-detail', kwargs={'slug': org.slug})

        response = api_client.get(url)

        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]


@pytest.mark.django_db
class TestOrganizationUpdate:
    """Tests for updating organizations."""

    def test_update_organization_as_owner(self, authenticated_client, user, organization):
        """Test updating organization as owner."""
        url = reverse('organization-detail', kwargs={'slug': organization.slug})
        data = {'name': 'Updated Name'}

        response = authenticated_client.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        organization.refresh_from_db()
        assert organization.name == 'Updated Name'

    def test_update_organization_as_admin(self, api_client, organization):
        """Test updating organization as admin."""
        admin = UserFactory.create()
        MembershipFactory.create(user=admin, organization=organization, role='admin')

        api_client.force_authenticate(user=admin)
        url = reverse('organization-detail', kwargs={'slug': organization.slug})
        data = {'name': 'Updated by Admin'}

        response = api_client.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK

    def test_update_organization_as_member_fails(self, api_client, organization):
        """Test updating organization as regular member fails."""
        member = UserFactory.create()
        MembershipFactory.create(user=member, organization=organization, role='member')

        api_client.force_authenticate(user=member)
        url = reverse('organization-detail', kwargs={'slug': organization.slug})
        data = {'name': 'Should Fail'}

        response = api_client.patch(url, data, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestOrganizationDelete:
    """Tests for deleting organizations."""

    def test_delete_organization_as_owner(self, authenticated_client, user, organization):
        """Test deleting organization as owner."""
        url = reverse('organization-detail', kwargs={'slug': organization.slug})

        response = authenticated_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Organization.objects.filter(slug=organization.slug).exists()

    def test_delete_organization_as_admin_fails(self, api_client, organization):
        """Test deleting organization as admin fails (only owner can delete)."""
        admin = UserFactory.create()
        MembershipFactory.create(user=admin, organization=organization, role='admin')

        api_client.force_authenticate(user=admin)
        url = reverse('organization-detail', kwargs={'slug': organization.slug})

        response = api_client.delete(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Organization.objects.filter(slug=organization.slug).exists()


@pytest.mark.django_db
class TestOrganizationPermissions:
    """Tests for organization role-based permissions."""

    def test_owner_has_all_permissions(self, api_client, organization):
        """Test that owner can perform all operations."""
        owner = organization.memberships.get(role='owner').user

        api_client.force_authenticate(user=owner)

        # Can retrieve
        url = reverse('organization-detail', kwargs={'slug': organization.slug})
        assert api_client.get(url).status_code == status.HTTP_200_OK

        # Can update
        assert api_client.patch(url, {'name': 'New'}, format='json').status_code == status.HTTP_200_OK

        # Can delete
        assert api_client.delete(url).status_code == status.HTTP_204_NO_CONTENT

    def test_admin_permissions(self, api_client, organization):
        """Test admin permissions."""
        admin = UserFactory.create()
        MembershipFactory.create(user=admin, organization=organization, role='admin')

        api_client.force_authenticate(user=admin)
        url = reverse('organization-detail', kwargs={'slug': organization.slug})

        # Can retrieve
        assert api_client.get(url).status_code == status.HTTP_200_OK

        # Can update
        assert api_client.patch(url, {'name': 'Updated'}, format='json').status_code == status.HTTP_200_OK

        # Cannot delete
        organization.refresh_from_db()  # Refresh after update
        assert api_client.delete(url).status_code == status.HTTP_403_FORBIDDEN

    def test_member_permissions(self, api_client, organization):
        """Test member permissions (read-only)."""
        member = UserFactory.create()
        MembershipFactory.create(user=member, organization=organization, role='member')

        api_client.force_authenticate(user=member)
        url = reverse('organization-detail', kwargs={'slug': organization.slug})

        # Can retrieve
        assert api_client.get(url).status_code == status.HTTP_200_OK

        # Cannot update
        assert api_client.patch(url, {'name': 'Fail'}, format='json').status_code == status.HTTP_403_FORBIDDEN

        # Cannot delete
        assert api_client.delete(url).status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestMembershipManagement:
    """Tests for managing organization memberships."""

    def test_create_multiple_memberships(self, organization):
        """Test creating multiple memberships for an organization."""
        users = UserFactory.create_batch(3)

        for user in users:
            MembershipFactory.create(
                user=user,
                organization=organization,
                role='member'
            )

        assert organization.memberships.count() == 4  # 3 new + 1 owner

    def test_unique_membership_constraint(self, user, organization):
        """Test that user can't have duplicate membership in same org."""
        # User already has membership from fixture
        with pytest.raises(Exception):  # Should raise IntegrityError
            MembershipFactory.create(
                user=user,
                organization=organization,
                role='admin'
            )
