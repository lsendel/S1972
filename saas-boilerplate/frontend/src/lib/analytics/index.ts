/**
 * Centralized Analytics Library
 *
 * IMPORTANT: Only use GTM - no direct GA4 or Facebook Pixel scripts
 * All tracking goes through window.dataLayer
 */

// Type definitions
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

export const GTM_ID = import.meta.env.VITE_GTM_ID || ''

/**
 * Initialize Google Tag Manager
 * Call once in main.tsx
 */
export const initGTM = () => {
  if (!GTM_ID) {
    console.warn('GTM_ID not configured')
    return
  }

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || []

  // Consent Mode (default to denied, updated by cookie consent)
  window.gtag = function() { window.dataLayer.push(arguments) }
  window.gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'wait_for_update': 500
  })

  // Check for existing consent
  const consent = document.cookie.includes('gdpr-cookie-consent=true')
  if (consent) {
    window.gtag('consent', 'update', {
      'analytics_storage': 'granted',
      'ad_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted'
    })
  }

  // Load GTM script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
  document.head.appendChild(script)

  // Add dataLayer initialization
  const dataLayerScript = document.createElement('script')
  dataLayerScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({'gtm.start': new Date().getTime(), event:'gtm.js'});
  `
  document.head.insertBefore(dataLayerScript, script)

  console.info('GTM initialized:', GTM_ID)
}

/**
 * Push event to dataLayer
 * All analytics go through this function
 */
export const trackEvent = (event: string, parameters?: Record<string, any>) => {
  if (typeof window === 'undefined' || !window.dataLayer) {
    console.warn('GTM not initialized')
    return
  }

  window.dataLayer.push({
    event,
    ...parameters
  })

  if (import.meta.env.DEV) {
    console.log('🎯 Analytics Event:', event, parameters)
  }
}

/**
 * Track page view
 */
export const trackPageView = (path: string, title?: string) => {
  trackEvent('page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href
  })
}

/**
 * Set user properties
 */
export const setUserProperties = (userId: string, properties?: Record<string, any>) => {
  trackEvent('set_user_properties', {
    user_id: userId,
    ...properties
  })
}

/**
 * Clear user data (on logout)
 */
export const clearUser = () => {
  trackEvent('clear_user_data')
}
