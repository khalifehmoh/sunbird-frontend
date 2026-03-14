import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RootLayout } from './layouts/RootLayout/RootLayout'
import { AuthLayout } from './layouts/AuthLayout/AuthLayout'
import { HomePage } from './pages/HomePage/HomePage'
import { PlaceholderPage } from './pages/PlaceholderPage/PlaceholderPage'
import { LoginPage } from './pages/LoginPage/LoginPage'
import { RegisterPage } from './pages/RegisterPage/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage/ForgotPasswordPage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'dashboard', element: <PlaceholderPage title="Dashboard" /> },
      {
        path: 'market-news',
        children: [
          { path: 'overview', element: <PlaceholderPage title="Overview" /> },
          { path: 'forecasts', element: <PlaceholderPage title="Forecasts" /> },
          { path: 'outlook', element: <PlaceholderPage title="Outlook" /> },
          { path: 'real-time', element: <PlaceholderPage title="Real time" /> },
        ],
      },
      {
        path: 'releases',
        children: [
          { path: 'upcoming', element: <PlaceholderPage title="Upcoming releases" /> },
          { path: 'previous', element: <PlaceholderPage title="Previous releases" /> },
          { path: 'schedule', element: <PlaceholderPage title="Releases schedule" /> },
        ],
      },
      { path: 'analytics', element: <PlaceholderPage title="Analytics" /> },
      { path: 'contracts', element: <PlaceholderPage title="Contracts" /> },
      { path: 'settings', element: <PlaceholderPage title="Settings" /> },
      {
        path: 'security',
        children: [
          { path: '2fa', element: <PlaceholderPage title="Enable 2FA" /> },
          { path: 'password', element: <PlaceholderPage title="Change password" /> },
          { path: 'recovery', element: <PlaceholderPage title="Recovery codes" /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
  {
    path: 'auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
])
