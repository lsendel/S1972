from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import PlanViewSet, SubscriptionViewSet
from .webhooks import stripe_webhook

router = DefaultRouter()
router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('webhooks/stripe/', stripe_webhook, name='stripe_webhook'),
    path('', include(router.urls)),
]
