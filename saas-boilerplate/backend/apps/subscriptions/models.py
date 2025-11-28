from django.db import models
from uuid import uuid4
from apps.organizations.models import Organization


class Plan(models.Model):
    """Subscription plan model.

    Attributes:
        id: Unique identifier for the plan (e.g., 'starter').
        name: Display name of the plan.
        description: Description of the plan.
        stripe_price_id_monthly: Stripe price ID for monthly billing.
        stripe_price_id_yearly: Stripe price ID for yearly billing.
        price_monthly: Monthly price amount.
        price_yearly: Yearly price amount.
        limits: JSON field for plan limits (e.g., max users).
        features: JSON field for plan features.
        is_active: Boolean indicating if plan is available.
        display_order: Order for display purposes.
    """
    id = models.CharField(primary_key=True, max_length=50)  # e.g. 'starter'
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    stripe_price_id_monthly = models.CharField(max_length=100)
    stripe_price_id_yearly = models.CharField(max_length=100)
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2)
    price_yearly = models.DecimalField(max_digits=10, decimal_places=2)

    limits = models.JSONField(default=dict)
    features = models.JSONField(default=list)

    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)

    def __str__(self):
        """Return string representation of the plan."""
        return self.name


class Subscription(models.Model):
    """Organization subscription model.

    Attributes:
        id: UUID primary key.
        organization: The organization subscribed.
        plan: The subscription plan.
        stripe_subscription_id: Stripe subscription ID.
        stripe_price_id: Stripe price ID.
        billing_cycle: Billing cycle (monthly/yearly).
        current_period_start: Start of current billing period.
        current_period_end: End of current billing period.
        status: Current status of the subscription.
        cancel_at_period_end: Boolean indicating if subscription will cancel.
        trial_end: Datetime when trial ends.
        created_at: Datetime when subscription was created.
        updated_at: Datetime when subscription was last updated.
    """
    BILLING_CYCLE_CHOICES = (
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    )
    STATUS_CHOICES = (
        ('trialing', 'Trialing'),
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('canceled', 'Canceled'),
        ('unpaid', 'Unpaid'),
        ('incomplete', 'Incomplete'),
    )

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    organization = models.OneToOneField(Organization, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)

    stripe_subscription_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    stripe_price_id = models.CharField(max_length=255)

    billing_cycle = models.CharField(max_length=20, choices=BILLING_CYCLE_CHOICES)
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    cancel_at_period_end = models.BooleanField(default=False)
    trial_end = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        """Return string representation of the subscription."""
        return f"{self.organization.name} - {self.plan.name}"
