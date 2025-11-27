"""
Views for subscription and billing management.
"""
import stripe
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from apps.organizations.models import Organization
from apps.organizations.permissions import IsOrgAdmin
from .models import Plan, Subscription
from .serializers import (
    PlanSerializer, SubscriptionSerializer,
    CreateCheckoutSessionSerializer, CancelSubscriptionSerializer
)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing subscription plans.
    Read-only access, no authentication required.
    """
    queryset = Plan.objects.filter(is_active=True).order_by('display_order')
    serializer_class = PlanSerializer
    permission_classes = [AllowAny]


class SubscriptionViewSet(viewsets.GenericViewSet):
    """
    API endpoints for managing subscriptions.
    """
    serializer_class = SubscriptionSerializer
    permission_classes = [IsOrgAdmin]
    lookup_field = 'organization__slug'
    lookup_url_kwarg = 'organization_slug'

    def get_queryset(self):
        """Return subscriptions for organizations where user is admin."""
        return Subscription.objects.filter(
            organization__memberships__user=self.request.user,
            organization__memberships__role__in=['admin', 'owner'],
            organization__memberships__is_active=True
        )

    @action(detail=False, methods=['get'], url_path='current')
    def current(self, request):
        """Get current subscription for an organization."""
        org_slug = request.query_params.get('organization')
        if not org_slug:
            return Response(
                {"error": "Organization slug is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        organization = get_object_or_404(
            Organization,
            slug=org_slug,
            memberships__user=request.user,
            memberships__role__in=['admin', 'owner'],
            memberships__is_active=True
        )

        try:
            subscription = Subscription.objects.get(organization=organization)
            serializer = self.get_serializer(subscription)
            return Response(serializer.data)
        except Subscription.DoesNotExist:
            return Response(
                {"message": "No active subscription"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'], url_path='checkout')
    def create_checkout_session(self, request):
        """Create a Stripe Checkout session for subscribing."""
        serializer = CreateCheckoutSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get organization
        org_slug = request.data.get('organization')
        if not org_slug:
            return Response(
                {"error": "Organization slug is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        organization = get_object_or_404(
            Organization,
            slug=org_slug,
            memberships__user=request.user,
            memberships__role__in=['admin', 'owner'],
            memberships__is_active=True
        )

        # Get plan
        plan = get_object_or_404(Plan, id=serializer.validated_data['plan_id'])

        # Get price ID based on billing cycle
        billing_cycle = serializer.validated_data['billing_cycle']
        price_id = (
            plan.stripe_price_id_monthly
            if billing_cycle == 'monthly'
            else plan.stripe_price_id_yearly
        )

        # Create or get Stripe customer
        if not organization.stripe_customer_id:
            customer = stripe.Customer.create(
                email=request.user.email,
                metadata={
                    'organization_id': str(organization.id),
                    'organization_slug': organization.slug,
                }
            )
            organization.stripe_customer_id = customer.id
            organization.save(update_fields=['stripe_customer_id'])
        else:
            customer_id = organization.stripe_customer_id

        # Build URLs
        success_url = serializer.validated_data.get(
            'success_url',
            f"{request.scheme}://{request.get_host()}/app/{organization.slug}/settings/billing?success=true"
        )
        cancel_url = serializer.validated_data.get(
            'cancel_url',
            f"{request.scheme}://{request.get_host()}/app/{organization.slug}/settings/billing?canceled=true"
        )

        # Create Checkout Session
        try:
            checkout_session = stripe.checkout.Session.create(
                customer=organization.stripe_customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'organization_id': str(organization.id),
                    'plan_id': plan.id,
                    'billing_cycle': billing_cycle,
                }
            )

            return Response({
                'checkout_url': checkout_session.url,
                'session_id': checkout_session.id
            })

        except stripe.error.StripeError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'], url_path='portal')
    def create_portal_session(self, request):
        """Create a Stripe Customer Portal session."""
        org_slug = request.data.get('organization')
        if not org_slug:
            return Response(
                {"error": "Organization slug is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        organization = get_object_or_404(
            Organization,
            slug=org_slug,
            memberships__user=request.user,
            memberships__role__in=['admin', 'owner'],
            memberships__is_active=True
        )

        if not organization.stripe_customer_id:
            return Response(
                {"error": "No Stripe customer found"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Build return URL
        return_url = f"{request.scheme}://{request.get_host()}/app/{organization.slug}/settings/billing"

        try:
            portal_session = stripe.billing_portal.Session.create(
                customer=organization.stripe_customer_id,
                return_url=return_url,
            )

            return Response({
                'portal_url': portal_session.url
            })

        except stripe.error.StripeError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'], url_path='cancel')
    def cancel_subscription(self, request):
        """Cancel a subscription."""
        serializer = CancelSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        org_slug = request.data.get('organization')
        if not org_slug:
            return Response(
                {"error": "Organization slug is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        organization = get_object_or_404(
            Organization,
            slug=org_slug,
            memberships__user=request.user,
            memberships__role__in=['admin', 'owner'],
            memberships__is_active=True
        )

        try:
            subscription = Subscription.objects.get(organization=organization)
        except Subscription.DoesNotExist:
            return Response(
                {"error": "No active subscription found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if not subscription.stripe_subscription_id:
            return Response(
                {"error": "No Stripe subscription found"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Cancel in Stripe
            cancel_at_period_end = serializer.validated_data['cancel_at_period_end']

            if cancel_at_period_end:
                # Cancel at end of billing period
                stripe.Subscription.modify(
                    subscription.stripe_subscription_id,
                    cancel_at_period_end=True
                )
                message = "Subscription will be canceled at the end of the billing period."
            else:
                # Cancel immediately
                stripe.Subscription.delete(subscription.stripe_subscription_id)
                message = "Subscription canceled immediately."

            # Update local record
            subscription.cancel_at_period_end = cancel_at_period_end
            subscription.save(update_fields=['cancel_at_period_end'])

            return Response({
                "message": message,
                "subscription": SubscriptionSerializer(subscription).data
            })

        except stripe.error.StripeError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'], url_path='resume')
    def resume_subscription(self, request):
        """Resume a canceled subscription."""
        org_slug = request.data.get('organization')
        if not org_slug:
            return Response(
                {"error": "Organization slug is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        organization = get_object_or_404(
            Organization,
            slug=org_slug,
            memberships__user=request.user,
            memberships__role__in=['admin', 'owner'],
            memberships__is_active=True
        )

        try:
            subscription = Subscription.objects.get(organization=organization)
        except Subscription.DoesNotExist:
            return Response(
                {"error": "No subscription found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if not subscription.cancel_at_period_end:
            return Response(
                {"error": "Subscription is not scheduled for cancellation"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Resume in Stripe
            stripe.Subscription.modify(
                subscription.stripe_subscription_id,
                cancel_at_period_end=False
            )

            # Update local record
            subscription.cancel_at_period_end = False
            subscription.save(update_fields=['cancel_at_period_end'])

            return Response({
                "message": "Subscription resumed successfully.",
                "subscription": SubscriptionSerializer(subscription).data
            })

        except stripe.error.StripeError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
