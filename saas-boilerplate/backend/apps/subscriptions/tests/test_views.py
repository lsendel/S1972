import pytest
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch
from apps.organizations.models import Organization, Membership
from apps.subscriptions.models import Subscription, Plan
from django.utils import timezone

@pytest.mark.django_db
class TestCreateBillingPortalView:
    
    @pytest.fixture
    def organization(self, user):
        org = Organization.objects.create(name="Test Org", slug="test-org", stripe_customer_id="cus_test")
        Membership.objects.create(user=user, organization=org, role=Membership.ROLE_OWNER)
        return org

    @patch('apps.subscriptions.views.create_billing_portal_session')
    def test_create_billing_portal_success(self, mock_create_portal, authenticated_client, organization):
        mock_create_portal.return_value = {
            "url": "https://billing.stripe.com/session/portal_test",
            "id": "portal_test"
        }
        
        url = reverse('subscription-billing-portal')
        data = {
            "organization": organization.slug,
            "return_url": "http://localhost:3000/return"
        }
        
        response = authenticated_client.post(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data["portal_url"] == "https://billing.stripe.com/session/portal_test"
        mock_create_portal.assert_called_once()

    def test_create_billing_portal_not_owner(self, authenticated_client, user):
        # Create another org where user is just a member
        org = Organization.objects.create(name="Member Org", slug="member-org", stripe_customer_id="cus_test2")
        Membership.objects.create(user=user, organization=org, role=Membership.ROLE_MEMBER)
        
        url = reverse('subscription-billing-portal')
        data = {
            "organization": org.slug,
            "return_url": "http://localhost:3000/return"
        }
        
        response = authenticated_client.post(url, data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_billing_portal_no_stripe_customer(self, authenticated_client, user):
        org = Organization.objects.create(name="No Stripe Org", slug="no-stripe-org")
        Membership.objects.create(user=user, organization=org, role=Membership.ROLE_OWNER)
        
        url = reverse('subscription-billing-portal')
        data = {
            "organization": org.slug,
            "return_url": "http://localhost:3000/return"
        }
        
        response = authenticated_client.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Organization has no Stripe customer" in str(response.data["detail"])
