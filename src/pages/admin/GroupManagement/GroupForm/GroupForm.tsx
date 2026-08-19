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
  useCreateGroupMutation,
  useGetGroupQuery,
  useUpdateGroupMutation,
} from '../../../../redux/features/groups/groupsApi'
import type {
  CreateGroupRequest,
  GroupStatus,
} from '../../../../redux/features/groups/groupsTypes'
import {
  useGetTenantQuery,
  useGetTenantsQuery,
} from '../../../../redux/features/tenants/tenantsApi'
import { isPlatformAdmin } from '../../../../hooks/useAuth'
import { usePermissions } from '../../../../hooks/usePermissions'
import { useAppSelector } from '../../../../redux/store'
import { GROUP_STATUS_OPTIONS } from '../groupConstants'

interface GroupFormProps {
  opened: boolean
  onClose: () => void
  groupId?: string
  defaultTenantId?: string
}

interface FormValues {
  tenantId: string
  groupCode: string
  groupName: string
  groupNameAr: string
  groupDescription: string
  status: GroupStatus
}

const INITIAL_VALUES: FormValues = {
  tenantId: '',
  groupCode: '',
  groupName: '',
  groupNameAr: '',
  groupDescription: '',
  status: 'ACTIVE',
}

export function GroupForm({
  opened,
  onClose,
  groupId,
  defaultTenantId,
}: GroupFormProps) {
  const isEdit = Boolean(groupId)
  const { role, tenantId: currentTenantId } = useAppSelector(
    (state) => state.auth,
  )
  const isSuperAdmin = isPlatformAdmin(role)
  const canCreate = usePermissions('GROUP:CREATE')
  const canUpdate = usePermissions('GROUP:UPDATE')
  const canUseForm = isEdit ? canUpdate : canCreate
  const contextualTenantId = defaultTenantId ?? currentTenantId ?? ''

  const {
    data: existing,
    isLoading: groupLoading,
    isError: groupError,
  } = useGetGroupQuery(groupId ?? '', {
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

  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation()
  const [updateGroup, { isLoading: isUpdating }] = useUpdateGroupMutation()
  const isSubmitting = isCreating || isUpdating

  const form = useForm<FormValues>({
    initialValues: {
      ...INITIAL_VALUES,
      tenantId: contextualTenantId,
    },
    validate: {
      tenantId: (value) => (value.trim() ? null : 'Tenant is required'),
      groupCode: (value) => {
        if (!value.trim()) return 'Group code is required'
        return /^[A-Z0-9][A-Z0-9_-]*$/.test(value)
          ? null
          : 'Use uppercase letters, numbers, hyphens, or underscores'
      },
      groupName: (value) =>
        value.trim() ? null : 'Group name is required',
    },
  })

  useEffect(() => {
    if (!opened) {
      form.setValues({
        ...INITIAL_VALUES,
        tenantId: contextualTenantId,
      })
      form.resetDirty()
      return
    }
    if (!isEdit) {
      form.setFieldValue('tenantId', contextualTenantId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, isEdit, contextualTenantId])

  useEffect(() => {
    if (!opened || !isEdit || !existing) return
    form.setValues({
      tenantId: existing.tenantId,
      groupCode: existing.groupCode,
      groupName: existing.groupName,
      groupNameAr: existing.groupNameAr ?? '',
      groupDescription: existing.groupDescription ?? '',
      status: existing.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    })
    form.resetDirty()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, isEdit, existing])

  async function handleSubmit(values: FormValues) {
    const request: CreateGroupRequest = {
      groupId: isEdit ? groupId : undefined,
      tenantId: values.tenantId,
      groupCode: values.groupCode.trim().toUpperCase(),
      groupName: values.groupName.trim(),
      groupNameAr: values.groupNameAr.trim() || undefined,
      groupDescription: values.groupDescription.trim() || undefined,
      status: values.status,
    }

    try {
      if (isEdit) {
        await updateGroup(request).unwrap()
      } else {
        await createGroup(request).unwrap()
      }
      notify({
        type: 'success',
        title: isEdit ? 'Group updated' : 'Group created',
        message: `${values.groupName} was ${
          isEdit ? 'updated' : 'created'
        } successfully.`,
      })
      onClose()
    } catch {
      // Shared base query shows API errors.
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit group' : 'Create group'}
      size="lg"
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      {!canUseForm ? (
        <Alert color="red" title="Permission required">
          You don&apos;t have permission to {isEdit ? 'update' : 'create'} a
          group.
        </Alert>
      ) : groupError ? (
        <Alert color="red" title="Group not found">
          The group could not be loaded.
        </Alert>
      ) : groupLoading ? (
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
                  label="Tenant"
                  placeholder="Select tenant"
                  description="The organization that owns this group"
                  data={(tenants?.content ?? []).map((tenant) => ({
                    value: tenant.tenantId ?? '',
                    label: `${tenant.tenantName ?? tenant.tenantCode} (${tenant.tenantCode})`,
                  }))}
                  searchable
                  required
                  disabled={isEdit || tenantsLoading || Boolean(defaultTenantId)}
                  {...form.getInputProps('tenantId')}
                />
              ) : (
                <TextInput
                  label="Tenant"
                  value={
                    readOnlyTenant
                      ? `${readOnlyTenant.tenantName} (${readOnlyTenant.tenantCode})`
                      : tenantForReadOnlyId
                  }
                  description="Tenant is determined by your account"
                  disabled
                />
              )}

              <TextInput
                label="Group code"
                placeholder="e.g. NURSES"
                description="Unique within the tenant; cannot change after creation"
                required
                disabled={isEdit}
                {...form.getInputProps('groupCode')}
                onChange={(event) =>
                  form.setFieldValue(
                    'groupCode',
                    event.currentTarget.value.toUpperCase(),
                  )
                }
              />

              <TextInput
                label="Group name (EN)"
                placeholder="English group name"
                required
                {...form.getInputProps('groupName')}
              />

              <TextInput
                label="Group name (AR)"
                placeholder="اسم المجموعة بالعربية"
                dir="rtl"
                {...form.getInputProps('groupNameAr')}
              />

              <Select
                label="Status"
                data={GROUP_STATUS_OPTIONS}
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
              {...form.getInputProps('groupDescription')}
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
                {isEdit ? 'Save changes' : 'Create group'}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  )
}
