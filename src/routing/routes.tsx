import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout/AdminLayout'
import { RootLayout } from '../layouts/RootLayout/RootLayout'
import { HomePage } from '../pages/HomePage/HomePage'
import { PlaceholderPage } from '../pages/PlaceholderPage/PlaceholderPage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage/AdminDashboardPage'
import { TenantListPage } from '../pages/admin/TenantManagement/TenantListPage/TenantListPage'
import { BranchListPage } from '../pages/admin/BranchManagement/BranchListPage/BranchListPage'
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
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'tenants/new', element: <PlaceholderPage title="Create tenant" /> },
          { path: 'tenants/:id/edit', element: <PlaceholderPage title="Edit tenant" /> },
          { path: 'tenants', element: <TenantListPage /> },
          { path: 'tenants/:id', element: <PlaceholderPage title="Tenant detail" /> },
          { path: 'branches/new', element: <PlaceholderPage title="Create branch" /> },
          { path: 'branches/:id/edit', element: <PlaceholderPage title="Edit branch" /> },
          { path: 'branches', element: <BranchListPage /> },
          { path: 'branches/:id', element: <PlaceholderPage title="Branch detail" /> },
          { path: 'users', element: <PlaceholderPage title="Users" /> },
          { path: 'groups', element: <PlaceholderPage title="Groups" /> },
          { path: 'roles', element: <PlaceholderPage title="Roles" /> },
          { path: 'modules', element: <PlaceholderPage title="Modules" /> },
          { path: 'permissions', element: <PlaceholderPage title="Permissions" /> },
          { path: 'audit', element: <PlaceholderPage title="Audit log" /> },
          { path: 'audit/:id', element: <PlaceholderPage title="Audit event" /> },
          { path: 'sessions', element: <PlaceholderPage title="Active sessions" /> },
          { path: 'security/failed-logins', element: <PlaceholderPage title="Failed login report" /> },
          { path: '*', element: <Navigate to="/admin" replace /> },
        ],
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
