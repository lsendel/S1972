"""Analytics permissions.

Only superusers can access analytics endpoints.
"""
from rest_framework import permissions


class IsSuperUser(permissions.BasePermission):
    """Permission that only allows superusers."""

    def has_permission(self, request, view):
        """Check if the user is a superuser.

        Args:
            request: The request object.
            view: The view object.

        Returns:
            bool: True if user is authenticated and is a superuser.
        """
        return request.user and request.user.is_authenticated and request.user.is_superuser


class IsSuperUserOrReadOnly(permissions.BasePermission):
    """Permission that allows superusers full access, but only read access for others."""

    def has_permission(self, request, view):
        """Check if the user has permission.

        Args:
            request: The request object.
            view: The view object.

        Returns:
            bool: True if method is safe and user is authenticated, or if user is superuser.
        """
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_superuser
