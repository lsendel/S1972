/**
 * Analytics Event Naming Convention
 *
 * Format: <object>_<action>
 * - Use snake_case
 * - Start with noun (object)
 * - Follow with verb (action)
 * - Keep concise (2-3 words)
 *
 * Examples:
 * ✅ user_signup
 * ✅ organization_created
 * ✅ subscription_purchased
 * ❌ SignUp
 * ❌ create-org
 * ❌ userHasClickedTheSignupButton
 */

export const EventNames = {
  // Authentication
  AUTH: {
    SIGNUP: 'user_signup',
    LOGIN: 'user_login',
    LOGOUT: 'user_logout',
    PASSWORD_RESET_REQUESTED: 'password_reset_requested',
    PASSWORD_RESET_COMPLETED: 'password_reset_completed',
    EMAIL_VERIFIED: 'email_verified',
    TWO_FACTOR_ENABLED: 'two_factor_enabled',
    TWO_FACTOR_DISABLED: 'two_factor_disabled',
  },

  // Organization
  ORG: {
    CREATED: 'organization_created',
    UPDATED: 'organization_updated',
    DELETED: 'organization_deleted',
    SWITCHED: 'organization_switched',
    MEMBER_INVITED: 'member_invited',
    MEMBER_JOINED: 'member_joined',
    MEMBER_REMOVED: 'member_removed',
    ROLE_CHANGED: 'member_role_changed',
  },

  // Subscription (using GA4 recommended events)
  SUBSCRIPTION: {
    VIEW_PLANS: 'view_item_list',
    SELECT_PLAN: 'select_item',
    BEGIN_CHECKOUT: 'begin_checkout',
    ADD_PAYMENT_INFO: 'add_payment_info',
    PURCHASE: 'purchase',
    CANCELLED: 'subscription_cancelled',
    UPGRADED: 'subscription_upgraded',
    DOWNGRADED: 'subscription_downgraded',
    REFUND: 'refund',
  },

  // Engagement
  ENGAGEMENT: {
    PAGE_VIEW: 'page_view',
    SEARCH: 'search',
    SHARE: 'share',
    FEATURE_USED: 'feature_used',
    TUTORIAL_BEGIN: 'tutorial_begin',
    TUTORIAL_COMPLETE: 'tutorial_complete',
    VIDEO_START: 'video_start',
    VIDEO_COMPLETE: 'video_complete',
  },

  // Errors
  ERROR: {
    EXCEPTION: 'exception',
    API_ERROR: 'api_error',
    VALIDATION_ERROR: 'validation_error',
  },

  // Marketing
  MARKETING: {
    LEAD_CAPTURED: 'generate_lead',
    TRIAL_STARTED: 'trial_started',
    DEMO_REQUESTED: 'demo_requested',
    CONTACT_SUBMITTED: 'contact_form_submitted',
  },
} as const

// Type helper for autocomplete
export type EventName = typeof EventNames[keyof typeof EventNames][keyof typeof EventNames[keyof typeof EventNames]]
