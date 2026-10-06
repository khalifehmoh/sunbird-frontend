import { createBrowserRouter, Navigate, useLocation, useParams } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout/AdminLayout'
import { RootLayout } from '../layouts/RootLayout/RootLayout'
import { HomePage } from '../pages/HomePage/HomePage'
import { PlaceholderPage } from '../pages/PlaceholderPage/PlaceholderPage'
import { AuditLogPage } from '../pages/admin/AuditManagement/AuditLogPage/AuditLogPage'
import { AuditDetailPage } from '../pages/admin/AuditManagement/AuditDetailPage/AuditDetailPage'
import { ActiveSessionsPage } from '../pages/admin/AuditManagement/ActiveSessionsPage/ActiveSessionsPage'
import { FailedLoginsPage } from '../pages/admin/AuditManagement/FailedLoginsPage/FailedLoginsPage'
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
import { ModuleListPage } from '../pages/admin/ModuleManagement/ModuleListPage/ModuleListPage'
import { PermissionListPage } from '../pages/admin/PermissionManagement/PermissionListPage/PermissionListPage'
import { MedplumRoot } from '../medplum/MedplumRoot'
import { PatientListPage } from '../pages/clinical/PatientListPage/PatientListPage'
import { PatientDetailPage } from '../pages/clinical/PatientDetailPage/PatientDetailPage'
import { EncounterListPage } from '../pages/clinical/EncounterListPage/EncounterListPage'
import { EncounterDetailPage } from '../pages/clinical/EncounterDetailPage/EncounterDetailPage'
import { AdmitPage } from '../pages/clinical/adt/AdmitPage'
import { RegisterVisitPage } from '../pages/clinical/adt/RegisterPage'
import { TransferPage } from '../pages/clinical/adt/TransferPage'
import { DischargePage } from '../pages/clinical/adt/DischargePage'
import { PreadmitPage } from '../pages/clinical/adt/PreadmitPage'
import { BedBoardPage } from '../pages/clinical/adt/BedBoardPage'
import { LoginPage } from '../pages/LoginPage/LoginPage'
import { RegisterPage } from '../pages/RegisterPage/RegisterPage'
import { ChangePasswordPage } from '../pages/ChangePasswordPage/ChangePasswordPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage/ForgotPasswordPage'
import { EmrDashboardPage } from '../pages/emr/dashboard/EmrDashboardPage'
import { PatientWorklistPage } from '../pages/emr/patients/PatientWorklistPage'
import { PatientProfilePage } from '../pages/emr/patients/PatientProfilePage'
import { PatientRegistrationPage } from '../pages/emr/patients/PatientRegistrationPage'
import { PatientAuditPage } from '../pages/emr/patients/PatientAuditPage'
import { OrderListPage } from '../pages/emr/orders/OrderListPage'
import { OrderNewPage } from '../pages/emr/orders/OrderNewPage'
import { CriticalResultsPage, ResultListPage, ResultViewerPage } from '../pages/emr/results/ResultPages'
import { AppointmentCalendarPage } from '../pages/emr/appointments/AppointmentCalendarPage'
import { AppointmentBookPage } from '../pages/emr/appointments/AppointmentBookPage'
import { AppointmentCancelPage } from '../pages/emr/appointments/AppointmentCancelPage'
import { VitalsDisplayPage, VitalsEntryPage } from '../pages/emr/vitals/VitalsPages'
import { DiagnosesPage } from '../pages/emr/diagnoses/DiagnosesPage'
import {
  IntegrationMonitorPage,
  IntegrationRetryPage,
  IntegrationTransactionPage,
} from '../pages/emr/integration/IntegrationPages'
import { NotificationLogPage, NotificationTemplatesPage } from '../pages/emr/notifications/NotificationPages'
import { FhirMetadataPage } from '../pages/emr/fhir/FhirMetadataPage'
import { ClinicalAccess, EmrAccess } from '../constants/permissions'
import { useHasPermissions } from '../hooks/usePermissions'
import { ProtectedRoutes } from './protectedRoutes'
import { PublicRoutes } from './publicRoutes'
import { RequirePermissions } from './RequirePermissions'

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

function ModuleEditRedirect() {
  const { id } = useParams()
  return <Navigate to={`/admin/modules?edit=${id ?? ''}`} replace />
}

function PermissionEditRedirect() {
  const { id } = useParams()
  return <Navigate to={`/admin/permissions?edit=${id ?? ''}`} replace />
}

/** Sends clinical users to the EMR dashboard; everyone else keeps the plain home page. */
function HomeRoute() {
  const clinical = useHasPermissions(EmrAccess.view)
  return clinical ? <Navigate to="/emr/dashboard" replace /> : <HomePage />
}

/** Old /emr/adt/* and /emr/encounters/* links land on the clinical screens. */
function SplatRedirect({ base }: { base: string }) {
  const params = useParams()
  const location = useLocation()
  const rest = params['*'] ? `/${params['*']}` : ''
  return <Navigate to={`${base}${rest}${location.search}`} replace />
}

