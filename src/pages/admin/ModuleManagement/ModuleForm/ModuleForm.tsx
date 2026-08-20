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
  useCreateModuleMutation,
  useGetModuleQuery,
  useUpdateModuleMutation,
} from '../../../../redux/features/modules/modulesApi'
import type {
  CreateModuleRequest,
  ModuleStatus,
} from '../../../../redux/features/modules/modulesTypes'
import { usePermissions } from '../../../../hooks/usePermissions'
import {
  MODULE_STATUS_OPTIONS,
  isModuleLocked,
  moduleLockReason,
} from '../moduleConstants'

interface ModuleFormProps {
  opened: boolean
  onClose: () => void
  moduleId?: string
}

interface FormValues {
  moduleCode: string
  moduleName: string
  moduleNameAr: string
  moduleDescription: string
  status: ModuleStatus
}

const INITIAL_VALUES: FormValues = {
  moduleCode: '',
  moduleName: '',
  moduleNameAr: '',
  moduleDescription: '',
  status: 'ACTIVE',
}

export function ModuleForm({ opened, onClose, moduleId }: ModuleFormProps) {
  const isEdit = Boolean(moduleId)
  const canCreate = usePermissions('MODULE:CREATE')
  const canUpdate = usePermissions('MODULE:UPDATE')
  const canUseForm = isEdit ? canUpdate : canCreate

  const {
    data: existing,
    isLoading: moduleLoading,
    isError: moduleError,
  } = useGetModuleQuery(moduleId ?? '', {
    skip: !opened || !isEdit || !canUseForm,
  })

  const [createModule, { isLoading: isCreating }] = useCreateModuleMutation()
  const [updateModule, { isLoading: isUpdating }] = useUpdateModuleMutation()
  const isSubmitting = isCreating || isUpdating

  const form = useForm<FormValues>({
    initialValues: INITIAL_VALUES,
    validate: {
      moduleCode: (value) => {
        if (!value.trim()) return 'Module code is required'
        return /^[A-Z0-9][A-Z0-9_-]*$/.test(value)
          ? null
          : 'Use uppercase letters, numbers, hyphens, or underscores'
      },
      moduleName: (value) =>
        value.trim() ? null : 'Module name is required',
    },
  })

  useEffect(() => {
    if (!opened) {
      form.setValues(INITIAL_VALUES)
      form.resetDirty()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, isEdit])

  useEffect(() => {
    if (!opened || !isEdit || !existing) return
    form.setValues({
      moduleCode: existing.moduleCode,
      moduleName: existing.moduleName,
      moduleNameAr: existing.moduleNameAr ?? '',
      moduleDescription: existing.moduleDescription ?? '',
      status: existing.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    })
    form.resetDirty()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, isEdit, existing])

  async function handleSubmit(values: FormValues) {
    const request: CreateModuleRequest = {
      moduleId: isEdit ? moduleId : undefined,
      moduleCode: values.moduleCode.trim().toUpperCase(),
      moduleName: values.moduleName.trim(),
      moduleNameAr: values.moduleNameAr.trim() || undefined,
      moduleDescription: values.moduleDescription.trim() || undefined,
      status: values.status,
    }

    try {
      if (isEdit) {
        await updateModule(request).unwrap()
      } else {
        await createModule(request).unwrap()
      }
      notify({
        type: 'success',
        title: isEdit ? 'Module updated' : 'Module created',
        message: `${values.moduleName} was ${
          isEdit ? 'updated' : 'created'
        } successfully.`,
      })
      onClose()
    } catch {
      // Shared base query shows API errors.
    }
  }

  const systemLocked = existing ? isModuleLocked(existing) : false

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit module' : 'Create module'}
      size="lg"
      centered
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      {!canUseForm ? (
        <Alert color="red" title="Permission required">
          You don&apos;t have permission to {isEdit ? 'update' : 'create'} a
          module.
        </Alert>
      ) : moduleError ? (
        <Alert color="red" title="Module not found">
          The module could not be loaded.
        </Alert>
      ) : systemLocked ? (
        <Alert color="blue" title="Module locked">
          {moduleLockReason()}
        </Alert>
      ) : moduleLoading ? (
        <Stack>
          <Skeleton height={58} />
          <Skeleton height={58} />
          <Skeleton height={58} />
        </Stack>
      ) : (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="lg">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput
                label="Module code"
                placeholder="e.g. BILLING"
                description="Unique; cannot change after creation"
                required
                disabled={isEdit}
                {...form.getInputProps('moduleCode')}
                onChange={(event) =>
                  form.setFieldValue(
                    'moduleCode',
                    event.currentTarget.value.toUpperCase(),
                  )
                }
              />

              <TextInput
                label="Module name (EN)"
                placeholder="English module name"
                required
                {...form.getInputProps('moduleName')}
              />

              <TextInput
                label="Module name (AR)"
                placeholder="اسم الوحدة بالعربية"
                dir="rtl"
                {...form.getInputProps('moduleNameAr')}
              />

              <Select
                label="Status"
                data={MODULE_STATUS_OPTIONS}
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
              {...form.getInputProps('moduleDescription')}
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
                {isEdit ? 'Save changes' : 'Create module'}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  )
}
