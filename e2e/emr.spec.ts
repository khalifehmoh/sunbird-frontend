import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from 'playwright/test'

const API = process.env.E2E_API_URL ?? 'http://localhost:8080/api/v1'
const RUN = `E2E${Date.now().toString(36).toUpperCase()}`

function credentials(): { username: string; password: string } | null {
  const username = process.env.E2E_USERNAME
  const password = process.env.E2E_PASSWORD
  if (username && password) return { username, password }
  // Local convenience: the backend repo keeps the dev login in a gitignored file.
  const file = join(process.cwd(), '..', 'sunbird-core-backend-nestjs', 'LOCAL_CREDENTIALS.md')
  if (!existsSync(file)) return null
  const body = readFileSync(file, 'utf8')
  const user = /Username:\s*`([^`]+)`/.exec(body)?.[1]
  const pass = /Password:\s*`([^`]+)`/.exec(body)?.[1]
  return user && pass ? { username: user, password: pass } : null
}

const login = credentials()
test.skip(!login, 'Set E2E_USERNAME and E2E_PASSWORD to run the EMR browser tests')

async function signIn(page: Page) {
  await page.goto('/')
  await page.getByLabel('Username').fill(login!.username)
  await page.getByLabel('Password').fill(login!.password)
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page).toHaveURL(/\/emr\/dashboard/)
}

/** The browser context shares the session cookie with the API host. */
async function api<T>(page: Page, method: 'GET' | 'POST', path: string, data?: unknown): Promise<T> {
  const response = await page.request.fetch(`${API}${path}`, { method, data })
  expect(response.ok(), `${method} ${path} -> ${response.status()}`).toBe(true)
  return (await response.json()) as T
}

test.describe.configure({ mode: 'serial' })

