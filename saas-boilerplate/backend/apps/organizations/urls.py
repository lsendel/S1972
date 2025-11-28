from django.urls import path, include
from rest_framework_nested import routers
from .views import OrganizationViewSet, MemberViewSet
# Import InvitationViewSet from the new app
from apps.invitations.views import InvitationViewSet

router = routers.SimpleRouter()
router.register(r'', OrganizationViewSet, basename='organization')

org_router = routers.NestedSimpleRouter(router, r'', lookup='organization')
org_router.register(r'members', MemberViewSet, basename='organization-members')
org_router.register(r'invitations', InvitationViewSet, basename='organization-invitations')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(org_router.urls)),
]
