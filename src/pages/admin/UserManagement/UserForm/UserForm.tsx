import { useEffect } from 'react'
import {
  Button,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notify } from '../../../../lib/notify'
import {
  useCreateUserMutation,
  useGetUserQuery,
  useUpdateUserMutation,
} from '../../../../redux/features/users/usersApi'
import type {
  CreateUserRequest,
  UserRole,
  UserStatus,
} from '../../../../redux/features/users/usersTypes'
import { useGetTenantsQuery } from '../../../../redux/features/tenants/tenantsApi'
import { useFormMutation } from '../../../../hooks/useFormMutation'
import { useAppSelector } from '../../../../redux/store'
import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from '../userConstants'

interface UserFormProps {
  opened: boolean
  onClose: () => void
  userId?: string
  defaultTenantId?: string
}

interface FormValues {
  tenantId: string
  username: string
  email: string
  firstName: string
  lastName: string
  firstNameAr: string
  lastNameAr: string
  role: UserRole
  status: UserStatus
  mfaEnabled: boolean
}

const INITIAL_VALUES: FormValues = {
  tenantId: '',
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  firstNameAr: '',
  lastNameAr: '',
  role: 'USER',
  status: 'ACTIVE',
  mfaEnabled: false,
}

export function UserForm({
  opened,
  onClose,
  userId,
  defaultTenantId,
}: UserFormProps) {
  const isEdit = Boolean(userId)
  const { role, tenantId: currentTenantId } = useAppSelector(
    (state) => state.auth,
  )
  const isSuperAdmin = role === 'ADMIN'
  const contextualTenantId = defaultTenantId ?? currentTenantId ?? ''

  const { data: existing, isFetching } = useGetUserQuery(userId ?? '', {
    skip: !opened || !isEdit || !userId,
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
    { skip: !opened || !isSuperAdmin },
  )

  const [createUserMutation, { isLoading: isCreating }] =
    useCreateUserMutation()
  const [updateUserMutation, { isLoading: isUpdating }] =
    useUpdateUserMutation()
  const isSubmitting = isCreating || isUpdating

  const form = useForm<FormValues>({
    initialValues: INITIAL_VALUES,
    validate: {
      username: (value) => {
        if (!value.trim()) return 'Username is required'
        if (value.length < 3) return 'Username must be at least 3 characters'
        if (!/^[a-z0-9._]+$/.test(value)) {
          return 'Use lowercase letters, numbers, dots, or underscores'
        }
        return null
      },
      email: (value) =>
        !value.trim()
          ? 'Email is required'
          : /^\S+@\S+\.\S+$/.test(value)
            ? null
            : 'Enter a valid email',
      firstName: (value) => (!value.trim() ? 'First name is required' : null),
      lastName: (value) => (!value.trim() ? 'Last name is required' : null),
      role: (value) => (!value ? 'Role is required' : null),
    },
  })

  const createUser = useFormMutation(createUserMutation, form)
  const updateUser = useFormMutation(updateUserMutation, form)

  useEffect(() => {
    if (!opened) {
      form.reset()
      return
    }

    if (isEdit && existing) {
      form.setValues({
        tenantId: existing.tenantId ?? '',
        username: existing.username,
        email: existing.email,
        firstName: existing.firstName ?? '',
        lastName: existing.lastName ?? '',
        firstNameAr: existing.firstNameAr ?? '',
        lastNameAr: existing.lastNameAr ?? '',
        role: existing.role,
        status: existing.status,
        mfaEnabled: existing.mfaEnabled,
      })
      return
    }

    if (!isEdit) {
      form.setValues({
        ...INITIAL_VALUES,
        tenantId: contextualTenantId,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, isEdit, existing, contextualTenantId])

  async function handleSubmit(values: FormValues) {
    if (isSuperAdmin && !isEdit && !values.tenantId.trim()) {
      form.setFieldError('tenantId', 'Tenant is required')
      return
    }

    const payload: CreateUserRequest = {
      userId: isEdit ? userId : undefined,
      tenantId: isSuperAdmin ? values.tenantId || undefined : undefined,
      username: values.username.trim().toLowerCase(),
      email: values.email.trim().toLowerCase(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      firstNameAr: values.firstNameAr.trim() || undefined,
      lastNameAr: values.lastNameAr.trim() || undefined,
      role: values.role,
      status: isEdit ? values.status : 'ACTIVE',
      mfaEnabled: isEdit ? values.mfaEnabled : false,
    }

    const result = isEdit
      ? await updateUser(payload)
      : await createUser(payload)

    if (!result.error && result.data) {
      notify({
        type: 'success',
        title: isEdit ? 'User updated' : 'User created',
        message: result.data.temporaryPassword
          ? `${values.firstName} ${values.lastName} created. Temporary password: ${result.data.temporaryPassword}`
          : `${values.firstName} ${values.lastName} has been ${isEdit ? 'updated' : 'created'} successfully.`,
        autoClose: result.data.temporaryPassword ? 12000 : 4000,
      })
      onClose()
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit User' : 'Create User'}
      size="lg"
      centered
      styles={{ body: { padding: '16px 32px 32px' } }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Text size="sm" fw={600}>
            Identity
          </Text>
          <SimpleGrid cols={2} spacing="md" verticalSpacing="md">
            <TextInput
              label="First Name (EN)"
              required
              disabled={isFetching}
              description=" "
              {...form.getInputProps('firstName')}
            />
            <TextInput
              label="Last Name (EN)"
              required
              disabled={isFetching}
              description=" "
              {...form.getInputProps('lastName')}
            />
            <TextInput
              label="First Name (AR)"
              dir="rtl"
              disabled={isFetching}
              description=" "
              {...form.getInputProps('firstNameAr')}
            />
            <TextInput
              label="Last Name (AR)"
              dir="rtl"
              disabled={isFetching}
              description=" "
              {...form.getInputProps('lastNameAr')}
            />
          </SimpleGrid>

          <Text size="sm" fw={600} mt="xs">
            Account
          </Text>
          <SimpleGrid cols={2} spacing="md" verticalSpacing="md">
            <TextInput
              label="Username"
              required
              disabled={isEdit || isFetching}
              description={
                isEdit ? 'Username cannot be changed' : 'lowercase.with_dots'
              }
              {...form.getInputProps('username')}
              onChange={(e) =>
                form.setFieldValue(
                  'username',
                  e.currentTarget.value.toLowerCase(),
                )
              }
            />
            <TextInput
              label="Email"
              required
              disabled={isFetching}
              description=" "
              {...form.getInputProps('email')}
            />
            {isSuperAdmin ? (
              <Select
                label="Tenant"
                required={!isEdit}
                searchable
                clearable={!isEdit}
                placeholder={
                  isEdit && !form.values.tenantId
                    ? 'Platform (no tenant)'
                    : 'Select tenant'
                }
                description={
                  isEdit && !form.values.tenantId
                    ? 'This user is not linked to a tenant'
                    : 'Organization that owns this account'
                }
                disabled={isEdit || isFetching || tenantsLoading}
                data={(tenants?.content ?? []).map((tenant) => ({
                  value: tenant.tenantId ?? '',
                  label: `${tenant.tenantName} (${tenant.tenantCode})`,
                }))}
                {...form.getInputProps('tenantId')}
              />
            ) : null}
            <Select
              label="Role"
              required
              disabled={isFetching}
              description=" "
              data={USER_ROLE_OPTIONS}
              {...form.getInputProps('role')}
            />
            {isEdit ? (
              <Select
                label="Status"
                required
                disabled={isFetching}
                description=" "
                data={USER_STATUS_OPTIONS}
                {...form.getInputProps('status')}
              />
            ) : null}
          </SimpleGrid>

          {isEdit ? (
            <Switch
              label="MFA enabled"
              description="Require TOTP on sign-in when enabled"
              disabled={isFetching}
              {...form.getInputProps('mfaEnabled', { type: 'checkbox' })}
            />
          ) : null}

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting || isFetching}>
              {isEdit ? 'Save changes' : 'Create user'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
