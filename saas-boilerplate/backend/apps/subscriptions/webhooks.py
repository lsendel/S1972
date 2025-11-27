from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.conf import settings
import stripe

@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    if not sig_header:
         return HttpResponse(status=400)

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        return HttpResponse(status=400)

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        # handle_checkout_session(session)
    elif event['type'] == 'invoice.payment_succeeded':
        invoice = event['data']['object']
        # handle_payment_succeeded(invoice)
    # ... handle other events

    return HttpResponse(status=200)
