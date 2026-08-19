import { notify } from '../lib/notify'
import {
  fetchBaseQuery,
  type BaseQueryApi,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { logout, setUser } from './features/auth/authSlice'
import type { SessionProfile } from './features/auth/authTypes'
import { setAuthFlash } from './features/auth/authFlash'

export interface ErrorResponse {
  message: string
  error: string
  status: number
  timestamp: string
  errors?: string[]
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  credentials: 'include',
})

/** Shared in-flight refresh so concurrent 401s only hit /auth/refresh once. */
let refreshPromise: Promise<boolean> | null = null

function requestUrl(args: string | FetchArgs): string {
  return typeof args === 'string' ? args : args.url
}

function isAuthBootstrapUrl(url: string): boolean {
  return (
    url === '/auth/refresh' ||
    url === '/auth/login' ||
    url === '/auth/register' ||
    url === '/auth/logout'
  )
}

function buildLoginUrl(includeSessionReason: boolean): string {
  const returnTo = `${window.location.pathname}${window.location.search}`
  const params = new URLSearchParams()
  if (includeSessionReason) {
    params.set('reason', 'session')
  }
  if (returnTo && returnTo !== '/' && !returnTo.startsWith('/auth/')) {
    params.set('returnTo', returnTo)
  }
  const query = params.toString()
  return `/auth/login${query ? `?${query}` : ''}`
}

function forceLogin(api: BaseQueryApi) {
  const wasAuthenticated = Boolean(
    (api.getState() as { auth?: { isAuthenticated?: boolean } }).auth
      ?.isAuthenticated,
  )
  api.dispatch(logout())

  if (wasAuthenticated) {
    setAuthFlash({
      title: 'Session ended',
      message: 'Please sign in again to continue.',
      type: 'warning',
    })
  }

  if (!window.location.pathname.startsWith('/auth/')) {
    window.location.assign(buildLoginUrl(wasAuthenticated))
  }
}

async function tryRefreshSession(
  api: BaseQueryApi,
  extraOptions: object,
): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshResult = await rawBaseQuery(
        { url: '/auth/refresh', method: 'POST' },
        api,
        extraOptions,
      )

      if (refreshResult.error || !refreshResult.data) {
        await rawBaseQuery(
          { url: '/auth/logout', method: 'POST' },
          api,
          extraOptions,
        )
        forceLogin(api)
        return false
      }

      const profile = refreshResult.data as SessionProfile & {
        accessTokenExpiresIn?: number
        refreshTokenExpiresIn?: number
      }
      api.dispatch(
        setUser({
          username: profile.username,
          email: profile.email,
          role: profile.role,
          tenantId: profile.tenantId,
          requirePasswordChange: profile.requirePasswordChange,
          mfaEnabled: profile.mfaEnabled,
        }),
      )
      return true
    })().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

export const coreBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api: BaseQueryApi, extraOptions: object) => {
  let result = await rawBaseQuery(args, api, extraOptions)
  const url = requestUrl(args)
  const status = result.error?.status

  if (result.error && status === 401 && !isAuthBootstrapUrl(url)) {
    const refreshed = await tryRefreshSession(api, extraOptions)
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions)
    } else {
      // Refresh already forced login; suppress duplicate error toasts.
      return result
    }
  }

  if (result.error) {
    const { data, status: errorStatus } = result.error as {
      data: ErrorResponse
      status?: number
    }
    const isExpectedSessionMiss =
      url === '/auth/session' && errorStatus === 401

    if (data?.message && !isExpectedSessionMiss) {
      notify({
        type: 'error',
        title: 'Error',
        message: data.message,
        autoClose: 5000,
      })
    }
  }

  return result
}
