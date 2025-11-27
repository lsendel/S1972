from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Plan, Subscription
from .serializers import PlanSerializer, SubscriptionSerializer

class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Plan.objects.filter(is_active=True).order_by('display_order')
    serializer_class = PlanSerializer
    permission_classes = [permissions.AllowAny]

class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subscription.objects.filter(organization__memberships__user=self.request.user)

    @action(detail=False, methods=['post'])
    def checkout(self, request):
        return Response({
            'checkout_url': 'https://checkout.stripe.com/mock-checkout',
            'session_id': 'mock_session_123'
        })
