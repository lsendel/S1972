from django.urls import path
from .views import (
    PlanListView,
    SubscriptionView,
    CreateCheckoutSessionView,
    CreateBillingPortalView,
)
from .webhooks import stripe_webhook

urlpatterns = [
    path('plans/', PlanListView.as_view(), name='plan-list'),
    path('current/', SubscriptionView.as_view(), name='subscription-current'),
    path('checkout/session/', CreateCheckoutSessionView.as_view(), name='subscription-checkout-session'),
    path('billing/portal/', CreateBillingPortalView.as_view(), name='subscription-billing-portal'),
    path('webhooks/stripe/', stripe_webhook, name='stripe-webhook'),
]
