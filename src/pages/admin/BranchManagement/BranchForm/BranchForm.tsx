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
  Switch,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notify } from '../../../../lib/notify'
import {
  useCreateBranchMutation,
  useGetBranchQuery,
  useUpdateBranchMutation,
} from '../../../../redux/features/branches/branchesApi'
import type {
  BranchStatus,
  BranchType,
  CreateBranchRequest,
} from '../../../../redux/features/branches/branchesTypes'
import {
  useGetTenantQuery,
  useGetTenantsQuery,
} from '../../../../redux/features/tenants/tenantsApi'
import { usePermissions } from '../../../../hooks/usePermissions'
import { isPlatformAdmin } from '../../../../hooks/useAuth'
import { useAppSelector } from '../../../../redux/store'
import {
  BRANCH_STATUS_OPTIONS,
  BRANCH_TYPE_OPTIONS,
} from '../branchConstants'

interface BranchFormProps {
  opened: boolean
  onClose: () => void
  branchId?: string
  defaultTenantId?: string
}

interface FormValues {
  tenantId: string
  branchCode: string
  branchName: string
  branchNameAr: string
  branchType: BranchType
  isHeadquarters: boolean
  city: string
  status: BranchStatus
}

const INITIAL_VALUES: FormValues = {
  tenantId: '',
  branchCode: '',
  branchName: '',
  branchNameAr: '',
  branchType: 'MAIN',
  isHeadquarters: false,
  city: '',
  status: 'ACTIVE',
}

export function BranchForm({
  opened,
  onClose,
  branchId,
  defaultTenantId,
}: BranchFormProps) {
  const isEdit = Boolean(branchId)
  const { role, tenantId: currentTenantId } = useAppSelector(
    (state) => state.auth,
  )
  const isSuperAdmin = isPlatformAdmin(role)
  const canCreate = usePermissions('BRANCH:CREATE')
  const canUpdate = usePermissions('BRANCH:UPDATE')
  const canUseForm = isEdit ? canUpdate : canCreate
  const contextualTenantId = defaultTenantId ?? currentTenantId ?? ''

  const {
    data: existing,
    isLoading: branchLoading,
    isError: branchError,
  } = useGetBranchQuery(branchId ?? '', {
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

  const [createBranch, { isLoading: isCreating }] =
    useCreateBranchMutation()
  const [updateBranch, { isLoading: isUpdating }] =
    useUpdateBranchMutation()
  const isSubmitting = isCreating || isUpdating

  const form = useForm<FormValues>({
    initialValues: {
      ...INITIAL_VALUES,
      tenantId: contextualTenantId,
    },
    validate: {
      tenantId: (value) => (value.trim() ? null : 'Tenant is required'),
      branchCode: (value) => {
        if (!value.trim()) return 'Branch code is required'
        return /^[A-Z0-9][A-Z0-9_-]*$/.test(value)
          ? null
          : 'Use uppercase letters, numbers, hyphens, or underscores'
      },
      branchName: (value) =>
        value.trim() ? null : 'Branch name is required',
      branchType: (value) => (value ? null : 'Branch type is required'),
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
    // Mantine form is stable for this component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, isEdit, contextualTenantId])

  useEffect(() => {
    if (!opened || !isEdit || !existing) return
    form.setValues({
      tenantId: existing.tenantId,
      branchCode: existing.branchCode,
      branchName: existing.branchName,
      branchNameAr: existing.branchNameAr ?? '',
      branchType: existing.branchType,
      isHeadquarters: existing.isHeadquarters,
      city: existing.city ?? '',
      status: existing.status,
    })
    form.resetDirty()
    // Mantine form is stable for this component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, isEdit, existing])

  async function handleSubmit(values: FormValues) {
    const request: CreateBranchRequest = {
      branchId: isEdit ? branchId : undefined,
      tenantId: values.tenantId,
      branchCode: values.branchCode.trim().toUpperCase(),
      branchName: values.branchName.trim(),
      branchNameAr: values.branchNameAr.trim(),
      branchType: values.branchType,
      isHeadquarters: values.isHeadquarters,
      city: values.city.trim(),
      status: isEdit ? values.status : 'ACTIVE',
    }

    try {
      if (isEdit) {
        await updateBranch(request).unwrap()
      } else {
        await createBranch(request).unwrap()
      }
      notify({
        type: 'success',
        title: isEdit ? 'Branch updated' : 'Branch created',
        message: `${values.branchName} was ${
          isEdit ? 'updated' : 'created'
        } successfully.`,
      })
      onClose()
    } catch {
      // The shared base query displays the backend validation message.
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit branch' : 'Create branch'}
      size="xl"
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      {!canUseForm ? (
        <Alert color="red" title="Permission required">
          You don&apos;t have permission to {isEdit ? 'update' : 'create'} a
          branch.
        </Alert>
      ) : branchError ? (
        <Alert color="red" title="Branch not found">
          The branch could not be loaded.
        </Alert>
      ) : branchLoading ? (
        <Stack>
          <Skeleton height={58} />
          <Skeleton height={58} />
          <Skeleton height={58} />
        </Stack>
      ) : (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="lg">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing="md">
              {isSuperAdmin ? (
                <Select
                  label="Tenant"
                  placeholder="Select tenant"
                  description="The organization that owns this branch"
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
                label="Branch code"
                placeholder="e.g. RIYADH-HQ"
                description="Unique within the tenant; cannot change after creation"
                required
                disabled={isEdit}
                {...form.getInputProps('branchCode')}
                onChange={(event) =>
                  form.setFieldValue(
                    'branchCode',
                    event.currentTarget.value.toUpperCase(),
                  )
                }
              />

              <TextInput
                label="Branch name (EN)"
                placeholder="English branch name"
                description=" "
                required
                {...form.getInputProps('branchName')}
              />

              <TextInput
                label="Branch name (AR)"
                placeholder="اسم الفرع بالعربية"
                description=" "
                dir="rtl"
                {...form.getInputProps('branchNameAr')}
              />

              <Select
                label="Branch type"
                data={BRANCH_TYPE_OPTIONS}
                description=" "
                required
                allowDeselect={false}
                {...form.getInputProps('branchType')}
              />

              <TextInput
                label="City"
                placeholder="City"
                description=" "
                {...form.getInputProps('city')}
              />

              {isEdit ? (
                <Select
                  label="Status"
                  data={BRANCH_STATUS_OPTIONS}
                  description=" "
                  required
                  allowDeselect={false}
                  {...form.getInputProps('status')}
                />
              ) : null}
            </SimpleGrid>

            <Switch
              label="Headquarters branch"
              description="Only one branch per tenant can be designated as headquarters"
              checked={form.values.isHeadquarters}
              onChange={(event) =>
                form.setFieldValue(
                  'isHeadquarters',
                  event.currentTarget.checked,
                )
              }
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
                {isEdit ? 'Save changes' : 'Create branch'}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  )
}