export const router = createBrowserRouter([
  // Public: the FHIR capability statement needs no session.
  { path: '/fhir/metadata', element: <FhirMetadataPage /> },
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
          { index: true, element: <HomeRoute /> },
          { path: 'security/password', element: <ChangePasswordPage /> },
          {
            // Everything clinical reads through the FHIR gateway, so READ gates
            // the whole tree before the Medplum provider is even mounted.
            path: 'clinical',
            element: <RequirePermissions codes={ClinicalAccess.view} />,
            children: [
              {
                // Clinical screens share one MedplumProvider.
                element: <MedplumRoot />,
                children: [
                  { index: true, element: <Navigate to="/clinical/patients" replace /> },
                  { path: 'patients', element: <PatientListPage /> },
                  { path: 'patients/:id', element: <PatientDetailPage /> },
                  { path: 'encounters', element: <EncounterListPage /> },
                  { path: 'encounters/:id', element: <EncounterDetailPage /> },
                  { path: 'adt/beds', element: <BedBoardPage /> },
                  {
                    element: <RequirePermissions codes={ClinicalAccess.create} />,
                    children: [
                      { path: 'adt/admit', element: <AdmitPage /> },
                      { path: 'adt/register', element: <RegisterVisitPage /> },
                      { path: 'adt/preadmit', element: <PreadmitPage /> },
                    ],
                  },
                  {
                    element: <RequirePermissions codes={ClinicalAccess.update} />,
                    children: [
                      { path: 'adt/transfer', element: <TransferPage /> },
                      { path: 'adt/discharge', element: <DischargePage /> },
                    ],
                  },
                ],
              },
            ],
          },
          {
            path: 'emr',
            children: [
              { index: true, element: <Navigate to="/emr/dashboard" replace /> },
              { path: 'adt/*', element: <SplatRedirect base="/clinical/adt" /> },
              { path: 'encounters/*', element: <SplatRedirect base="/clinical/encounters" /> },
              { path: 'encounters', element: <Navigate to="/clinical/encounters" replace /> },
              {
                element: <RequirePermissions codes={EmrAccess.view} />,
                children: [
                  { path: 'dashboard', element: <EmrDashboardPage /> },
                  { path: 'patients', element: <PatientWorklistPage /> },
                  { path: 'patients/:id', element: <PatientProfilePage /> },
                  { path: 'patients/:id/audit', element: <PatientAuditPage /> },
                  { path: 'orders', element: <OrderListPage /> },
                  { path: 'results', element: <ResultListPage /> },
                  { path: 'results/critical', element: <CriticalResultsPage /> },
                  { path: 'results/:id', element: <ResultViewerPage /> },
                  { path: 'vitals', element: <VitalsDisplayPage /> },
                  { path: 'diagnoses', element: <DiagnosesPage /> },
                  { path: 'notifications', element: <NotificationLogPage /> },
                  {
                    element: <RequirePermissions codes={EmrAccess.create} />,
                    children: [
                      { path: 'patients/new', element: <PatientRegistrationPage /> },
                      { path: 'orders/new', element: <OrderNewPage /> },
                      { path: 'vitals/new', element: <VitalsEntryPage /> },
                    ],
                  },
                ],
              },
              {
                element: <RequirePermissions codes={EmrAccess.appointmentsView} />,
                children: [
                  { path: 'appointments', element: <AppointmentCalendarPage /> },
                  {
                    element: <RequirePermissions codes={EmrAccess.appointmentsBook} />,
                    children: [{ path: 'appointments/new', element: <AppointmentBookPage /> }],
                  },
                  {
                    element: <RequirePermissions codes={EmrAccess.appointmentsManage} />,
                    children: [
                      { path: 'appointments/:id/cancel', element: <AppointmentCancelPage /> },
                    ],
                  },
                ],
              },
              {
                element: <RequirePermissions codes={EmrAccess.integrationView} />,
                children: [
                  { path: 'integration', element: <IntegrationMonitorPage /> },
                  { path: 'integration/transaction/:id', element: <IntegrationTransactionPage /> },
                  {
                    element: <RequirePermissions codes={EmrAccess.integrationManage} />,
                    children: [
                      { path: 'integration/retry/:id', element: <IntegrationRetryPage /> },
                    ],
                  },
                ],
              },
              {
                element: <RequirePermissions codes={EmrAccess.notificationAdmin} />,
                children: [
                  { path: 'notifications/templates', element: <NotificationTemplatesPage /> },
                ],
              },
            ],
          },
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
          {
            path: 'modules/new',
            element: <Navigate to="/admin/modules?create=true" replace />,
          },
          { path: 'modules/:id/edit', element: <ModuleEditRedirect /> },
          { path: 'modules', element: <ModuleListPage /> },
          {
            path: 'permissions/new',
            element: <Navigate to="/admin/permissions?create=true" replace />,
          },
          { path: 'permissions/:id/edit', element: <PermissionEditRedirect /> },
          { path: 'permissions', element: <PermissionListPage /> },
          { path: 'audit', element: <AuditLogPage /> },
          { path: 'audit/:id', element: <AuditDetailPage /> },
          { path: 'sessions', element: <ActiveSessionsPage /> },
          { path: 'security/failed-logins', element: <FailedLoginsPage /> },
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
