from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import OrganizationViewSet, AcceptInvitationView

router = DefaultRouter()
router.register(r'', OrganizationViewSet, basename='organization')

urlpatterns = [
    path('invitations/<str:token>/accept/', AcceptInvitationView.as_view(), name='accept-invitation'),
    path('invitations/<str:token>/', AcceptInvitationView.as_view(), name='check-invitation'),
    path('', include(router.urls)),
]
