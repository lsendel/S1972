from rest_framework import serializers
from .models import Subscription, Plan


class PlanSerializer(serializers.ModelSerializer):
    """Serializer for the Plan model."""

    class Meta:
        model = Plan
        fields = '__all__'


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for the Subscription model."""

    plan_details = PlanSerializer(source='plan', read_only=True)

    class Meta:
        model = Subscription
        fields = ('id', 'status', 'billing_cycle', 'current_period_end', 'cancel_at_period_end', 'plan', 'plan_details')
