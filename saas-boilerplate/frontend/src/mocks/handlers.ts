import { http, HttpResponse } from 'msw'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For small teams getting started',
    price_monthly: '29.00',
    price_yearly: '290.00',
    features: ['Basic analytics', 'Email support', 'Projects: 10'],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing teams',
    price_monthly: '99.00',
    price_yearly: '990.00',
    features: ['Advanced analytics', 'Priority support', 'SSO'],
  },
]

const subscription = {
  plan_details: plans[1],
  status: 'active',
  billing_cycle: 'monthly',
}

export const handlers = [
  http.get('/api/v1/subscriptions/plans/', () => HttpResponse.json(plans)),
  http.get('/api/v1/subscriptions/current/', ({ request }) => {
    const url = new URL(request.url)
    if (!url.searchParams.get('organization')) {
      return HttpResponse.json({ detail: 'Organization required' }, { status: 400 })
    }
    return HttpResponse.json(subscription)
  }),
  http.post('/api/v1/subscriptions/checkout/session/', () =>
    HttpResponse.json({ checkout_url: 'https://checkout.stripe.com/test', session_id: 'cs_test' })
  ),
  http.post('/api/v1/subscriptions/billing/portal/', () =>
    HttpResponse.json({ portal_url: 'https://billing.stripe.com/test', session_id: 'bp_test' })
  ),
]
