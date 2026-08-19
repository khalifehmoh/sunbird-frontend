import { useEffect } from 'react'
import {
  Alert,
  Button,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notify } from '../../../../lib/notify'
import {
  useCreateRoleMutation,
  useGetRoleQuery,
  useUpdateRoleMutation,
} from '../../../../redux/features/roles/rolesApi'
import type {
  CreateRoleRequest,
  RoleStatus,
} from '../../../../redux/features/roles/rolesTypes'
import {
  useGetTenantQuery,
  useGetTenantsQuery,
} from '../../../../redux/features/tenants/tenantsApi'
import { isPlatformAdmin } from '../../../../hooks/useAuth'
import { usePermissions } from '../../../../hooks/usePermissions'
import { useAppSelector } from '../../../../redux/store'
import { ROLE_STATUS_OPTIONS, isRoleLocked, roleLockReason } from '../roleConstants'

interface RoleFormProps {
  opened: boolean
  onClose: () => void
  roleId?: string
  defaultTenantId?: string
}

type RoleScope = 'GLOBAL' | 'TENANT'

interface FormValues {
  tenantId: string
  scope: RoleScope
  roleCode: string
  roleName: string
  roleNameAr: string
  roleDescription: string
  status: RoleStatus
}

const INITIAL_VALUES: FormValues = {
  tenantId: '',
  scope: 'TENANT',
  roleCode: '',
  roleName: '',
  roleNameAr: '',
  roleDescription: '',
  status: 'ACTIVE',
}

