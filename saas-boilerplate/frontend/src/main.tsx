import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './api/config'
import { initializeSentry } from './lib/sentry'
import { initGTM } from './lib/analytics'
import { saveFirstTouchUTM, saveLastTouchUTM } from './lib/analytics/utm'

async function enableMocking() {
  if (import.meta.env.VITE_USE_MSW === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
    })
  }
}

// Initialize Sentry error tracking
initializeSentry()

// Initialize Google Tag Manager
initGTM()

// Capture UTM parameters on app load
saveFirstTouchUTM()
saveLastTouchUTM()

const rootElement = document.getElementById('root')!

enableMocking().finally(() => {
  // Check if we're hydrating pre-rendered content
  if (rootElement.hasChildNodes()) {
    // Hydrate pre-rendered HTML
    ReactDOM.hydrateRoot(
      rootElement,
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  } else {
    // Normal render for dev
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  }
})
