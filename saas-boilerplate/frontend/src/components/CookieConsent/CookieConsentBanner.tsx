import CookieConsent, { Cookies } from 'react-cookie-consent'
import { useState } from 'react'

export function CookieConsentBanner() {
  const [showDetails, setShowDetails] = useState(false)

  const handleAccept = () => {
    enableTracking()
  }

  const handleDecline = () => {
    disableTracking()
  }

  return (
    <>
      <CookieConsent
        location="bottom"
        buttonText="Accept All"
        declineButtonText="Decline"
        enableDeclineButton
        onAccept={handleAccept}
        onDecline={handleDecline}
        cookieName="gdpr-cookie-consent"
        expires={365}
        overlay
        buttonStyle={{
          background: '#4f46e5',
          color: 'white',
          fontSize: '14px',
          fontWeight: '600',
          padding: '10px 20px',
          borderRadius: '6px',
          border: 'none',
          cursor: 'pointer',
        }}
        declineButtonStyle={{
          background: 'transparent',
          color: '#6b7280',
          fontSize: '14px',
          padding: '10px 20px',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          cursor: 'pointer',
        }}
        style={{
          background: 'white',
          color: '#1f2937',
          padding: '20px',
          boxShadow: '0 -4px 6px -1px rgb(0 0 0 / 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, marginRight: '20px' }}>
          <strong>We value your privacy</strong>
          <p style={{ margin: '8px 0', fontSize: '14px', color: '#6b7280' }}>
            We use cookies to enhance your browsing experience, analyze site traffic,
            and personalize content. By clicking "Accept All", you consent to our use of cookies.
          </p>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: 'none',
              border: 'none',
              color: '#4f46e5',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '14px',
              padding: 0,
            }}
          >
            {showDetails ? 'Hide Details' : 'Cookie Settings'}
          </button>
        </div>
      </CookieConsent>

      {showDetails && (
        <CookiePreferences onClose={() => setShowDetails(false)} />
      )}
    </>
  )
}

function CookiePreferences({ onClose }: { onClose: () => void }) {
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: true,
    marketing: true,
  })

  const handleSave = () => {
    Cookies.set('cookie-preferences', JSON.stringify(preferences), { expires: 365 })

    if (preferences.analytics) {
      enableAnalytics()
    } else {
      disableAnalytics()
    }

    if (preferences.marketing) {
      enableMarketing()
    } else {
      disableMarketing()
    }

    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
      }}>
        <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>
          Cookie Preferences
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>
            <input type="checkbox" checked disabled /> Necessary Cookies
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Required for the website to function properly. Cannot be disabled.
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={preferences.analytics}
              onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
            /> Analytics Cookies
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Help us understand how visitors interact with our website (Google Analytics).
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={preferences.marketing}
              onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
            /> Marketing Cookies
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Used to track visitors across websites for advertising purposes (Facebook Pixel).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              background: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: '#4f46e5',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function enableTracking() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('analytics-enabled', 'true')
    window.localStorage.setItem('marketing-enabled', 'true')
  }
  enableAnalytics()
  enableMarketing()
}

function disableTracking() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('analytics-enabled', 'false')
    window.localStorage.setItem('marketing-enabled', 'false')
  }
  disableAnalytics()
  disableMarketing()
}

function enableAnalytics() {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      'analytics_storage': 'granted'
    })
  }
}

function disableAnalytics() {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      'analytics_storage': 'denied'
    })
  }
}

function enableMarketing() {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      'ad_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted'
    })
  }
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('consent', 'grant')
  }
}

function disableMarketing() {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied'
    })
  }
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('consent', 'revoke')
  }
}
