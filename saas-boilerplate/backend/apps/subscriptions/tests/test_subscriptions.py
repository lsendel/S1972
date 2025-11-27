import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.organizations.models import Organization, Membership
from apps.subscriptions.models import Plan, Subscription

User = get_user_model()

@pytest.mark.django_db
class TestSubscriptionFlow:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="subscriber@example.com", password="password123")
        self.org = Organization.objects.create(name="Sub Org", slug="sub-org")
        Membership.objects.create(organization=self.org, user=self.user, role="owner")
        self.client.force_authenticate(user=self.user)

        self.plan = Plan.objects.create(
            id="pro-plan",
            name="Pro Plan",
            stripe_price_id_monthly="price_monthly_123",
            stripe_price_id_yearly="price_yearly_123",
            price_monthly=29.00,
            price_yearly=290.00,
            is_active=True
        )

    def test_list_plans(self):
        url = reverse('plan-list')
        self.client.logout() # Plans are public
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = response.data['results'] if 'results' in response.data else response.data
        assert len(results) >= 1
        assert results[0]['id'] == 'pro-plan'

    def test_checkout_session(self):
        # We need to verify the checkout endpoint on SubscriptionViewSet
        # Based on typical router usage, if ModelViewSet is used:
        # The url for @action(detail=False) would be /.../checkout/

        url = reverse('subscription-checkout')

        response = self.client.post(url, {"plan_id": "pro-plan", "organization_slug": "sub-org"})
        assert response.status_code == status.HTTP_200_OK
        assert "checkout_url" in response.data
