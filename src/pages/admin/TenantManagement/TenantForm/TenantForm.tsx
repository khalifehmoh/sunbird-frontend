import { useEffect } from 'react'
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  useCreateTenantMutation,
  useGetTenantQuery,
  useUpdateTenantMutation,
} from '../../../../redux/features/tenants/tenantsApi'
import type { CreateTenantRequest, OrganizationType, TenantStatus } from '../../../../redux/features/tenants/tenantsTypes'
import { ORG_TYPE_OPTIONS } from '../tenantConstants'
import { useFormMutation } from '../../../../hooks/useFormMutation'

interface TenantFormProps {
  opened: boolean
  onClose: () => void
  tenantId?: string
}

interface FormValues {
  tenantCode: string
  tenantName: string
  tenantNameAr: string
  organizationType: OrganizationType
  licenseNumber: string
  maxUsers: number
  status?: TenantStatus | null
}

const INITIAL_VALUES: FormValues = {
  tenantCode: '',
  tenantName: '',
  tenantNameAr: '',
  organizationType: 'CLINIC',
  licenseNumber: '',
  maxUsers: 50,
  status: 'PENDING',
}

export function TenantForm({ opened, onClose, tenantId }: TenantFormProps) {
  const isEdit = Boolean(tenantId)

  const { data: existing, isFetching } = useGetTenantQuery(tenantId!, {
    skip: !tenantId,
  })

  const [createTenantMutation, { isLoading: isCreating }] = useCreateTenantMutation()
  const [updateTenantMutation, { isLoading: isUpdating }] = useUpdateTenantMutation()
  const isSubmitting = isCreating || isUpdating

  const form = useForm<FormValues>({
    initialValues: INITIAL_VALUES,
    validate: {
      tenantCode: (v) => (!v.trim() ? 'Tenant code is required' : null),
      tenantName: (v) => (!v.trim() ? 'Organization name is required' : null),
      organizationType: (v) => (!v ? 'Organization type is required' : null),
      maxUsers: (v) => (v < 1 ? 'Must be at least 1' : null),
    },
  })

  const createTenant = useFormMutation(createTenantMutation, form)
  const updateTenant = useFormMutation(updateTenantMutation, form)

  useEffect(() => {
    if (existing) {
      form.setValues({
        tenantCode: existing.tenantCode,
        tenantName: existing.tenantName ?? '',
        tenantNameAr: existing.tenantNameAr ?? '',
        organizationType: existing.organizationType,
        licenseNumber: existing.licenseNumber ?? '',
        maxUsers: existing.maxUsers,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing])

  useEffect(() => {
    if (!opened) form.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened])

  async function handleSubmit(values: FormValues) {
    const base: CreateTenantRequest = {
      ...values,
      tenantId: isEdit ? tenantId : undefined,
    }

    const result = isEdit
      ? await updateTenant({ ...base, status: existing?.status ?? 'ACTIVE' })
      : await createTenant({ ...base, status: 'PENDING' })

    if (!result.error) {
      notifications.show({
        color: 'teal',
        title: isEdit ? 'Tenant updated' : 'Tenant created',
        message: `${values.tenantName} has been ${isEdit ? 'updated' : 'created'} successfully.`,
        autoClose: 4000,
      })
      onClose()
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit Tenant' : 'Create Tenant'}
      size="lg"
      centered
      styles={{ body: { padding: '16px 32px 32px' } }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <SimpleGrid cols={2} spacing="md">
            <TextInput
              label="Tenant Code"
              placeholder="e.g. HOSP01"
              description="Uppercase alphanumeric — cannot be changed after creation"
              required
              disabled={isEdit || isFetching}
              {...form.getInputProps('tenantCode')}
              onChange={(e) =>
                form.setFieldValue('tenantCode', e.currentTarget.value.toUpperCase())
              }
            />

            <NumberInput
              label="Max Users"
              description="Seat limit for this tenant"
              min={1}
              required
              disabled={isFetching}
              {...form.getInputProps('maxUsers')}
            />

            <TextInput
              label="Organization Name (EN)"
              placeholder="Full English name"
              required
              disabled={isFetching}
              {...form.getInputProps('tenantName')}
            />

            <TextInput
              label="Organization Name (AR)"
              placeholder="الاسم بالعربية"
              dir="rtl"
              disabled={isFetching}
              {...form.getInputProps('tenantNameAr')}
            />

            <Select
              label="Organization Type"
              data={ORG_TYPE_OPTIONS}
              required
              disabled={isFetching}
              {...form.getInputProps('organizationType')}
            />

            <TextInput
              label="License Number"
              placeholder="MOH / MCI license"
              disabled={isFetching}
              {...form.getInputProps('licenseNumber')}
            />
          </SimpleGrid>

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting || isFetching}>
              {isEdit ? 'Save changes' : 'Create tenant'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
