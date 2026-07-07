import { Center, Loader } from '@mantine/core'
import { Navigate, Outlet } from 'react-router-dom'
import { useGetSessionQuery } from '../redux/features/auth/authService'

export const PublicRoutes = () => {
  const { isLoading, isSuccess } = useGetSessionQuery()

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    )
  }

  return isSuccess ? <Navigate to="/" replace /> : <Outlet />
}
