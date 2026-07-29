import { Center, Loader } from '@mantine/core'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useGetSessionQuery } from '../redux/features/auth/authService'
import { useAuth } from '../hooks/useAuth'

export const ProtectedRoutes = () => {
  return <Outlet />
}
