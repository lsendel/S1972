import json
import logging

from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import StripeEvent
from apps.subscriptions.services import (
    _get_stripe_client,
    record_event,
    sync_subscription_from_stripe,
)

try:
    import sentry_sdk
except Exception:  # pragma: no cover - optional dependency
    sentry_sdk = None

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """
    Handle Stripe webhooks with signature verification and idempotency.
    """
    stripe = _get_stripe_client(require_api_key=False)
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except ValueError:
        logger.warning("Stripe webhook: invalid payload")
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        logger.warning("Stripe webhook: signature verification failed")
        return HttpResponse(status=400)

    event_id = event.get('id')
    event_type = event.get('type')

    if not event_id:
        logger.warning("Stripe webhook: missing event id")
        return HttpResponse(status=400)

    # Idempotency: skip events already processed
    if StripeEvent.objects.filter(event_id=event_id, status='processed').exists():
        return HttpResponse(status=200)

    try:
        _dispatch_event(event)
        record_event(event, status='processed')
    except Exception as exc:  # noqa: BLE001 - want to log any failure
        logger.exception("Stripe webhook processing failed: %s", exc)
        print(f"WEBHOOK EXCEPTION: {exc}")
        record_event(event, status='failed', message=str(exc))
        if sentry_sdk:
            with sentry_sdk.isolation_scope() as scope:
                scope.set_tag("stripe_event_id", event_id)
                scope.set_tag("stripe_event_type", event_type)
                sentry_sdk.capture_exception(exc)
        return HttpResponse(status=500)

    return HttpResponse(status=200)


def _dispatch_event(event: dict) -> None:
    """
    Route incoming events to the appropriate handler.
    """
    event_type = event.get('type')
    data_object = event.get('data', {}).get('object', {})

    if event_type == 'checkout.session.completed':
        handle_checkout_session_completed(data_object)
    elif event_type in ('customer.subscription.created', 'customer.subscription.updated'):
        handle_subscription_updated(data_object)
    elif event_type in ('customer.subscription.deleted', 'customer.subscription.canceled'):
        handle_subscription_deleted(data_object)
    elif event_type == 'invoice.payment_failed':
        # Mark subscription as past due so the app can react (e.g., restrict features)
        data_object['status'] = 'past_due'
        handle_subscription_updated(data_object)
    elif event_type == 'invoice.paid':
        handle_invoice_paid(data_object)
    else:
        logger.info("Stripe webhook: ignored event %s", event_type)


def handle_checkout_session_completed(session: dict) -> None:
    """
    When checkout completes, retrieve the subscription and sync it locally.
    """
    stripe = _get_stripe_client()
    subscription_id = session.get('subscription')
    if not subscription_id:
        logger.warning("Stripe checkout session completed without subscription id: %s", json.dumps(session))
        return

    subscription = stripe.Subscription.retrieve(
        subscription_id,
        expand=['latest_invoice.payment_intent', 'items.data.price.product'],
    )
    sync_subscription_from_stripe(subscription)


def handle_subscription_updated(subscription: dict) -> None:
    logger.info("Stripe subscription updated: %s", subscription.get('id'))
    sync_subscription_from_stripe(subscription)


def handle_subscription_deleted(subscription: dict) -> None:
    logger.info("Stripe subscription deleted: %s", subscription.get('id'))
    subscription['status'] = 'canceled'
    sync_subscription_from_stripe(subscription)


def handle_invoice_paid(invoice: dict) -> None:
    """
    When an invoice is paid, ensure the subscription status is active.
    """
    stripe = _get_stripe_client()
    subscription_id = invoice.get('subscription')
    if not subscription_id:
        return

    # We fetch the subscription to get the latest state including current_period_end
    subscription = stripe.Subscription.retrieve(
        subscription_id,
        expand=['latest_invoice.payment_intent', 'items.data.price.product'],
    )
    sync_subscription_from_stripe(subscription)
