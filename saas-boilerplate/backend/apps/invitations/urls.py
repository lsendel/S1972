from rest_framework import routers
from .views import InvitationViewSet

router = routers.DefaultRouter()
router.register(r'organizations/(?P<organization_slug>[^/.]+)/invitations', InvitationViewSet, basename='organization-invitations')

urlpatterns = router.urls
