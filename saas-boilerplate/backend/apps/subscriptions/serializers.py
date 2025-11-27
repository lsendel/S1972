"""
Serializers for subscription and billing management.
"""
from rest_framework import serializers
from .models import Plan, Subscription


class PlanSerializer(serializers.ModelSerializer):
    """Serializer for subscription plans."""

    class Meta:
        model = Plan
        fields = (
            'id', 'name', 'description',
            'price_monthly', 'price_yearly',
            'stripe_price_id_monthly', 'stripe_price_id_yearly',
            'limits', 'features', 'is_active', 'display_order'
        )
        read_only_fields = ('id',)


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for subscriptions with plan details."""

    plan_details = PlanSerializer(source='plan', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = Subscription
        fields = (
            'id', 'organization', 'organization_name',
            'plan', 'plan_details',
            'stripe_subscription_id', 'stripe_price_id',
            'billing_cycle', 'status',
            'current_period_start', 'current_period_end',
            'cancel_at_period_end', 'trial_end',
            'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'organization', 'stripe_subscription_id',
            'stripe_price_id', 'current_period_start',
            'current_period_end', 'status', 'trial_end',
            'created_at', 'updated_at'
        )


class CreateCheckoutSessionSerializer(serializers.Serializer):
    """Serializer for creating a Stripe Checkout session."""

    plan_id = serializers.CharField()
    billing_cycle = serializers.ChoiceField(choices=['monthly', 'yearly'])
    success_url = serializers.URLField(required=False)
    cancel_url = serializers.URLField(required=False)

    def validate_plan_id(self, value):
        """Validate that the plan exists and is active."""
        try:
            plan = Plan.objects.get(id=value, is_active=True)
        except Plan.DoesNotExist:
            raise serializers.ValidationError("Invalid plan ID or plan is not active.")
        return value


class CancelSubscriptionSerializer(serializers.Serializer):
    """Serializer for canceling a subscription."""

    cancel_at_period_end = serializers.BooleanField(default=True)
    reason = serializers.CharField(required=False, allow_blank=True)
