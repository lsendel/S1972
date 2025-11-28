# Sentry DSN Initializer Usage Guide

**Last Updated**: November 28, 2025  
**Version**: 1.0

This guide explains how to use the Sentry DSN initializers for error tracking, performance monitoring, and debugging.

---

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Frontend Usage](#frontend-usage)
4. [Backend Usage](#backend-usage)
5. [Best Practices](#best-practices)
6. [Examples](#examples)

---

## Overview

The Sentry DSN initializers provide a comprehensive, privacy-first error tracking solution for both frontend and backend.

### Features

- ✅ **Automatic Error Tracking** - Captures unhandled exceptions
- ✅ **Performance Monitoring** - Tracks slow transactions
- ✅ **Session Replay** - Visual reproduction of errors (frontend)
- ✅ **Privacy First** - Automatic PII scrubbing
- ✅ **Environment Aware** - Different sampling rates per environment
- ✅ **Context Rich** - User, organization, and custom context
- ✅ **Easy Integration** - Drop-in replacement for manual Sentry setup

### Files

- **Frontend**: `frontend/src/lib/sentry.ts`
- **Backend**: `backend/apps/core/sentry.py`

---

## Setup

### 1. Get Sentry DSN

1. Create a Sentry account at https://sentry.io/
2. Create two projects:
   - **saas-boilerplate-frontend**
   - **saas-boilerplate-backend**
3. Copy the DSN from each project

### 2. Configure Environment Variables

**Backend** (`.env.production`):
```bash
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/123456
SENTRY_ENVIRONMENT=production
RELEASE_VERSION=1.0.0  # Optional
```

**Frontend** (`.env.production`):
```bash
VITE_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/789012
VITE_ENVIRONMENT=production
VITE_RELEASE_VERSION=1.0.0  # Optional
```

### 3. Initialization

Both frontend and backend initialize automatically:

- **Frontend**: In `frontend/src/main.tsx`
- **Backend**: In `backend/config/settings/production.py`

---

## Frontend Usage

### Basic Usage

The frontend initializer is already set up in `main.tsx`. No additional configuration needed!

```typescript
import { initializeSentry } from './lib/sentry'

// Initialize (done in main.tsx)
initializeSentry()
```

### Setting User Context

```typescript
import { setSentryUser } from './lib/sentry'

// When user logs in
setSentryUser({
  id: user.id,
  email: user.email,  // Will be hashed automatically
  username: user.username,
})

// When user logs out
setSentryUser(null)
```

### Setting Organization Context

```typescript
import { setSentryOrganization } from './lib/sentry'

// When organization changes
setSentryOrganization({
  id: org.id,
  name: org.name,
  plan: org.subscription?.plan,
})
```

### Manual Error Capture

```typescript
import { captureException, captureMessage } from './lib/sentry'

try {
  // Risky operation
  processPayment(amount)
} catch (error) {
  // Capture with additional context
  captureException(error, {
    payment: {
      amount,
      currency: 'usd',
      method: 'stripe',
    }
  })
  
  // Show error to user
  showToast('Payment failed')
}
```

### Adding Breadcrumbs

```typescript
import { addSentryBreadcrumb } from './lib/sentry'

// Track user actions
addSentryBreadcrumb('User clicked checkout button', 'ui', 'info')
addSentryBreadcrumb('API request started', 'http', 'info')
addSentryBreadcrumb('Payment processing', 'payment', 'info')
```

### Performance Monitoring

```typescript
import { startTransaction } from './lib/sentry'

// Start a transaction
const transaction = startTransaction('Load Dashboard', 'pageload')

// ... do work ...

// Finish transaction
transaction.finish()
```

### Error Handling Wrapper

```typescript
import { withSentryErrorHandling } from './lib/sentry'

// Wrap async functions
const fetchUserData = withSentryErrorHandling(
  async (userId: string) => {
    const response = await api.get(`/users/${userId}`)
    return response.data
  },
  'Failed to fetch user data'
)

// Use normally
const user = await fetchUserData('123')
```

### Checking if Sentry is Active

```typescript
import { isSentryActive } from './lib/sentry'

if (isSentryActive()) {
  console.log('Sentry is tracking errors')
}
```

---

## Backend Usage

### Basic Usage

The backend initializer is already set up in production settings. No additional configuration needed!

```python
from apps.core.sentry import initialize_sentry

# Initialize (done in settings/production.py)
initialize_sentry()
```

### Setting User Context

```python
from apps.core.sentry import set_user_context

# In authentication middleware or view
def login_view(request):
    # ... authenticate user ...
    set_user_context(
        user_id=str(user.id),
        email=user.email,  # Will be hashed automatically
        is_staff=user.is_staff,
    )
```

### Setting Organization Context

```python
from apps.core.sentry import set_organization_context

# In organization middleware or view
set_organization_context(
    org_id=str(org.id),
    org_name=org.name,
    plan=org.subscription.plan if hasattr(org, 'subscription') else None,
)
```

### Manual Error Capture

```python
from apps.core.sentry import capture_exception, capture_message

try:
    # Risky operation
    process_payment(amount)
except PaymentError as e:
    # Capture with additional context
    capture_exception(
        e,
        payment={
            'amount': amount,
            'currency': 'usd',
            'method': 'stripe',
        }
    )
    # Handle error
    return Response({'error': 'Payment failed'}, status=400)
```

### Adding Breadcrumbs

```python
from apps.core.sentry import add_breadcrumb

# Track operations
add_breadcrumb('User initiated payment', category='payment', level='info')
add_breadcrumb('Stripe API called', category='http', level='info')
add_breadcrumb('Payment successful', category='payment', level='info')
```

### Performance Monitoring

```python
from apps.core.sentry import start_transaction

# Start a transaction
transaction = start_transaction('Process Subscription', op='task')

try:
    # ... do work ...
    pass
finally:
    transaction.finish()
```

### Decorator for Context

```python
from apps.core.sentry import with_sentry_context

@with_sentry_context(feature='payment_processing')
def process_payment(amount, user):
    # Errors in this function will have 'feature' tag
    stripe.Charge.create(amount=amount)
```

### Custom Context

```python
from apps.core.sentry import set_custom_context

# Add custom context
set_custom_context('subscription', {
    'plan': 'pro',
    'billing_cycle': 'monthly',
    'mrr': 49.99,
})
```

---

## Best Practices

### 1. Set Context Early

```typescript
// Frontend - Set user context on app load
useEffect(() => {
  if (user) {
    setSentryUser({
      id: user.id,
      email: user.email,
    })
  }
}, [user])
```

```python
# Backend - Use middleware
class SentryContextMiddleware:
    def __call__(self, request):
        if request.user.is_authenticated:
            set_user_context(
                user_id=str(request.user.id),
                email=request.user.email,
            )
        response = self.get_response(request)
        return response
```

### 2. Add Breadcrumbs for Important Actions

```typescript
// Frontend
addSentryBreadcrumb('User clicked subscribe button', 'ui')
addSentryBreadcrumb('Redirecting to checkout', 'navigation')
```

```python
# Backend
add_breadcrumb('Subscription created', category='subscription')
add_breadcrumb('Webhook received from Stripe', category='webhook')
```

### 3. Capture Errors with Context

```typescript
// Frontend - Good
try {
  await createSubscription()
} catch (error) {
  captureException(error, {
    subscription: {
      plan: selectedPlan,
      interval: billingInterval,
    }
  })
}

// Backend - Good
try:
    subscription = stripe.Subscription.create(...)
except stripe.error.CardError as e:
    capture_exception(e, payment_method={
        'type': 'card',
        'last4': card.last4,
    })
```

### 4. Don't Over-Capture

```typescript
// ❌ Bad - Capturing expected errors
try {
  const user = await findUser(email)
} catch (NotFoundError) {
  captureException(error)  // Don't do this
  return null
}

// ✅ Good - Only capture unexpected errors
try {
  const user = await findUser(email)
} catch (NotFoundError) {
  return null  // Expected, no need to capture
} catch (error) {
  captureException(error)  // Unexpected, capture this
  throw error
}
```

### 5. Use Breadcrumbs Wisely

```typescript
// ✅ Good breadcrumbs
addSentryBreadcrumb('User started checkout', 'flow')
addSentryBreadcrumb('Payment method validated', 'payment')
addSentryBreadcrumb('Order created', 'order')

// ❌ Bad breadcrumbs (too noisy)
addSentryBreadcrumb('User moved mouse', 'ui')
addSentryBreadcrumb('Component rendered', 'react')
```

---

## Examples

### Example 1: User Login Flow

```typescript
// Frontend
async function handleLogin(email: string, password: string) {
  addSentryBreadcrumb('User login attempt', 'auth')
  
  try {
    const user = await login(email, password)
    
    // Set user context
    setSentryUser({
      id: user.id,
      email: user.email,
    })
    
    addSentryBreadcrumb('Login successful', 'auth', 'info')
    return user
  } catch (error) {
    addSentryBreadcrumb('Login failed', 'auth', 'error')
    captureException(error, {
      auth: {
        email_domain: email.split('@')[1],
      }
    })
    throw error
  }
}
```

```python
# Backend
@api_view(['POST'])
def login_view(request):
    add_breadcrumb('Login attempt', category='auth')
    
    try:
        user = authenticate(
            email=request.data['email'],
            password=request.data['password']
        )
        
        if user:
            set_user_context(
                user_id=str(user.id),
                email=user.email,
            )
            add_breadcrumb('Login successful', category='auth', level='info')
            return Response({'token': generate_token(user)})
        else:
            add_breadcrumb('Invalid credentials', category='auth', level='warning')
            return Response({'error': 'Invalid credentials'}, status=401)
    
    except Exception as e:
        capture_exception(e)
        return Response({'error': 'Login failed'}, status=500)
```

### Example 2: Payment Processing

```typescript
// Frontend
async function processPayment(amount: number, paymentMethod: string) {
  const transaction = startTransaction('Process Payment', 'payment')
  
  addSentryBreadcrumb('Payment initiated', 'payment')
  
  try {
    const result = await stripe.confirmPayment({
      amount,
      payment_method: paymentMethod,
    })
    
    addSentryBreadcrumb('Payment successful', 'payment', 'info')
    transaction.finish()
    
    return result
  } catch (error) {
    addSentryBreadcrumb('Payment failed', 'payment', 'error')
    captureException(error, {
      payment: {
        amount,
        currency: 'usd',
      }
    })
    transaction.finish()
    throw error
  }
}
```

```python
# Backend
@with_sentry_context(feature='payment_processing')
def process_subscription_payment(subscription, amount):
    add_breadcrumb('Processing subscription payment', category='payment')
    
    transaction = start_transaction('Process Subscription Payment', op='payment')
    
    try:
        charge = stripe.Charge.create(
            amount=amount,
            currency='usd',
            customer=subscription.organization.stripe_customer_id,
        )
        
        add_breadcrumb('Payment successful', category='payment', level='info')
        transaction.finish()
        
        return charge
        
    except stripe.error.CardError as e:
        add_breadcrumb('Card declined', category='payment', level='error')
        capture_exception(e, payment={
            'amount': amount,
            'customer_id': subscription.organization.stripe_customer_id,
            'error_code': e.code,
        })
        transaction.finish()
        raise
```

---

## Configuration Options

### Frontend Environment Variables

```bash
# Required
VITE_SENTRY_DSN=https://...@sentry.io/123456

# Optional
VITE_ENVIRONMENT=production           # Default: from MODE
VITE_RELEASE_VERSION=1.0.0           # Default: 'unknown'
```

### Backend Environment Variables

```bash
# Required
SENTRY_DSN=https://...@sentry.io/123456

# Optional
SENTRY_ENVIRONMENT=production         # Default: 'production'
RELEASE_VERSION=1.0.0                # Default: 'unknown'
SENTRY_DEBUG_MODE=false              # Send errors in DEBUG mode (default: false)
```

### Sample Rates

**Production**:
- Traces: 10% (1 in 10 transactions)
- Profiles: 10% (1 in 10 transactions)
- Session Replay: 10% random, 100% on errors

**Development/Staging**:
- Traces: 100% (all transactions)
- Profiles: 100% (all transactions)
- Session Replay: 50% random, 100% on errors

---

## Troubleshooting

### Sentry Not Capturing Errors

1. **Check DSN is set**:
   ```bash
   echo $SENTRY_DSN  # Backend
   echo $VITE_SENTRY_DSN  # Frontend
   ```

2. **Check initialization**:
   ```typescript
   // Frontend
   console.log(isSentryActive())  // Should be true
   ```
   
   ```python
   # Backend
   from apps.core.sentry import is_sentry_active
   print(is_sentry_active())  # Should be True
   ```

3. **Check environment**:
   - Sentry is disabled in development by default
   - Set `SENTRY_DEBUG_MODE=true` to enable in development

### Too Many Errors

1. **Add to ignore list**:
   - **Frontend**: `ignoreErrors` in `lib/sentry.ts`
   - **Backend**: `ignore_errors` in `apps/core/sentry.py`

2. **Increase sample rate** (if using sampling):
   - Only sample errors, not warnings
   - Adjust `sample_rate` in initialization

---

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry Best Practices](https://docs.sentry.io/platforms/python/best-practices/)
- [Privacy & Security](https://docs.sentry.io/security/)

---

**Last Updated**: November 28, 2025  
**Maintained By**: Engineering Team
