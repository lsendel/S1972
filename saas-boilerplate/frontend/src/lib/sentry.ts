/**
 * Sentry Error Tracking Initialization
 * 
 * Configures Sentry for error tracking, performance monitoring, and session replay
 * with privacy-first defaults and environment-aware configuration.
 */

import * as Sentry from '@sentry/react'

/**
 * Sentry configuration interface
 */
interface SentryConfig {
  dsn?: string
  environment?: string
  release?: string
  tracesSampleRate?: number
  replaysSessionSampleRate?: number
  replaysOnErrorSampleRate?: number
  enabled?: boolean
}

/**
 * Get Sentry configuration from environment variables
 */
function getSentryConfig(): SentryConfig {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  const environment = import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || 'development'
  const release = import.meta.env.VITE_RELEASE_VERSION || 'unknown'

  // Only enable Sentry if DSN is provided and we're not in development
  const enabled = !!dsn && environment !== 'development'

  return {
    dsn,
    environment,
    release,
    enabled,
    // Higher sample rate in non-production for better debugging
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Session replay settings
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 0.5,
    replaysOnErrorSampleRate: 1.0, // Always capture sessions with errors
  }
}

/**
 * Initialize Sentry error tracking
 * 
 * @returns True if Sentry was initialized successfully
 */
export function initializeSentry(): boolean {
  const config = getSentryConfig()

  // Skip initialization if disabled or no DSN
  if (!config.enabled || !config.dsn) {
    console.info('[Sentry] Skipped initialization (disabled or no DSN)')
    return false
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,

      // Track navigation timing
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/.*\.yourdomain\.com/,
        /^https:\/\/api\.yourdomain\.com/,
      ],

      // Integrations
      integrations: [
        // Performance monitoring
        Sentry.browserTracingIntegration(),

        // Session replay with privacy settings
        Sentry.replayIntegration({
          maskAllText: true,        // Mask all text content
          blockAllMedia: true,       // Block all images/video/audio
          maskAllInputs: true,       // Mask all input values
          // Don't capture network bodies (may contain sensitive data)
          networkDetailAllowUrls: [],
        }),

        // Browser profiling (beta)
        Sentry.browserProfilingIntegration(),
      ],

      // Performance Monitoring
      tracesSampleRate: config.tracesSampleRate,

      // Profiling (pairs with tracesSampleRate)
      profilesSampleRate: config.tracesSampleRate,

      // Session Replay
      replaysSessionSampleRate: config.replaysSessionSampleRate,
      replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,

      // Privacy & Data Scrubbing
      beforeSend(event, _hint) {
        // Remove sensitive data from events
        if (event.request) {
          // Remove cookies
          delete event.request.cookies

          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers['Authorization']
            delete event.request.headers['Cookie']
            delete event.request.headers['X-CSRF-Token']
            delete event.request.headers['X-CSRFToken']
          }

          // Scrub sensitive query parameters
          if (event.request.query_string) {
            const sensitiveParams = ['token', 'key', 'secret', 'password', 'api_key']
            sensitiveParams.forEach(param => {
              if (typeof event.request!.query_string === 'string') {
                event.request!.query_string = event.request!.query_string.replace(
                  new RegExp(`${param}=[^&]*`, 'gi'),
                  `${param}=REDACTED`
                )
              }
            })
          }
        }

        // Remove breadcrumbs with sensitive data
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
            if (breadcrumb.category === 'console') {
              // Don't send console breadcrumbs (may contain sensitive data)
              return { ...breadcrumb, message: '[Filtered]' }
            }
            return breadcrumb
          })
        }

        return event
      },

      // Ignore certain errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',

        // Network errors
        'Network request failed',
        'NetworkError',
        'Failed to fetch',
        'Load failed',

        // User cancelled actions
        'The user aborted a request',
        'AbortError',

        // Third-party script errors
        'Script error',
        'ResizeObserver loop limit exceeded',

        // Common non-actionable errors
        'Non-Error promise rejection captured',
      ],

      // Deny URLs to ignore errors from
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,

        // Third-party scripts
        /googleapis\.com/i,
        /googletagmanager\.com/i,
        /google-analytics\.com/i,
      ],
    })

    console.info(`[Sentry] Initialized successfully (${config.environment})`)
    return true
  } catch (error) {
    console.error('[Sentry] Initialization failed:', error)
    return false
  }
}

/**
 * Set user context for error tracking
 * 
 * @param user - User information (should not include PII)
 */
export function setSentryUser(user: {
  id: string
  email?: string
  username?: string
  [key: string]: any
} | null) {
  if (!user) {
    Sentry.setUser(null)
    return
  }

  // Only set non-sensitive user data
  Sentry.setUser({
    id: user.id,
    // Hash or truncate email for privacy
    email: user.email ? hashEmail(user.email) : undefined,
    username: user.username,
  })
}

/**
 * Set organization context
 * 
 * @param org - Organization information
 */
export function setSentryOrganization(org: {
  id: string
  name?: string
  plan?: string
  [key: string]: any
} | null) {
  if (!org) {
    Sentry.setContext('organization', null)
    return
  }

  Sentry.setContext('organization', {
    id: org.id,
    name: org.name,
    plan: org.plan,
  })
}

/**
 * Add a breadcrumb to track user actions
 * 
 * @param message - Breadcrumb message
 * @param category - Category (e.g., 'ui', 'navigation', 'http')
 * @param level - Severity level
 */
export function addSentryBreadcrumb(
  message: string,
  category: string = 'custom',
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Capture an exception manually
 * 
 * @param error - Error to capture
 * @param context - Additional context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.withScope(scope => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value)
      })
      Sentry.captureException(error)
    })
  } else {
    Sentry.captureException(error)
  }
}

/**
 * Capture a message manually
 * 
 * @param message - Message to capture
 * @param level - Severity level
 * @param context - Additional context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) {
  if (context) {
    Sentry.withScope(scope => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value)
      })
      Sentry.captureMessage(message, level)
    })
  } else {
    Sentry.captureMessage(message, level)
  }
}

/**
 * Start a new transaction for performance monitoring
 * 
 * @param name - Transaction name
 * @param op - Operation type
 */
export function startTransaction(name: string, op: string = 'custom') {
  return Sentry.startInactiveSpan({
    name,
    op,
  })
}

/**
 * Hash email for privacy (simple hash, not for security)
 */
function hashEmail(email: string): string {
  const [username, domain] = email.split('@')
  if (!domain) return email

  // Show first 2 chars of username, rest is asterisks
  const maskedUsername = username.length > 2
    ? username.slice(0, 2) + '*'.repeat(username.length - 2)
    : username

  return `${maskedUsername}@${domain}`
}

/**
 * Wrap an async function with Sentry error handling
 * 
 * @param fn - Async function to wrap
 * @param errorMessage - Custom error message
 */
export function withSentryErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMessage?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof Error) {
        if (errorMessage) {
          captureMessage(errorMessage, 'error', {
            originalError: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          })
        } else {
          captureException(error)
        }
      }
      throw error
    }
  }) as T
}

/**
 * Check if Sentry is initialized and active
 */
export function isSentryActive(): boolean {
  const client = Sentry.getClient()
  return client !== undefined && client.getOptions().enabled !== false
}

// Export Sentry instance for advanced usage
export { Sentry }
