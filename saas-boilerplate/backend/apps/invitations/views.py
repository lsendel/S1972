from rest_framework import viewsets, mixins, status, permissions
from rest_framework.response import Response
from .models import Invitation
from .serializers import InvitationSerializer
from apps.organizations.models import Membership

class InvitationViewSet(mixins.RetrieveModelMixin,
                        mixins.DestroyModelMixin,
                        mixins.ListModelMixin,
                        viewsets.GenericViewSet):
    serializer_class = InvitationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        org_slug = self.kwargs.get('organization_slug')
        return Invitation.objects.filter(
            organization__slug=org_slug,
            status=Invitation.STATUS_PENDING
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Check permissions
        membership = instance.organization.memberships.filter(user=request.user).first()
        if not membership or membership.role not in [Membership.ROLE_OWNER, Membership.ROLE_ADMIN]:
             return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        instance.status = Invitation.STATUS_REVOKED
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
