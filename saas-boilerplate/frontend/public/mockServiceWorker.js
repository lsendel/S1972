/* eslint-disable */
/* tslint:disable */

/**
 * Mock Service Worker (1.3.3).
 * This is an auto-generated file. DO NOT MODIFY.
 * Visit https://mswjs.io/docs/ for more information.
 */

const INTEGRITY_CHECKSUM = '3d6b9f06410d179a7f7404d4bf4c3c70'
const activeClientIds = new Set()

self.addEventListener('install', function () {
  self.skipWaiting()
})

self.addEventListener('activate', function () {
  self.clients.claim()
})

self.addEventListener('message', async function (event) {
  const clientId = event.source.id

  if (!clientId || !self.clients) {
    return
  }

  const client = await self.clients.get(clientId)

  if (!client) {
    return
  }

  const allClients = await self.clients.matchAll({
    type: 'window',
  })

  switch (event.data) {
    case 'KEEPALIVE_REQUEST': {
      sendToClient(client, {
        type: 'KEEPALIVE_RESPONSE',
      })
      break
    }

    case 'INTEGRITY_CHECK_REQUEST': {
      sendToClient(client, {
        type: 'INTEGRITY_CHECK_RESPONSE',
        payload: INTEGRITY_CHECKSUM,
      })
      break
    }

    case 'MOCK_ACTIVATE': {
      activeClientIds.add(clientId)

      sendToClient(client, {
        type: 'MOCKING_ENABLED',
        payload: true,
      })
      break
    }

    case 'MOCK_DEACTIVATE': {
      activeClientIds.delete(clientId)
      break
    }

    case 'CLIENT_CLOSED': {
      activeClientIds.delete(clientId)

      const remainingClients = allClients.filter((client) => {
        return client.id !== clientId
      })

      if (remainingClients.length === 0) {
        self.registration.unregister()
      }

      break
    }
  }
})

self.addEventListener('fetch', function (event) {
  const { request } = event
  const accept = request.headers.get('accept') || ''

  // Bypass server-sent events.
  if (accept.includes('text/event-stream')) {
    return
  }

  // Bypass navigation requests.
  if (request.mode === 'navigate') {
    return
  }

  // Opening the DevTools triggers the "only-if-cached" request
  // that cannot be handled by the worker. Bypass such requests.
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return
  }

  // Bypass all requests when there are no active clients.
  // Prevents the self-unregistered worked from handling requests
  // after it's been deleted (still remains active until the next reload).
  if (activeClientIds.size === 0) {
    return
  }

  // Generate unique request ID.
  const requestId = Math.random().toString(16).slice(2)

  event.respondWith(
    handleRequest(event, requestId).catch((error) => {
      if (error.name === 'NetworkError') {
        console.warn(
          '[MSW] Successfully emulated a network error for the "%s %s" request.',
          request.method,
          request.url,
        )
        return
      }

      // At this point, any exception indicates an issue with the original request/response.
      console.error(
        `\
[MSW] Caught an exception from the "%s %s" request (%s). This happens when the network is "offline", the connection cannot be established, or the request was aborted.`,
        request.method,
        request.url,
        `${error.name}: ${error.message}`,
      )
    }),
  )
})

async function handleRequest(event, requestId) {
  const client = await resolveMainClient(event)
  const response = await getResponse(event, client, requestId)

  // Send back the response clone for the "response:*" life-cycle events.
  // Ensure MSW is active and ready to handle the message, otherwise
  // this message will pend indefinitely.
  if (client && activeClientIds.has(client.id)) {
    ;(async function () {
      const clonedResponse = response.clone()

      sendToClient(client, {
        type: 'RESPONSE',
        payload: {
          requestId,
          type: clonedResponse.type,
          ok: clonedResponse.ok,
          status: clonedResponse.status,
          statusText: clonedResponse.statusText,
          body:
            clonedResponse.body === null ? null : await clonedResponse.text(),
          headers: Object.fromEntries(clonedResponse.headers.entries()),
          redirected: clonedResponse.redirected,
        },
      })
    })()
  }

  return response
}

// Resolve the main client for the given event.
// Client that issues a request doesn't necessarily equal the client
// that registered the worker. It's with the latter the worker should
// communicate with during the response resolving phase.
async function resolveMainClient(event) {
  const client = await self.clients.get(event.clientId)

  if (client?.frameType === 'top-level') {
    return client
  }

  const allClients = await self.clients.matchAll({
    type: 'window',
  })

  return allClients
    .filter((client) => {
      // Get only those clients that are currently visible.
      return client.visibilityState === 'visible'
    })
    .find((client) => {
      // Find the client ID that's recorded in the
      // set of clients that have registered the worker.
      return activeClientIds.has(client.id)
    })
}

async function getResponse(event, client, requestId) {
  const { request } = event
  const clonedRequest = request.clone()

  function passthrough() {
    // Clone the request because it might've been already used
    // (i.e. its body has been read and sent to the client).
    const headers = Object.fromEntries(clonedRequest.headers.entries())

    // Remove MSW-specific request headers so the bypassed requests
    // comply with the server's CORS preflight check.
    // Operate with the headers as an object because request "Headers"
    // are immutable.
    delete headers['x-msw-bypass']

    return fetch(clonedRequest, { headers })
  }

  // Bypass mocking when the client is not active.
  if (!client) {
    return passthrough()
  }

  // Bypass initial page load requests (i.e. static assets).
  // The absence of the immediate/parent client in the map of the active clients
  // means that MSW hasn't dispatched the "MOCK_ACTIVATE" event yet
  // and is not ready to handle requests.
  if (!activeClientIds.has(client.id)) {
    return passthrough()
  }

  // Notify the client that a request has been intercepted.
  const requestClone = request.clone()

  sendToClient(client, {
    type: 'REQUEST',
    payload: {
      id: requestId,
      url: requestClone.url,
      method: requestClone.method,
      headers: Object.fromEntries(requestClone.headers.entries()),
      cache: requestClone.cache,
      mode: requestClone.mode,
      credentials: requestClone.credentials,
      destination: requestClone.destination,
      integrity: requestClone.integrity,
      redirect: requestClone.redirect,
      referrer: requestClone.referrer,
      referrerPolicy: requestClone.referrerPolicy,
      body: await requestClone.text(),
      bodyUsed: requestClone.bodyUsed,
      keepalive: requestClone.keepalive,
    },
  })

  const clientMessage = await waitForClientMessage(requestId)

  switch (clientMessage.type) {
    case 'MOCK_RESPONSE': {
      return respondWithMock(clientMessage.data)
    }

    case 'MOCK_NOT_FOUND': {
      return passthrough()
    }

    case 'NETWORK_ERROR': {
      const { name, message } = clientMessage.data
      const networkError = new Error(message)
      networkError.name = name

      // Rejecting a "respondWith" promise emulates a network error.
      throw networkError
    }
  }

  return passthrough()
}

function sendToClient(client, message) {
  return client.postMessage(message)
}

function respondWithMock(response) {
  return new Response(response.body, {
    ...response,
    headers: response.headers,
  })
}

function waitForClientMessage(requestId) {
  return new Promise((resolve) => {
    const channel = new MessageChannel()

    channel.port1.onmessage = (event) => {
      if (event.data.requestId !== requestId) {
        return
      }

      resolve(event.data)
    }

    self.clients.get(event.source.id).then((client) => {
      client.postMessage(
        {
          type: 'REQUEST',
          payload: {
            id: requestId,
          },
        },
        [channel.port2],
      )
    })
  })
}
