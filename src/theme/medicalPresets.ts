import { createTheme, type MantineColorsTuple } from '@mantine/core'

/**
 * Healthcare-oriented palettes (10 shades each, Mantine convention: 6 ≈ primary filled).
 *
 * Switch the active preset in `theme.ts` (`ACTIVE_PRESET`) — no other files required.
 */

/** Default — calm, trustworthy clinical blue (replaces Mantine default blue). */
export const clinicalBlue: MantineColorsTuple = [
  '#eef5fb',
  '#dceaf7',
  '#c5daf0',
  '#a8c5e6',
  '#84aad9',
  '#6291cb',
  '#4779b8',
  '#3a6499',
  '#325380',
  '#243d5c',
]

/** Corporate / enterprise hospital — deeper authority. Primary key: `navy`. */
export const deepNavy: MantineColorsTuple = [
  '#e8edf4',
  '#d4dce8',
  '#b6c4d8',
  '#91a7c4',
  '#6d89af',
  '#547096',
  '#435d82',
  '#374e6c',
  '#2e415a',
  '#1c293d',
]

/** Wellness / primary-care accent — soft teal-green (replaces default teal). Primary key: `teal`. */
export const healingTeal: MantineColorsTuple = [
  '#eaf8f6',
  '#d5f0eb',
  '#b8e5dd',
  '#93d5ca',
  '#68c2b3',
  '#49ab9d',
  '#3a9185',
  '#31756d',
  '#2b615b',
  '#1a403c',
]

/** Minimal “clean clinic” — muted slate-blue. Primary key: `indigo` (Mantine slot). */
export const slateCare: MantineColorsTuple = [
  '#f0f3f8',
  '#e2e7ef',
  '#cdd5e3',
  '#b3bfd3',
  '#94a5bf',
  '#788daa',
  '#5f7394',
  '#4e5f79',
  '#424f65',
  '#2c3545',
]

const SHARED = {
  defaultRadius: 'md',
  fontFamily:
    'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: 'inherit',
    fontWeight: '600',
  },
  respectReducedMotion: true,
  components: {
    Modal: {
      styles: {
        title: { fontWeight: 700 },
      },
    },
  },
}

export type MedicalPresetId = 'clinicalBlue' | 'deepNavy' | 'healingTeal' | 'slateCare'

export const MEDICAL_PRESET_META: Record<
  MedicalPresetId,
  { title: string; blurb: string; primaryColor: string; colors: Record<string, MantineColorsTuple> }
> = {
  clinicalBlue: {
    title: 'Clinical blue',
    blurb: 'Default — trust, clarity, common for healthcare SaaS and hospital portals.',
    primaryColor: 'blue',
    colors: { blue: clinicalBlue },
  },
  deepNavy: {
    title: 'Deep navy',
    blurb: 'Enterprise / university hospital; stronger contrast, formal tone.',
    primaryColor: 'navy',
    colors: { navy: deepNavy },
  },
  healingTeal: {
    title: 'Healing teal',
    blurb: 'Wellness, primary care, recovery — green-teal associated with health.',
    primaryColor: 'teal',
    colors: { teal: healingTeal },
  },
  slateCare: {
    title: 'Slate care',
    blurb: 'Understated gray-blue chrome; let alerts and data visualization carry color.',
    primaryColor: 'indigo',
    colors: { indigo: slateCare },
  },
}

export function createMedicalTheme(preset: MedicalPresetId) {
  const meta = MEDICAL_PRESET_META[preset]
  return createTheme({
    ...SHARED,
    primaryColor: meta.primaryColor,
    colors: meta.colors,
  })
}
