"""
Analytics permissions

Only superusers can access analytics endpoints.
"""
from rest_framework import permissions


class IsSuperUser(permissions.BasePermission):
    """
    Permission that only allows superusers.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser


class IsSuperUserOrReadOnly(permissions.BasePermission):
    """
    Permission that allows superusers full access,
    but only read access for others.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_superuser
