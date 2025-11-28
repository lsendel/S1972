import { trackEvent } from './index'
import { EventNames } from './eventNames'

/**
 * Authentication Events
 */
export const AnalyticsAuth = {
  signup(method: 'email' | 'google' | 'github') {
    trackEvent(EventNames.AUTH.SIGNUP, {
      method,
      event_category: 'authentication',
      event_label: 'user_signup'
    })
  },

  login(method: 'email' | 'google' | 'github') {
    trackEvent(EventNames.AUTH.LOGIN, {
      method,
      event_category: 'authentication',
      event_label: 'user_login'
    })
  },

  logout() {
    trackEvent(EventNames.AUTH.LOGOUT, {
      event_category: 'authentication',
      event_label: 'user_logout'
    })
  },

  passwordReset() {
    trackEvent(EventNames.AUTH.PASSWORD_RESET_REQUESTED, {
      event_category: 'authentication'
    })
  },

  emailVerified() {
    trackEvent(EventNames.AUTH.EMAIL_VERIFIED, {
      event_category: 'authentication'
    })
  }
}

/**
 * Organization Events
 */
export const AnalyticsOrg = {
  created(orgId: string, orgName: string) {
    trackEvent(EventNames.ORG.CREATED, {
      organization_id: orgId,
      organization_name: orgName,
      event_category: 'organization',
      event_label: 'org_created'
    })
  },

  memberInvited(role: string) {
    trackEvent(EventNames.ORG.MEMBER_INVITED, {
      role,
      event_category: 'organization',
      event_label: 'member_invite'
    })
  },

  switched(orgId: string) {
    trackEvent(EventNames.ORG.SWITCHED, {
      organization_id: orgId,
      event_category: 'organization'
    })
  }
}

/**
 * Subscription Events (Ecommerce)
 */
export const AnalyticsSubscription = {
  viewPlans() {
    trackEvent(EventNames.SUBSCRIPTION.VIEW_PLANS, {
      item_list_name: 'Pricing Plans',
      event_category: 'ecommerce'
    })
  },

  selectPlan(planId: string, planName: string, price: number) {
    trackEvent(EventNames.SUBSCRIPTION.SELECT_PLAN, {
      items: [{
        item_id: planId,
        item_name: planName,
        price: price,
        item_category: 'subscription'
      }],
      event_category: 'ecommerce'
    })
  },

  beginCheckout(planId: string, planName: string, price: number) {
    trackEvent(EventNames.SUBSCRIPTION.BEGIN_CHECKOUT, {
      currency: 'USD',
      value: price,
      items: [{
        item_id: planId,
        item_name: planName,
        price: price,
        quantity: 1
      }],
      event_category: 'ecommerce'
    })
  },

  purchase(transactionId: string, planId: string, planName: string, price: number) {
    trackEvent(EventNames.SUBSCRIPTION.PURCHASE, {
      transaction_id: transactionId,
      currency: 'USD',
      value: price,
      items: [{
        item_id: planId,
        item_name: planName,
        price: price,
        quantity: 1
      }],
      event_category: 'ecommerce',
      event_label: 'subscription_purchase'
    })
  },

  cancelled(planId: string, reason?: string) {
    trackEvent(EventNames.SUBSCRIPTION.CANCELLED, {
      plan_id: planId,
      cancellation_reason: reason,
      event_category: 'subscription'
    })
  }
}

/**
 * Feature Usage Events
 */
export const AnalyticsFeature = {
  used(featureName: string, details?: Record<string, any>) {
    trackEvent(EventNames.ENGAGEMENT.FEATURE_USED, {
      feature_name: featureName,
      event_category: 'engagement',
      ...details
    })
  }
}

/**
 * Error Events
 */
export const AnalyticsError = {
  occurred(errorType: string, errorMessage: string, fatal: boolean = false) {
    trackEvent(EventNames.ERROR.EXCEPTION, {
      description: errorMessage,
      error_type: errorType,
      fatal,
      event_category: 'error'
    })
  }
}
