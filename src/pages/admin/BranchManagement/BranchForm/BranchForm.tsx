import { useEffect } from 'react'
import {
  Button,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import {
  useCreateBranchMutation,
  useGetBranchQuery,
  useUpdateBranchMutation,
} from '../../../../redux/features/branches/branchesApi'
import type {
  BranchType,
  BranchStatus,
  CreateBranchRequest,
} from '../../../../redux/features/branches/branchesTypes'
import {
  BRANCH_TYPE_OPTIONS,
  BRANCH_STATUS_OPTIONS,
  SAUDI_REGION_OPTIONS,
} from '../branchConstants'
import { useFormMutation } from '../../../../hooks/useFormMutation'

interface BranchFormProps {
  opened: boolean
  onClose: () => void
  branchId?: string
  /** Pre-select tenant when opening from a tenant context */
  defaultTenantId?: string
}

interface FormValues {
  branchCode: string
  branchName: string
  branchNameAr: string
  branchType: BranchType
  isHeadquarters: boolean
  licenseNumber: string
  contactEmail: string
  contactPhone: string
  address: string
  city: string
  region: string
  status: BranchStatus
  tenantId: string
}

const INITIAL_VALUES: FormValues = {
  branchCode: '',
  branchName: '',
  branchNameAr: '',
  branchType: 'MAIN',
  isHeadquarters: false,
  licenseNumber: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  city: '',
  region: '',
  status: 'ACTIVE',
  tenantId: '',
}

export function BranchForm({
  opened,
  onClose,
  branchId,
  defaultTenantId,
}: BranchFormProps) {
  const isEdit = Boolean(branchId)

  const { data: existing, isFetching } = useGetBranchQuery(branchId!, {
    skip: !branchId,
  })

  const [createBranchMutation, { isLoading: isCreating }] = useCreateBranchMutation()
  const [updateBranchMutation, { isLoading: isUpdating }] = useUpdateBranchMutation()
  const isSubmitting = isCreating || isUpdating

  const form = useForm<FormValues>({
    initialValues: { ...INITIAL_VALUES, tenantId: defaultTenantId ?? '' },
    validate: {
      branchCode: (v) => (!v.trim() ? 'Branch code is required' : null),
      branchName: (v) => (!v.trim() ? 'Branch name is required' : null),
      branchType: (v) => (!v ? 'Branch type is required' : null),
      tenantId: (v) => (!v.trim() ? 'Tenant is required' : null),
      contactEmail: (v) =>
        v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
          ? 'Enter a valid email address'
          : null,
    },
  })

  const createBranch = useFormMutation(createBranchMutation, form)
  const updateBranch = useFormMutation(updateBranchMutation, form)

  useEffect(() => {
    if (existing) {
      form.setValues({
        branchCode: existing.branchCode,
        branchName: existing.branchName,
        branchNameAr: existing.branchNameAr ?? '',
        branchType: existing.branchType,
        isHeadquarters: existing.isHeadquarters,
        licenseNumber: existing.licenseNumber ?? '',
        contactEmail: existing.contactEmail ?? '',
        contactPhone: existing.contactPhone ?? '',
        address: existing.address ?? '',
        city: existing.city ?? '',
        region: existing.region ?? '',
        status: existing.status,
        tenantId: existing.tenantId,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing])

  useEffect(() => {
    if (!opened) {
      form.reset()
      if (defaultTenantId) form.setFieldValue('tenantId', defaultTenantId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened])

  async function handleSubmit(values: FormValues) {
    const base: CreateBranchRequest = {
      ...values,
      branchId: isEdit ? branchId : undefined,
    }

    const result = isEdit
      ? await updateBranch(base)
      : await createBranch(base)

    if (!result.error) {
      notifications.show({
        color: 'teal',
        title: isEdit ? 'Branch updated' : 'Branch created',
        message: `${values.branchName} has been ${isEdit ? 'updated' : 'created'} successfully.`,
        autoClose: 4000,
      })
      onClose()
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit Branch' : 'Create Branch'}
      size="xl"
      centered
      styles={{ body: { padding: '16px 32px 32px' } }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <SimpleGrid cols={2} spacing="md">
            <TextInput
              label="Branch Code"
              placeholder="e.g. BR01"
              description="Uppercase alphanumeric — cannot be changed after creation"
              required
              disabled={isEdit || isFetching}
              {...form.getInputProps('branchCode')}
              onChange={(e) =>
                form.setFieldValue('branchCode', e.currentTarget.value.toUpperCase())
              }
            />

            <TextInput
              label="Tenant ID"
              placeholder="Tenant identifier"
              description="Tenant this branch belongs to"
              required
              disabled={isEdit || isFetching || Boolean(defaultTenantId)}
              {...form.getInputProps('tenantId')}
            />

            <TextInput
              label="Branch Name (EN)"
              placeholder="Full English name"
              required
              disabled={isFetching}
              {...form.getInputProps('branchName')}
            />

            <TextInput
              label="Branch Name (AR)"
              placeholder="الاسم بالعربية"
              dir="rtl"
              disabled={isFetching}
              {...form.getInputProps('branchNameAr')}
            />

            <Select
              label="Branch Type"
              data={BRANCH_TYPE_OPTIONS}
              required
              disabled={isFetching}
              {...form.getInputProps('branchType')}
            />

            {isEdit && (
              <Select
                label="Status"
                data={BRANCH_STATUS_OPTIONS}
                required
                disabled={isFetching}
                {...form.getInputProps('status')}
              />
            )}

            <TextInput
              label="License Number"
              placeholder="MOH / MCI license"
              disabled={isFetching}
              {...form.getInputProps('licenseNumber')}
            />

            <TextInput
              label="Contact Email"
              placeholder="contact@branch.com"
              type="email"
              disabled={isFetching}
              {...form.getInputProps('contactEmail')}
            />

            <TextInput
              label="Contact Phone"
              placeholder="+966 5x xxx xxxx"
              disabled={isFetching}
              {...form.getInputProps('contactPhone')}
            />

            <TextInput
              label="City"
              placeholder="City"
              disabled={isFetching}
              {...form.getInputProps('city')}
            />

            <Select
              label="Region"
              placeholder="Select region"
              data={SAUDI_REGION_OPTIONS}
              clearable
              disabled={isFetching}
              {...form.getInputProps('region')}
            />
          </SimpleGrid>

          <Textarea
            label="Address"
            placeholder="Full street address"
            autosize
            minRows={2}
            disabled={isFetching}
            {...form.getInputProps('address')}
          />

          <Switch
            label="Headquarters branch"
            description="Only one branch per tenant can be designated as HQ"
            disabled={isFetching}
            checked={form.values.isHeadquarters}
            onChange={(e) =>
              form.setFieldValue('isHeadquarters', e.currentTarget.checked)
            }
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting || isFetching}>
              {isEdit ? 'Save changes' : 'Create branch'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
