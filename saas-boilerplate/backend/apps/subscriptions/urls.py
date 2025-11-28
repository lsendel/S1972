from django.urls import path
from .views import PlanListView, SubscriptionView
from .webhooks import stripe_webhook

urlpatterns = [
    path('plans/', PlanListView.as_view(), name='plan-list'),
    path('current/', SubscriptionView.as_view(), name='subscription-current'),
    path('webhooks/stripe/', stripe_webhook, name='stripe-webhook'),
]
