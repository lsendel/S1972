export interface UTMParams {
  utm_source?: string      // e.g., 'google', 'facebook', 'newsletter'
  utm_medium?: string      // e.g., 'cpc', 'email', 'social'
  utm_campaign?: string    // e.g., 'spring_sale', 'product_launch'
  utm_term?: string        // e.g., 'saas+platform' (paid search keywords)
  utm_content?: string     // e.g., 'banner_ad', 'text_link' (A/B test)
}

/**
 * Extract UTM parameters from URL
 */
export function getUTMParams(url?: string): UTMParams | null {
  const urlString = url || (typeof window !== 'undefined' ? window.location.href : '')
  if (!urlString) return null

  const urlObj = new URL(urlString)

  const utm: UTMParams = {}
  const params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']

  params.forEach(param => {
    const value = urlObj.searchParams.get(param)
    if (value) {
      utm[param as keyof UTMParams] = value
    }
  })

  return Object.keys(utm).length > 0 ? utm : null
}

/**
 * Save UTM parameters to localStorage (first-touch attribution)
 */
export function saveFirstTouchUTM(): void {
  if (typeof window === 'undefined') return

  const existingUTM = localStorage.getItem('first_touch_utm')
  if (existingUTM) return // Already captured

  const utm = getUTMParams()
  if (utm) {
    localStorage.setItem('first_touch_utm', JSON.stringify({
      ...utm,
      timestamp: new Date().toISOString(),
    }))
    console.info('First-touch UTM saved:', utm)
  }
}

/**
 * Save UTM parameters to sessionStorage (last-touch attribution)
 */
export function saveLastTouchUTM(): void {
  if (typeof window === 'undefined') return

  const utm = getUTMParams()
  if (utm) {
    sessionStorage.setItem('last_touch_utm', JSON.stringify({
      ...utm,
      timestamp: new Date().toISOString(),
    }))
    console.info('Last-touch UTM saved:', utm)
  }
}

/**
 * Get first-touch UTM (initial visit attribution)
 */
export function getFirstTouchUTM(): UTMParams | null {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem('first_touch_utm')
  if (!stored) return null

  try {
    const { timestamp, ...utm } = JSON.parse(stored)
    return utm
  } catch {
    return null
  }
}

/**
 * Get last-touch UTM (most recent visit attribution)
 */
export function getLastTouchUTM(): UTMParams | null {
  if (typeof window === 'undefined') return null

  const stored = sessionStorage.getItem('last_touch_utm')
  if (!stored) return null

  try {
    const { timestamp, ...utm } = JSON.parse(stored)
    return utm
  } catch {
    return null
  }
}

/**
 * Clear UTM data (on conversion)
 */
export function clearUTMData(): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem('first_touch_utm')
  sessionStorage.removeItem('last_touch_utm')
}

/**
 * Build URL with UTM parameters
 */
export function buildURLWithUTM(baseUrl: string, utm: UTMParams): string {
  const url = new URL(baseUrl)

  Object.entries(utm).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value)
    }
  })

  return url.toString()
}

/**
 * Generate UTM link for campaigns
 */
export function generateCampaignLink(
  url: string,
  source: string,
  medium: string,
  campaign: string,
  options?: {
    term?: string
    content?: string
  }
): string {
  return buildURLWithUTM(url, {
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
    utm_term: options?.term,
    utm_content: options?.content,
  })
}
