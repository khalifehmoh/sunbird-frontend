import type { PermissionOperation } from '../../../redux/features/modules/modulesTypes'

export const PERMISSION_OPERATIONS: {
  value: PermissionOperation
  label: string
}[] = [
  { value: 'CREATE', label: 'CREATE' },
  { value: 'READ', label: 'READ' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'EXPORT', label: 'EXPORT' },
  { value: 'APPROVE', label: 'APPROVE' },
  { value: 'PRINT', label: 'PRINT' },
]

export const OPERATION_COLORS: Record<string, string> = {
  CREATE: 'teal',
  READ: 'blue',
  UPDATE: 'yellow',
  DELETE: 'red',
  EXPORT: 'violet',
  APPROVE: 'orange',
  PRINT: 'cyan',
}
