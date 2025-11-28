import logging
from datetime import datetime, timezone
from typing import Optional

import stripe
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import transaction
from django.utils import timezone as django_timezone

from apps.organizations.models import Organization
from .models import Plan, Subscription, StripeEvent

logger = logging.getLogger(__name__)


def _get_stripe_client(*, require_api_key: bool = True) -> stripe:
    """
    Configure and return the shared Stripe client.
    Ensures a pinned API version for predictable payloads.
    """
    if settings.STRIPE_SECRET_KEY:
        stripe.api_key = settings.STRIPE_SECRET_KEY
    elif require_api_key:
        raise ImproperlyConfigured("STRIPE_SECRET_KEY is not configured")

    if getattr(settings, "STRIPE_API_VERSION", None):
        stripe.api_version = settings.STRIPE_API_VERSION
    return stripe


def _map_status(stripe_status: str) -> str:
    """
    Map Stripe subscription statuses to internal representation.
    """
    mapping = {
        "trialing": "trialing",
        "active": "active",
        "past_due": "past_due",
        "canceled": "canceled",
        "unpaid": "unpaid",
        "incomplete": "incomplete",
        "incomplete_expired": "incomplete",
        "paused": "past_due",
    }
    return mapping.get(stripe_status, "active")


def _coerce_timestamp(value: Optional[int]) -> Optional[datetime]:
    if not value:
        return None
    return datetime.fromtimestamp(value, tz=timezone.utc)


def _resolve_plan_from_price_id(price_id: str) -> Optional[tuple[Plan, str]]:
    """
    Resolve a Plan from a Stripe Price ID and return the billing cycle.
    """
    plan = Plan.objects.filter(stripe_price_id_monthly=price_id, is_active=True).first()
    if plan:
        return plan, "monthly"

    plan = Plan.objects.filter(stripe_price_id_yearly=price_id, is_active=True).first()
    if plan:
        return plan, "yearly"

    return None


def ensure_customer(organization: Organization, email: Optional[str] = None) -> str:
    """
    Ensure a Stripe Customer exists for the organization and return its ID.
    """
    client = _get_stripe_client()

    if organization.stripe_customer_id:
        return organization.stripe_customer_id

    customer = client.Customer.create(
        email=email,
        name=organization.name,
        metadata={
            "organization_id": str(organization.id),
            "organization_slug": organization.slug,
        },
    )
    organization.stripe_customer_id = customer.id
    organization.save(update_fields=["stripe_customer_id"])
    return customer.id


def create_checkout_session(
    *,
    organization: Organization,
    plan: Plan,
    billing_cycle: str,
    success_url: str,
    cancel_url: str,
    user_email: str,
) -> stripe.checkout.Session:
    """
    Create a Stripe Checkout Session for a subscription.
    """
    client = _get_stripe_client()

    price_id = (
        plan.stripe_price_id_monthly if billing_cycle == "monthly" else plan.stripe_price_id_yearly
    )
    customer_id = ensure_customer(organization, email=user_email)

    metadata = {
        "organization_id": str(organization.id),
        "organization_slug": organization.slug,
        "plan_id": plan.id,
        "billing_cycle": billing_cycle,
    }

    session = client.checkout.Session.create(
        mode="subscription",
        customer=customer_id,
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        allow_promotion_codes=True,
        client_reference_id=str(organization.id),
        subscription_data={"metadata": metadata},
        metadata=metadata,
    )
    return session


def create_billing_portal_session(*, organization: Organization, return_url: str) -> dict:
    """
    Create a Stripe Billing Portal session to allow customers to manage subscriptions.
    """
    client = _get_stripe_client()
    if not organization.stripe_customer_id:
        raise ValueError("Organization has no Stripe customer; create a subscription first.")

    return client.billing_portal.Session.create(
        customer=organization.stripe_customer_id,
        return_url=return_url,
    )


@transaction.atomic
def sync_subscription_from_stripe(subscription: dict) -> Subscription:
    """
    Upsert a local Subscription from a Stripe subscription object.
    """
    price = subscription["items"]["data"][0]["price"]
    price_id = price["id"]

    plan_resolved = _resolve_plan_from_price_id(price_id)
    if not plan_resolved:
        raise ValueError(f"No matching plan for Stripe price {price_id}")

    plan, billing_cycle = plan_resolved

    metadata = subscription.get("metadata") or {}
    org = None
    org_id = metadata.get("organization_id")
    org_slug = metadata.get("organization_slug")
    if org_id:
        org = Organization.objects.filter(id=org_id).first()
    if not org and org_slug:
        org = Organization.objects.filter(slug=org_slug).first()
    if not org:
        org = Organization.objects.filter(stripe_customer_id=subscription.get("customer")).first()

    if not org:
        raise ValueError("Unable to match subscription to organization")

    if not org.stripe_customer_id and subscription.get("customer"):
        org.stripe_customer_id = subscription["customer"]
        org.save(update_fields=["stripe_customer_id"])

    status = _map_status(subscription.get("status"))

    defaults = {
        "plan": plan,
        "stripe_subscription_id": subscription.get("id"),
        "stripe_price_id": price_id,
        "billing_cycle": billing_cycle,
        "current_period_start": _coerce_timestamp(subscription.get("current_period_start")),
        "current_period_end": _coerce_timestamp(subscription.get("current_period_end")),
        "status": status,
        "cancel_at_period_end": subscription.get("cancel_at_period_end", False),
        "trial_end": _coerce_timestamp(subscription.get("trial_end")),
    }

    subscription_obj, _ = Subscription.objects.update_or_create(
        organization=org,
        defaults=defaults,
    )
    return subscription_obj


def record_event(event: dict, *, status: str, message: str | None = None) -> None:
    """
    Persist a webhook event for idempotency and auditability.
    """
    event_id = event.get("id", "")
    StripeEvent.objects.update_or_create(
        event_id=event_id,
        defaults={
            "type": event.get("type", "unknown"),
            "payload": event,
            "status": status,
            "message": message or "",
        },
    )
