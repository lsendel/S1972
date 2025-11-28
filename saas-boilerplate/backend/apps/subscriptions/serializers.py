from rest_framework import serializers
from .models import Subscription, Plan

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'

class SubscriptionSerializer(serializers.ModelSerializer):
    plan_details = PlanSerializer(source='plan', read_only=True)

    class Meta:
        model = Subscription
        fields = ('id', 'status', 'billing_cycle', 'current_period_end', 'cancel_at_period_end', 'plan', 'plan_details')


class CheckoutSessionRequestSerializer(serializers.Serializer):
    plan_id = serializers.CharField()
    organization = serializers.SlugField()
    billing_cycle = serializers.ChoiceField(choices=['monthly', 'yearly'])
    success_url = serializers.URLField()
    cancel_url = serializers.URLField()


class BillingPortalRequestSerializer(serializers.Serializer):
    organization = serializers.SlugField()
    return_url = serializers.URLField()
