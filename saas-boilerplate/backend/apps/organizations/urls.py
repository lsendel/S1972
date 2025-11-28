from django.urls import path, include
from rest_framework_nested import routers
from .views import OrganizationViewSet, MemberViewSet

router = routers.SimpleRouter()
router.register(r'', OrganizationViewSet, basename='organization')

org_router = routers.NestedSimpleRouter(router, r'', lookup='organization')
org_router.register(r'members', MemberViewSet, basename='organization-members')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(org_router.urls)),
]
