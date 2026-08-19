import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout/AdminLayout'
import { RootLayout } from '../layouts/RootLayout/RootLayout'
import { HomePage } from '../pages/HomePage/HomePage'
import { PlaceholderPage } from '../pages/PlaceholderPage/PlaceholderPage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage/AdminDashboardPage'
import { TenantListPage } from '../pages/admin/TenantManagement/TenantListPage/TenantListPage'
import { TenantDetailPage } from '../pages/admin/TenantManagement/TenantDetailPage/TenantDetailPage'
import { BranchListPage } from '../pages/admin/BranchManagement/BranchListPage/BranchListPage'
import { UserListPage } from '../pages/admin/UserManagement/UserListPage/UserListPage'
import { UserDetailPage } from '../pages/admin/UserManagement/UserDetailPage/UserDetailPage'
import { UserSessionsPage } from '../pages/admin/UserManagement/UserSessionsPage/UserSessionsPage'
import { GroupListPage } from '../pages/admin/GroupManagement/GroupListPage/GroupListPage'
import { GroupDetailPage } from '../pages/admin/GroupManagement/GroupDetailPage/GroupDetailPage'
import { RoleListPage } from '../pages/admin/RoleManagement/RoleListPage/RoleListPage'
import { RolePermissionsMatrixPage } from '../pages/admin/RoleManagement/RolePermissionsMatrixPage/RolePermissionsMatrixPage'
import { LoginPage } from '../pages/LoginPage/LoginPage'
import { RegisterPage } from '../pages/RegisterPage/RegisterPage'
import { ChangePasswordPage } from '../pages/ChangePasswordPage/ChangePasswordPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage/ForgotPasswordPage'
import { ProtectedRoutes } from './protectedRoutes'
import { PublicRoutes } from './publicRoutes'

function BranchEditRedirect() {
  const { id } = useParams()
  return <Navigate to={`/admin/branches?edit=${id ?? ''}`} replace />
}

function TenantEditRedirect() {
  const { id } = useParams()
  return <Navigate to={`/admin/tenants/${id ?? ''}?edit=true`} replace />
}

function UserEditRedirect() {
  const { id } = useParams()
  return <Navigate to={`/admin/users/${id ?? ''}?edit=true`} replace />
}

function GroupEditRedirect() {
  const { id } = useParams()
  return <Navigate to={`/admin/groups?edit=${id ?? ''}`} replace />
}

function RoleEditRedirect() {
  const { id } = useParams()
  return <Navigate to={`/admin/roles?edit=${id ?? ''}`} replace />
}

export const router = createBrowserRouter([
  {
    element: <ProtectedRoutes />,
    children: [
      {
        path: '/change-password',
        element: <ChangePasswordPage forced />,
      },
      {
        path: '/',
        element: <RootLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'security/password', element: <ChangePasswordPage /> },
          { path: '*', element: <Navigate to="/" replace /> }
        ]
      },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'tenants/new', element: <PlaceholderPage title="Create tenant" /> },
          { path: 'tenants/:id/edit', element: <TenantEditRedirect /> },
          { path: 'tenants', element: <TenantListPage /> },
          { path: 'tenants/:id', element: <TenantDetailPage /> },
          {
            path: 'branches/new',
            element: <Navigate to="/admin/branches?create=true" replace />,
          },
          { path: 'branches/:id/edit', element: <BranchEditRedirect /> },
          { path: 'branches', element: <BranchListPage /> },
          { path: 'branches/:id', element: <PlaceholderPage title="Branch detail" /> },
          {
            path: 'users/new',
            element: <Navigate to="/admin/users?create=true" replace />,
          },
          { path: 'users/:id/edit', element: <UserEditRedirect /> },
          { path: 'users/:id/sessions', element: <UserSessionsPage /> },
          { path: 'users/:id', element: <UserDetailPage /> },
          { path: 'users', element: <UserListPage /> },
          {
            path: 'groups/new',
            element: <Navigate to="/admin/groups?create=true" replace />,
          },
          { path: 'groups/:id/edit', element: <GroupEditRedirect /> },
          { path: 'groups/:id', element: <GroupDetailPage /> },
          { path: 'groups', element: <GroupListPage /> },
          {
            path: 'roles/new',
            element: <Navigate to="/admin/roles?create=true" replace />,
          },
          { path: 'roles/:id/edit', element: <RoleEditRedirect /> },
          {
            path: 'roles/:id/permissions',
            element: <RolePermissionsMatrixPage />,
          },
          { path: 'roles', element: <RoleListPage /> },
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
