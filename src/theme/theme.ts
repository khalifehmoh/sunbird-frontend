import type { MedicalPresetId } from './medicalPresets'
import { createMedicalTheme, MEDICAL_PRESET_META } from './medicalPresets'

export { MEDICAL_PRESET_META, type MedicalPresetId }

/**
 * Active healthcare design preset.
 *
 * Options (see `medicalPresets.ts` for full descriptions):
 * - `clinicalBlue` — medical blue (default)
 * - `deepNavy` — corporate hospital navy
 * - `healingTeal` — wellness / primary-care teal
 * - `slateCare` — minimal slate-blue chrome
 */
export const ACTIVE_PRESET: MedicalPresetId = 'clinicalBlue'

export const theme = createMedicalTheme(ACTIVE_PRESET)