test.describe('EMR in the browser', () => {
  let patient: { id: string; mrn: string; name: string }

  test('signs in and lands on the EMR dashboard with its zones', async ({ page }) => {
    await signIn(page)
    await expect(page.getByRole('heading', { name: 'EMR dashboard' })).toBeVisible()
    await expect(page.getByText('Active inpatients').first()).toBeVisible()

    await page.getByRole('tab', { name: 'Registration' }).click()
    await expect(page.getByText('OPD visits')).toBeVisible()
    await page.getByRole('tab', { name: 'Clinical' }).click()
    await expect(page.getByText('Pending orders')).toBeVisible()
    await page.getByRole('tab', { name: 'Integration' }).click()
    await expect(page.getByText('Received today')).toBeVisible()
  })

  test('registers a patient through the three-step form', async ({ page }) => {
    await signIn(page)
    await page.goto('/emr/patients/new')

    // Required labels carry a trailing asterisk, and the Arabic fields share the prefix.
    await page.getByLabel(/^First name( \*)?$/).fill(RUN)
    await page.getByLabel(/^Last name( \*)?$/).fill('Browser')
    await page.getByRole('textbox', { name: 'Gender' }).click()
    await page.getByRole('option', { name: 'Female' }).click()
    await page.getByLabel('Date of birth').fill('1990-05-01')
    await page.getByRole('button', { name: 'Next' }).click()

    await page.getByLabel('Mobile').fill(`+9665${`${Date.now()}`.slice(-8)}`)
    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.getByText('Assigned on save')).toBeVisible()
    await page.getByRole('button', { name: 'Register patient' }).click()

    await expect(page.getByText('Registration complete')).toBeVisible()
    const mrn = (await page.getByText(/AR-MED-001-\d+/).first().innerText()).match(/AR-MED-001-\d+/)![0]
    const found = await api<{ items: { id: string; mrn: string; name: string }[] }>(
      page,
      'GET',
      `/emr/patients?q=${mrn}`,
    )
    expect(found.items).toHaveLength(1)
    patient = found.items[0]
  })

  test('finds the patient by MRN in the working list and opens the chart', async ({ page }) => {
    await signIn(page)
    await page.goto('/emr/patients')
    await page.getByPlaceholder('Name, MRN or mobile').fill(patient.mrn)
    const row = page.getByText(patient.name).first()
    await expect(row).toBeVisible()
    await row.click()
    await expect(page.getByText(patient.mrn).first()).toBeVisible()

    await page.goto(`/emr/patients/${patient.id}`)
    for (const tab of ['Encounters', 'Orders', 'Results', 'Vitals', 'Diagnoses', 'Appointments', 'Audit']) {
      await expect(page.getByRole('tab', { name: tab })).toBeVisible()
    }
    await page.getByRole('tab', { name: 'Audit' }).click()
    await expect(page.getByText(/created/i).first()).toBeVisible()
  })

  test('places an order; the patient picker keeps the chosen patient', async ({ page }) => {
    await signIn(page)
    await page.goto('/emr/orders/new')

    const picker = page.getByPlaceholder('Search by name, MRN or mobile')
    await picker.fill(patient.mrn)
    await page.getByRole('option', { name: new RegExp(patient.mrn) }).click()

    // Regression: the value used to flicker back to an id after selection.
    const chosen = await picker.inputValue()
    expect(chosen).toContain(patient.name)
    await page.waitForTimeout(1500)
    expect(await picker.inputValue()).toBe(chosen)

    const test = page.getByPlaceholder('Search the catalogue')
    await test.click()
    await page.getByRole('option', { name: /Hemoglobin/ }).first().click()
    await page.getByLabel('Clinical notes').fill(`${RUN} browser order`)
    await page.getByRole('button', { name: 'Place order' }).click()

    await expect(page).toHaveURL(new RegExp(`/emr/orders\\?patientId=${patient.id}`))
    await expect(page.getByText(/ORD-\d{4}-\d+/).first()).toBeVisible()
    await expect(page.getByText('Hemoglobin').first()).toBeVisible()
  })

  test('shows a new order that arrives from another system without a reload', async ({ page }) => {
    await signIn(page)
    await page.goto(`/emr/orders?patientId=${patient.id}`)
    await expect(page.getByText(/ORD-\d{4}-\d+/).first()).toBeVisible()

    const created = await api<{ orderNumber: string }>(page, 'POST', '/emr/orders', {
      patientId: patient.id,
      type: 'LAB',
      code: '777-3',
      notes: `${RUN} arrives while the list is open`,
    })
    // The list polls every 15 s and announces new rows.
    await expect(page.getByText(created.orderNumber).first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('New order').first()).toBeVisible()
  })

  test('an inpatient stay is visible on the bed board and the encounter list', async ({ page }) => {
    await signIn(page)
    const board = await api<{
      locations: { id: string; physicalType: string; occupiedByEncounterId: string | null }[]
    }>(page, 'GET', '/adt/beds')
    const bed = board.locations.find((l) => l.physicalType === 'bd' && !l.occupiedByEncounterId)
    expect(bed, 'a free bed is needed').toBeTruthy()

    const stay = await api<{ id: string; visitNumber: string }>(page, 'POST', '/adt/admit', {
      patientId: patient.id,
      admitType: 'routine',
      bedLocationId: bed!.id,
    })

    await page.goto('/clinical/adt/beds')
    await expect(page.getByRole('heading', { name: 'Bed board' })).toBeVisible()
    const after = await api<typeof board>(page, 'GET', '/adt/beds')
    const occupied = after.locations.filter((l) => l.physicalType === 'bd' && l.occupiedByEncounterId)
    expect(occupied.map((l) => l.id)).toContain(bed!.id)
    await expect(page.getByText(/^occupied$/i)).toHaveCount(occupied.length)

    await page.goto('/clinical/encounters')
    await expect(page.getByText(stay.visitNumber).first()).toBeVisible()

    await page.goto(`/emr/patients?filter=inpatient&q=${patient.mrn}`)
    await expect(page.getByText(patient.name).first()).toBeVisible()

    await api(page, 'POST', '/adt/discharge', {
      encounterId: stay.id,
      dischargeDateTime: new Date().toISOString(),
      dischargeDisposition: 'home',
      dischargeCondition: 'improved',
    })
    await page.goto(`/emr/patients?filter=inpatient&q=${patient.mrn}`)
    await expect(page.getByText(patient.name)).toHaveCount(0)
  })

  test('the result and integration pages load', async ({ page }) => {
    await signIn(page)
    for (const [path, heading] of [
      ['/emr/results', 'Results'],
      ['/emr/results/critical', 'Critical results'],
      ['/emr/integration', 'Integration monitor'],
      ['/emr/appointments', 'Appointments'],
      ['/emr/vitals', 'Vital signs'],
      ['/emr/diagnoses', 'Diagnoses'],
    ] as const) {
      await page.goto(path)
      await expect(page.getByRole('heading', { name: heading, exact: true }).first(), path).toBeVisible()
    }
  })

  test('the notification log always fetches fresh data', async ({ page }) => {
    await signIn(page)
    await page.goto('/emr/notifications')
    await expect(page.getByRole('heading', { name: 'Notification log' })).toBeVisible()
    await expect(page.getByText('NOTIF_PATIENT_WELCOME').first()).toBeVisible()

    // Leave and come back inside the app (no reload): a cached copy would not hit the API.
    await page.getByRole('link', { name: 'Patients', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Patients', exact: true })).toBeVisible()
    const refetch = page.waitForRequest((request) => /\/emr\/notifications\?/.test(request.url()))
    await page.goBack()
    await refetch
    await expect(page.getByText('NOTIF_PATIENT_WELCOME').first()).toBeVisible()
  })

  test('the FHIR capability statement is public', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/fhir/metadata')
    await expect(page.getByText(/CapabilityStatement|Capability statement/i).first()).toBeVisible()
    await context.close()
  })
})
