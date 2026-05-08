import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RootLayout } from '../layouts/RootLayout/RootLayout'
import { HomePage } from '../pages/HomePage/HomePage'
import { PlaceholderPage } from '../pages/PlaceholderPage/PlaceholderPage'
import { LoginPage } from '../pages/LoginPage/LoginPage'
import { RegisterPage } from '../pages/RegisterPage/RegisterPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage/ForgotPasswordPage'
import { ProtectedRoutes } from './protectedRoutes'
import { PublicRoutes } from './publicRoutes'

export const router = createBrowserRouter([
  {
    element: <ProtectedRoutes />,
    children: [
      {
        path: '/',
        element: <RootLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: '*', element: <Navigate to="/" replace /> }
        ]
      },
    ],
  },
  {
    path: 'auth',
    element: <PublicRoutes />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
])
