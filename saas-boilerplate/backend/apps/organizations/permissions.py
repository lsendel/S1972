"""
Role-based permission classes for organization access control.
"""
from rest_framework import permissions
from .models import Membership


class IsOrgMember(permissions.BasePermission):
    """
    Permission check that user is a member of the organization.
    Organization can be identified by:
    - 'organization' in view.kwargs (lookup by slug)
    - 'organization_id' in view.kwargs
    - self.organization on the object being accessed
    """

    def has_permission(self, request, view):
        """Check if user has access to the organization."""
        if not request.user or not request.user.is_authenticated:
            return False

        # Get organization slug from URL
        org_slug = view.kwargs.get('slug') or view.kwargs.get('organization_slug')
        if not org_slug:
            # If no organization in URL, allow (will be checked at object level)
            return True

        # Check if user is a member of this organization
        return Membership.objects.filter(
            user=request.user,
            organization__slug=org_slug,
            is_active=True
        ).exists()

    def has_object_permission(self, request, view, obj):
        """Check if user has access to the specific object."""
        if not request.user or not request.user.is_authenticated:
            return False

        # Get organization from object
        if hasattr(obj, 'organization'):
            organization = obj.organization
        elif hasattr(obj, 'memberships'):
            # Object is an Organization
            organization = obj
        else:
            return False

        # Check membership
        return Membership.objects.filter(
            user=request.user,
            organization=organization,
            is_active=True
        ).exists()


class IsOrgAdmin(permissions.BasePermission):
    """
    Permission check that user is an admin or owner of the organization.
    """

    def has_permission(self, request, view):
        """Check if user is admin of the organization."""
        if not request.user or not request.user.is_authenticated:
            return False

        # Get organization slug from URL
        org_slug = view.kwargs.get('slug') or view.kwargs.get('organization_slug')
        if not org_slug:
            return True  # Will be checked at object level

        # Check if user is admin or owner
        return Membership.objects.filter(
            user=request.user,
            organization__slug=org_slug,
            role__in=['admin', 'owner'],
            is_active=True
        ).exists()

    def has_object_permission(self, request, view, obj):
        """Check if user is admin of the organization."""
        if not request.user or not request.user.is_authenticated:
            return False

        # Get organization from object
        if hasattr(obj, 'organization'):
            organization = obj.organization
        elif hasattr(obj, 'memberships'):
            organization = obj
        else:
            return False

        # Check admin membership
        return Membership.objects.filter(
            user=request.user,
            organization=organization,
            role__in=['admin', 'owner'],
            is_active=True
        ).exists()


class IsOrgOwner(permissions.BasePermission):
    """
    Permission check that user is the owner of the organization.
    """

    def has_permission(self, request, view):
        """Check if user is owner of the organization."""
        if not request.user or not request.user.is_authenticated:
            return False

        # Get organization slug from URL
        org_slug = view.kwargs.get('slug') or view.kwargs.get('organization_slug')
        if not org_slug:
            return True  # Will be checked at object level

        # Check if user is owner
        return Membership.objects.filter(
            user=request.user,
            organization__slug=org_slug,
            role='owner',
            is_active=True
        ).exists()

    def has_object_permission(self, request, view, obj):
        """Check if user is owner of the organization."""
        if not request.user or not request.user.is_authenticated:
            return False

        # Get organization from object
        if hasattr(obj, 'organization'):
            organization = obj.organization
        elif hasattr(obj, 'memberships'):
            organization = obj
        else:
            return False

        # Check owner membership
        return Membership.objects.filter(
            user=request.user,
            organization=organization,
            role='owner',
            is_active=True
        ).exists()


class IsOrgMemberReadOnly(permissions.BasePermission):
    """
    Allow members to read, but only admins to write.
    """

    def has_permission(self, request, view):
        """Check permission based on request method."""
        if not request.user or not request.user.is_authenticated:
            return False

        org_slug = view.kwargs.get('slug') or view.kwargs.get('organization_slug')
        if not org_slug:
            return True

        # Read operations allowed for members
        if request.method in permissions.SAFE_METHODS:
            return Membership.objects.filter(
                user=request.user,
                organization__slug=org_slug,
                is_active=True
            ).exists()

        # Write operations require admin
        return Membership.objects.filter(
            user=request.user,
            organization__slug=org_slug,
            role__in=['admin', 'owner'],
            is_active=True
        ).exists()

    def has_object_permission(self, request, view, obj):
        """Check object-level permission."""
        if not request.user or not request.user.is_authenticated:
            return False

        # Get organization
        if hasattr(obj, 'organization'):
            organization = obj.organization
        elif hasattr(obj, 'memberships'):
            organization = obj
        else:
            return False

        # Read operations allowed for members
        if request.method in permissions.SAFE_METHODS:
            return Membership.objects.filter(
                user=request.user,
                organization=organization,
                is_active=True
            ).exists()

        # Write operations require admin
        return Membership.objects.filter(
            user=request.user,
            organization=organization,
            role__in=['admin', 'owner'],
            is_active=True
        ).exists()


def get_user_role_in_org(user, organization):
    """
    Helper function to get user's role in an organization.

    Args:
        user: User instance
        organization: Organization instance or slug

    Returns:
        str: Role ('owner', 'admin', 'member') or None if not a member
    """
    try:
        if isinstance(organization, str):
            from .models import Organization
            organization = Organization.objects.get(slug=organization)

        membership = Membership.objects.get(
            user=user,
            organization=organization,
            is_active=True
        )
        return membership.role
    except Membership.DoesNotExist:
        return None


def user_can_invite_members(user, organization):
    """
    Check if user can invite members to the organization.
    Only admins and owners can invite.

    Args:
        user: User instance
        organization: Organization instance

    Returns:
        bool: True if user can invite, False otherwise
    """
    role = get_user_role_in_org(user, organization)
    return role in ['admin', 'owner']


def user_can_manage_subscription(user, organization):
    """
    Check if user can manage subscription for the organization.
    Only admins and owners can manage subscriptions.

    Args:
        user: User instance
        organization: Organization instance

    Returns:
        bool: True if user can manage subscription, False otherwise
    """
    role = get_user_role_in_org(user, organization)
    return role in ['admin', 'owner']
