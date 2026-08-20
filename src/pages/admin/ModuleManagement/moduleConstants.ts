import type { ModuleStatus } from '../../../redux/features/modules/modulesTypes'

export const MODULE_STATUS_OPTIONS: { value: ModuleStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
]

export const MODULE_STATUS_COLORS = {
  ACTIVE: 'teal',
  INACTIVE: 'neutral',
} as const

export function isModuleLocked(module: { isSystemModule: boolean }): boolean {
  return module.isSystemModule
}

export function moduleLockReason(): string {
  return 'System module — cannot be modified or deleted.'
}
