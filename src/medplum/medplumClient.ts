import { MedplumClient } from '@medplum/core'

/**
 * FHIR client for the `@medplum/react` components.
 *
 * Deliberately *not* pointed at Medplum. `fhirUrlPath` sends every FHIR request
 * to this platform's own API, which authorizes it with the existing session
 * cookie and forwards it internally. The browser has no Medplum URL, no Medplum
 * credentials, and no second login.
 *
 * Consequences worth knowing when reading the Medplum docs:
 * - No `clientId` and no OAuth flow here; auth is the Sunbird session cookie,
 *   which is why every request needs `credentials: 'include'`.
 * - `medplum.getProfile()` is undefined, since there is no Medplum login. That
 *   only affects components that attribute authorship (timeline comments,
 *   signatures), not read, search, or write.
 */

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is not set; add it to .env')
}

const apiUrl = new URL(apiBaseUrl)

export const medplum = new MedplumClient({
  baseUrl: apiUrl.origin,
  // e.g. `/api/v1` + `/fhir/R4` -> http://localhost:8080/api/v1/fhir/R4
  fhirUrlPath: `${apiUrl.pathname.replace(/\/$/, '')}/fhir/R4`,
  fetch: (url: string, options: RequestInit = {}) =>
    fetch(url, { ...options, credentials: 'include' }),
  onUnauthenticated: () => {
    const returnTo = `${window.location.pathname}${window.location.search}`
    window.location.assign(
      `/auth/login?reason=session&returnTo=${encodeURIComponent(returnTo)}`,
    )
  },
})
