import type { MantineColor } from '@mantine/core'

export { adtErrorMessage as errorMessage } from '../../clinical/adt/adtError'

/** `2026-10-06T08:30:00Z` → `06 Oct 2026, 11:30` (viewer's local zone). */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Local `YYYY-MM-DD` for a Date (not UTC, so "today" matches the wall clock). */
export function toLocalIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`)
  date.setDate(date.getDate() + days)
  return toLocalIsoDate(date)
}

/** Wall-clock `HH:mm` of an instant at the clinic's fixed UTC offset. */
export function clinicClock(iso: string, utcOffsetMinutes: number): string {
  const local = new Date(new Date(iso).getTime() + utcOffsetMinutes * 60_000)
  return `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`
}

/** Start of the week (Sunday) containing `date`, as `YYYY-MM-DD`. */
export function weekStartOf(date: Date): string {
  const copy = new Date(date)
  copy.setDate(copy.getDate() - copy.getDay())
  return toLocalIsoDate(copy)
}

export function weekdayLabel(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
}

export const PATIENT_CLASS_LABEL: Record<string, string> = {
  IMP: 'Inpatient',
  AMB: 'Outpatient',
  EMER: 'Emergency',
}

export const PATIENT_CLASS_COLOR: Record<string, MantineColor> = {
  IMP: 'blue',
  AMB: 'teal',
  EMER: 'red',
}

export const ORDER_STATUS_COLOR: Record<string, MantineColor> = {
  active: 'blue',
  completed: 'teal',
  revoked: 'gray',
  'on-hold': 'yellow',
  draft: 'gray',
  'entered-in-error': 'red',
}

export const PRIORITY_COLOR: Record<string, MantineColor> = {
  ROUTINE: 'gray',
  URGENT: 'orange',
  STAT: 'red',
}

export const FLAG_COLOR: Record<string, MantineColor> = {
  critical: 'red',
  abnormal: 'orange',
  normal: 'teal',
  unrated: 'gray',
}

export const REPORT_STATUS_COLOR: Record<string, MantineColor> = {
  final: 'teal',
  preliminary: 'yellow',
  amended: 'violet',
  corrected: 'violet',
  registered: 'gray',
  cancelled: 'gray',
}

export const APPOINTMENT_STATUS_COLOR: Record<string, MantineColor> = {
  booked: 'blue',
  fulfilled: 'teal',
  cancelled: 'gray',
  noshow: 'orange',
  proposed: 'gray',
  pending: 'yellow',
}

export const MESSAGE_STATUS_COLOR: Record<string, MantineColor> = {
  RECEIVED: 'yellow',
  PROCESSED: 'teal',
  FAILED: 'red',
}

export const NOTIFICATION_STATUS_COLOR: Record<string, MantineColor> = {
  PENDING: 'yellow',
  SENT: 'teal',
  FAILED: 'red',
}

export function genderLabel(value: string | null | undefined): string {
  if (!value) return '—'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Human label for a FHIR search failure or any thrown value. */
export function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: unknown }).status === 404
  )
}
