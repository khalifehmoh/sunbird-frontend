import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notify } from '../../../../lib/notify'
import {
  useCreatePermissionMutation,
  useGetModuleCatalogQuery,
  useGetPermissionQuery,
  useUpdatePermissionMutation,
} from '../../../../redux/features/modules/modulesApi'
import type {
  CreatePermissionRequest,
  PermissionOperation,
} from '../../../../redux/features/modules/modulesTypes'
import { usePermissions } from '../../../../hooks/usePermissions'
import { PERMISSION_OPERATIONS } from '../permissionConstants'

interface PermissionFormProps {
  opened: boolean
  onClose: () => void
  permissionId?: string
  defaultModuleId?: string
}

interface FormValues {
  permissionCode: string
  moduleId: string
  operation: PermissionOperation | ''
  permissionName: string
  permissionNameAr: string
}

const INITIAL_VALUES: FormValues = {
  permissionCode: '',
  moduleId: '',
  operation: '',
  permissionName: '',
  permissionNameAr: '',
}

export function PermissionForm({
  opened,
  onClose,
  permissionId,
  defaultModuleId,
}: PermissionFormProps) {
  const isEdit = Boolean(permissionId)
  const canCreate = usePermissions('PERMISSION:CREATE')
  const canUpdate = usePermissions('PERMISSION:UPDATE')
  const canUseForm = isEdit ? canUpdate : canCreate
  const [codeTouched, setCodeTouched] = useState(false)

  const {
    data: existing,
    isLoading: permissionLoading,
    isError: permissionError,
  } = useGetPermissionQuery(permissionId ?? '', {
    skip: !opened || !isEdit || !canUseForm,
  })

  const { data: catalog = [], isLoading: catalogLoading } =
    useGetModuleCatalogQuery(undefined, { skip: !opened || !canUseForm })

  const [createPermission, { isLoading: isCreating }] =
    useCreatePermissionMutation()
  const [updatePermission, { isLoading: isUpdating }] =
    useUpdatePermissionMutation()
  const isSubmitting = isCreating || isUpdating

  const moduleOptions = useMemo(
    () =>
      catalog.map((module) => ({
        value: module.moduleId,
        label: `${module.moduleName} (${module.moduleCode})`,
      })),
    [catalog],
  )

  const form = useForm<FormValues>({
    initialValues: {
      ...INITIAL_VALUES,
      moduleId: defaultModuleId ?? '',
    },
    validate: {
      permissionCode: (value) => {
        if (!value.trim()) return 'Permission code is required'
        return /^[A-Z0-9][A-Z0-9_:.-]*$/.test(value)
          ? null
          : 'Use uppercase letters, numbers, colons, dots, hyphens, or underscores'
      },
      moduleId: (value) => (value ? null : 'Module is required'),
      operation: (value) => (value ? null : 'Operation is required'),
      permissionName: (value) =>
        value.trim() ? null : 'Display name is required',
    },
  })

  useEffect(() => {
    if (!opened) {
      form.setValues({
        ...INITIAL_VALUES,
        moduleId: defaultModuleId ?? '',
      })
      form.resetDirty()
      setCodeTouched(false)
      return
    }
    if (!isEdit) {
      form.setFieldValue('moduleId', defaultModuleId ?? '')
      setCodeTouched(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, isEdit, defaultModuleId])

  useEffect(() => {
    if (!opened || !isEdit || !existing) return
    form.setValues({
      permissionCode: existing.permissionCode,
      moduleId: existing.moduleId,
      operation: existing.operation as PermissionOperation,
      permissionName: existing.permissionName,
      permissionNameAr: existing.permissionNameAr ?? '',
    })
    form.resetDirty()
    setCodeTouched(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, isEdit, existing])

  const selectedModule = catalog.find(
    (module) => module.moduleId === form.values.moduleId,
  )

  useEffect(() => {
    if (!opened || isEdit || codeTouched) return
    if (!selectedModule || !form.values.operation) return
    form.setFieldValue(
      'permissionCode',
      `${selectedModule.moduleCode}:${form.values.operation}`,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    opened,
    isEdit,
    codeTouched,
    selectedModule?.moduleCode,
    form.values.operation,
  ])

  async function handleSubmit(values: FormValues) {
    if (!values.operation) return
    const request: CreatePermissionRequest = {
      permissionId: isEdit ? permissionId : undefined,
      permissionCode: values.permissionCode.trim().toUpperCase(),
      moduleId: values.moduleId,
      operation: values.operation,
      permissionName: values.permissionName.trim(),
      permissionNameAr: values.permissionNameAr.trim() || undefined,
    }

    try {
      if (isEdit) {
        await updatePermission(request).unwrap()
      } else {
        await createPermission(request).unwrap()
      }
      notify({
        type: 'success',
        title: isEdit ? 'Permission updated' : 'Permission created',
        message: `${values.permissionCode} was ${
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
      title={isEdit ? 'Edit permission' : 'Create permission'}
      size="lg"
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      {!canUseForm ? (
        <Alert color="red" title="Permission required">
          You don&apos;t have permission to {isEdit ? 'update' : 'create'} a
          permission.
        </Alert>
      ) : permissionError ? (
        <Alert color="red" title="Permission not found">
          The permission could not be loaded.
        </Alert>
      ) : permissionLoading ? (
        <Stack>
          <Skeleton height={58} />
          <Skeleton height={58} />
          <Skeleton height={58} />
        </Stack>
      ) : (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="lg">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Select
                label="Module"
                placeholder="Select module"
                data={moduleOptions}
                searchable
                required
                disabled={catalogLoading}
                {...form.getInputProps('moduleId')}
              />

              <Select
                label="Operation"
                placeholder="Select operation"
                data={PERMISSION_OPERATIONS}
                required
                allowDeselect={false}
                {...form.getInputProps('operation')}
              />

              <TextInput
                label="Permission code"
                placeholder="e.g. USER:READ"
                description="Unique. Suggested from module and operation."
                required
                {...form.getInputProps('permissionCode')}
                onChange={(event) => {
                  setCodeTouched(true)
                  form.setFieldValue(
                    'permissionCode',
                    event.currentTarget.value.toUpperCase(),
                  )
                }}
              />

              <TextInput
                label="Display name (EN)"
                placeholder="Human readable name"
                required
                {...form.getInputProps('permissionName')}
              />

              <TextInput
                label="Display name (AR)"
                placeholder="اسم الصلاحية بالعربية"
                dir="rtl"
                {...form.getInputProps('permissionNameAr')}
              />
            </SimpleGrid>

            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {isEdit ? 'Save changes' : 'Create permission'}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  )
}