export function RoleForm({
  opened,
  onClose,
  roleId,
  defaultTenantId,
}: RoleFormProps) {
  const isEdit = Boolean(roleId)
  const { role, tenantId: currentTenantId } = useAppSelector(
    (state) => state.auth,
  )
  const isSuperAdmin = isPlatformAdmin(role)
  const canCreate = usePermissions('ROLE:CREATE')
  const canUpdate = usePermissions('ROLE:UPDATE')
  const canUseForm = isEdit ? canUpdate : canCreate
  const contextualTenantId = defaultTenantId ?? currentTenantId ?? ''

  const {
    data: existing,
    isLoading: roleLoading,
    isError: roleError,
  } = useGetRoleQuery(roleId ?? '', {
    skip: !opened || !isEdit || !canUseForm,
  })

  const { data: tenants, isLoading: tenantsLoading } = useGetTenantsQuery(
    {
      page: 0,
      size: 200,
      search: '',
      status: '',
      type: '',
      sort: 'tenantName:asc',
    },
    { skip: !opened || !isSuperAdmin || !canUseForm },
  )

  const tenantForReadOnlyId = existing?.tenantId ?? contextualTenantId
  const { data: readOnlyTenant } = useGetTenantQuery(tenantForReadOnlyId, {
    skip: !opened || !tenantForReadOnlyId || isSuperAdmin,
  })

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation()
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation()
  const isSubmitting = isCreating || isUpdating

  const form = useForm<FormValues>({
    initialValues: {
      ...INITIAL_VALUES,
      tenantId: contextualTenantId,
      scope: isSuperAdmin && !contextualTenantId ? 'GLOBAL' : 'TENANT',
    },
    validate: {
      tenantId: (value, values) => {
        if (values.scope !== 'TENANT') return null
        return value.trim() ? null : 'Tenant is required'
      },
      roleCode: (value) => {
        if (!value.trim()) return 'Role code is required'
        return /^[A-Z0-9][A-Z0-9_-]*$/.test(value)
          ? null
          : 'Use uppercase letters, numbers, hyphens, or underscores'
      },
      roleName: (value) =>
        value.trim() ? null : 'Role name is required',
    },
  })

  useEffect(() => {
    if (!opened) {
      form.setValues({
        ...INITIAL_VALUES,
        tenantId: contextualTenantId,
        scope: isSuperAdmin && !contextualTenantId ? 'GLOBAL' : 'TENANT',
      })
      form.resetDirty()
      return
    }
    if (!isEdit) {
      form.setFieldValue('tenantId', contextualTenantId)
      form.setFieldValue(
        'scope',
        isSuperAdmin && !contextualTenantId ? 'GLOBAL' : 'TENANT',
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, isEdit, contextualTenantId, isSuperAdmin])

  useEffect(() => {
    if (!opened || !isEdit || !existing) return
    form.setValues({
      tenantId: existing.tenantId ?? '',
      scope: existing.tenantId ? 'TENANT' : 'GLOBAL',
      roleCode: existing.roleCode,
      roleName: existing.roleName,
      roleNameAr: existing.roleNameAr ?? '',
      roleDescription: existing.roleDescription ?? '',
      status: existing.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    })
    form.resetDirty()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, isEdit, existing])

  async function handleSubmit(values: FormValues) {
    const request: CreateRoleRequest = {
      roleId: isEdit ? roleId : undefined,
      roleCode: values.roleCode.trim().toUpperCase(),
      roleName: values.roleName.trim(),
      roleNameAr: values.roleNameAr.trim() || undefined,
      roleDescription: values.roleDescription.trim() || undefined,
      tenantId:
        values.scope === 'TENANT' ? values.tenantId : undefined,
      status: values.status,
    }

    try {
      if (isEdit) {
        await updateRole(request).unwrap()
      } else {
        await createRole(request).unwrap()
      }
      notify({
        type: 'success',
        title: isEdit ? 'Role updated' : 'Role created',
        message: `${values.roleName} was ${
          isEdit ? 'updated' : 'created'
        } successfully.`,
      })
      onClose()
    } catch {
      // Shared base query shows API errors.
    }
  }

  const systemLocked = existing
    ? isRoleLocked(existing, isSuperAdmin)
    : false

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit role' : 'Create role'}
      size="lg"
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      {!canUseForm ? (
        <Alert color="red" title="Permission required">
          You don&apos;t have permission to {isEdit ? 'update' : 'create'} a
          role.
        </Alert>
      ) : roleError ? (
        <Alert color="red" title="Role not found">
          The role could not be loaded.
        </Alert>
      ) : systemLocked ? (
        <Alert color="blue" title="Role locked">
          {existing ? roleLockReason(existing) : 'This role cannot be edited.'}
        </Alert>
      ) : roleLoading ? (
        <Stack>
          <Skeleton height={58} />
          <Skeleton height={58} />
          <Skeleton height={58} />
        </Stack>
      ) : (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="lg">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {isSuperAdmin ? (
                <Select
                  label="Scope"
                  data={[
                    { value: 'GLOBAL', label: 'Global' },
                    { value: 'TENANT', label: 'Tenant-specific' },
                  ]}
                  description="Global roles apply across all tenants"
                  required
                  disabled={isEdit}
                  allowDeselect={false}
                  {...form.getInputProps('scope')}
                />
              ) : (
                <TextInput
                  label="Scope"
                  value="Tenant-specific"
                  description="Tenant is determined by your account"
                  disabled
                />
              )}

              {isSuperAdmin && form.values.scope === 'TENANT' ? (
                <Select
                  label="Tenant"
                  placeholder="Select tenant"
                  data={(tenants?.content ?? []).map((tenant) => ({
                    value: tenant.tenantId ?? '',
                    label: `${tenant.tenantName ?? tenant.tenantCode} (${tenant.tenantCode})`,
                  }))}
                  searchable
                  required
                  disabled={isEdit || tenantsLoading || Boolean(defaultTenantId)}
                  {...form.getInputProps('tenantId')}
                />
              ) : !isSuperAdmin ? (
                <TextInput
                  label="Tenant"
                  value={
                    readOnlyTenant
                      ? `${readOnlyTenant.tenantName} (${readOnlyTenant.tenantCode})`
                      : tenantForReadOnlyId
                  }
                  disabled
                />
              ) : (
                <TextInput
                  label="Tenant"
                  value="Global"
                  description="No tenant ownership"
                  disabled
                />
              )}

              <TextInput
                label="Role code"
                placeholder="e.g. NURSES"
                description="Unique; cannot change after creation"
                required
                disabled={isEdit}
                {...form.getInputProps('roleCode')}
                onChange={(event) =>
                  form.setFieldValue(
                    'roleCode',
                    event.currentTarget.value.toUpperCase(),
                  )
                }
              />

              <TextInput
                label="Role name (EN)"
                placeholder="English role name"
                required
                {...form.getInputProps('roleName')}
              />

              <TextInput
                label="Role name (AR)"
                placeholder="اسم الدور بالعربية"
                dir="rtl"
                {...form.getInputProps('roleNameAr')}
              />

              <Select
                label="Status"
                data={ROLE_STATUS_OPTIONS}
                required
                allowDeselect={false}
                {...form.getInputProps('status')}
              />
            </SimpleGrid>

            <Textarea
              label="Description"
              placeholder="Optional description"
              minRows={3}
              autosize
              {...form.getInputProps('roleDescription')}
            />

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {isEdit ? 'Save changes' : 'Create role'}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  )
}
