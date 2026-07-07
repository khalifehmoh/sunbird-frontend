import { Center, Loader } from '@mantine/core'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useGetSessionQuery } from '../redux/features/auth/authService'
import { useAuth } from '../hooks/useAuth'

export const ProtectedRoutes = () => {
  const location = useLocation()
  const { requirePasswordChange } = useAuth()
  const { isLoading, isError } = useGetSessionQuery()

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    )
  }

  if (isError) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  if (requirePasswordChange && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  if (!requirePasswordChange && location.pathname === '/change-password') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
