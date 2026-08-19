import { Center, Loader } from '@mantine/core'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useGetSessionQuery } from '../redux/features/auth/authService'
import { useAuth } from '../hooks/useAuth'
import { setAuthFlash } from '../redux/features/auth/authFlash'

export const ProtectedRoutes = () => {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { isLoading, isError } = useGetSessionQuery()

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    )
  }

  if (!isAuthenticated || isError) {
    const returnTo = `${location.pathname}${location.search}`
    const params = new URLSearchParams()
    if (isError) {
      params.set('reason', 'session')
      setAuthFlash({
        title: 'Session ended',
        message: 'Please sign in again to continue.',
        type: 'warning',
      })
    }
    if (returnTo && returnTo !== '/' && !returnTo.startsWith('/auth/')) {
      params.set('returnTo', returnTo)
    }
    const query = params.toString()
    return (
      <Navigate to={`/auth/login${query ? `?${query}` : ''}`} replace />
    )
  }

  return <Outlet />
}
