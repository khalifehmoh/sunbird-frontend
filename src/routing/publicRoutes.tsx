import { Center, Loader } from '@mantine/core'
import { Navigate, Outlet, useSearchParams } from 'react-router-dom'
import { useGetSessionQuery } from '../redux/features/auth/authService'

function safeReturnPath(returnTo: string | null): string {
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo
  }
  return '/'
}

export const PublicRoutes = () => {
  const [searchParams] = useSearchParams()
  const { isLoading, isSuccess } = useGetSessionQuery()

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    )
  }

  if (isSuccess) {
    return (
      <Navigate to={safeReturnPath(searchParams.get('returnTo'))} replace />
    )
  }

  return <Outlet />
}
