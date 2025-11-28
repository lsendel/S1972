from rest_framework import routers
from .views import InvitationViewSet

# Invitations are primarily accessed via nested routes in apps/organizations/urls.py
# However, if we ever need top-level invitation management (e.g. by token), we can add it here.
urlpatterns = []
