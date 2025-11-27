from django.db import models
from uuid import uuid4
from apps.organizations.models import Organization

class Plan(models.Model):
    id = models.CharField(primary_key=True, max_length=50) # e.g. 'starter'
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
        return self.name

class Subscription(models.Model):
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
        return f"{self.organization.name} - {self.plan.name}"
