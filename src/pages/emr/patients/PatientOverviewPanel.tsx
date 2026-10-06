import { Badge, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import type { PatientOverview } from '../../../redux/features/emr/emrApi'
import {
  FLAG_COLOR,
  PATIENT_CLASS_COLOR,
  PATIENT_CLASS_LABEL,
  formatDate,
  formatDateTime,
  genderLabel,
} from '../shared/format'

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Title order={5} mb="xs">
        {title}
      </Title>
      {children}
    </Paper>
  )
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Group justify="space-between" wrap="nowrap" gap="md">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="sm" ta="right">
        {value || '—'}
      </Text>
    </Group>
  )
}

function Empty({ children }: { children: string }) {
  return (
    <Text size="sm" c="dimmed">
      {children}
    </Text>
  )
}

/** The summary cards shown in the worklist pane and on the profile. */
export function PatientOverviewPanel({ overview }: { overview: PatientOverview }) {
  const { patient, activeEncounter, ward } = overview

  return (
    <Stack gap="md">
      {patient.allergies.length > 0 && (
        <Paper withBorder radius="md" p="sm" bg="var(--mantine-color-red-light)">
          <Group gap="xs">
            <Text size="sm" fw={700} c="red">
              Allergies
            </Text>
            {patient.allergies.map((allergy) => (
              <Badge key={allergy} color="red" variant="filled">
                {allergy}
              </Badge>
            ))}
          </Group>
        </Paper>
      )}

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Card title="Demographics">
          <Stack gap={4}>
            <Field label="MRN" value={patient.mrn} />
            <Field label="Gender" value={genderLabel(patient.gender)} />
            <Field
              label="Date of birth"
              value={
                patient.birthDate
                  ? `${formatDate(patient.birthDate)}${patient.ageYears !== null ? ` (${patient.ageYears} y)` : ''}`
                  : null
              }
            />
            <Field label="National ID" value={patient.nationalId} />
            <Field label="Mobile" value={patient.mobile} />
            <Field label="Email" value={patient.email} />
            <Field
              label="Message language"
              value={patient.preferredLanguage === 'ar' ? 'Arabic' : 'English'}
            />
            <Field
              label="Emergency contact"
              value={
                patient.emergencyContact
                  ? `${patient.emergencyContact.name}${patient.emergencyContact.relationship ? ` (${patient.emergencyContact.relationship})` : ''} · ${patient.emergencyContact.phone ?? ''}`
                  : null
              }
            />
          </Stack>
        </Card>

        <Card title="Current visit">
          {activeEncounter ? (
            <Stack gap={4}>
              <Field
                label="Class"
                value={
                  <Badge
                    color={PATIENT_CLASS_COLOR[activeEncounter.patientClass] ?? 'gray'}
                    variant="light"
                  >
                    {PATIENT_CLASS_LABEL[activeEncounter.patientClass] ??
                      activeEncounter.patientClass}
                  </Badge>
                }
              />
              <Field label="Visit" value={activeEncounter.visitNumber} />
              <Field label="Ward" value={ward} />
              <Field label="Location" value={activeEncounter.locationDisplay} />
              <Field label="Attending" value={activeEncounter.attendingDisplay} />
              <Field label="Since" value={formatDateTime(activeEncounter.periodStart)} />
              <Field
                label="Length of stay"
                value={
                  activeEncounter.lengthOfStayDays !== null
                    ? `${activeEncounter.lengthOfStayDays} day(s)`
                    : null
                }
              />
            </Stack>
          ) : (
            <Empty>No active visit.</Empty>
          )}
        </Card>

        <Card title="Latest vitals">
          {overview.latestVitals.length === 0 ? (
            <Empty>No vitals recorded.</Empty>
          ) : (
            <Stack gap={4}>
              {overview.latestVitals.map((vital) => (
                <Group key={vital.id} justify="space-between" wrap="nowrap">
                  <Text size="sm" c="dimmed">
                    {vital.display}
                  </Text>
                  <Group gap={6} wrap="nowrap">
                    <Text size="sm" fw={600}>
                      {vital.value} {vital.unit}
                    </Text>
                    {vital.flag !== 'normal' && vital.flag !== 'unrated' && (
                      <Badge size="xs" color={FLAG_COLOR[vital.flag]}>
                        {vital.flag}
                      </Badge>
                    )}
                  </Group>
                </Group>
              ))}
              <Text size="xs" c="dimmed">
                {formatDateTime(overview.latestVitals[0]?.measuredAt)}
              </Text>
            </Stack>
          )}
        </Card>

        <Card title="Diagnoses">
          {overview.diagnoses.length === 0 ? (
            <Empty>No diagnoses.</Empty>
          ) : (
            <Stack gap={4}>
              {overview.diagnoses.map((diagnosis) => (
                <Group key={diagnosis.id} justify="space-between" wrap="nowrap">
                  <Text size="sm">
                    {diagnosis.display}{' '}
                    <Text span size="xs" c="dimmed">
                      {diagnosis.code}
                    </Text>
                  </Text>
                  {diagnosis.type && (
                    <Badge size="xs" variant="light">
                      {diagnosis.type}
                    </Badge>
                  )}
                </Group>
              ))}
            </Stack>
          )}
        </Card>

        <Card title="Upcoming appointments">
          {overview.upcomingAppointments.length === 0 ? (
            <Empty>No upcoming appointments.</Empty>
          ) : (
            <Stack gap={4}>
              {overview.upcomingAppointments.map((appointment) => (
                <Group key={appointment.id} justify="space-between" wrap="nowrap">
                  <Text size="sm">{formatDateTime(appointment.start)}</Text>
                  <Text size="sm" c="dimmed">
                    {appointment.practitionerName ?? '—'}
                  </Text>
                </Group>
              ))}
            </Stack>
          )}
        </Card>

        <Card title="Recent activity">
          {overview.recentActivity.length === 0 ? (
            <Empty>No activity yet.</Empty>
          ) : (
            <Stack gap={6}>
              {overview.recentActivity.map((item) => (
                <div key={`${item.type}-${item.id}`}>
                  <Group justify="space-between" wrap="nowrap">
                    <Text size="sm">{item.title}</Text>
                    <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                      {formatDateTime(item.at)}
                    </Text>
                  </Group>
                  {item.detail && (
                    <Text size="xs" c="dimmed">
                      {item.detail}
                    </Text>
                  )}
                </div>
              ))}
            </Stack>
          )}
        </Card>
      </SimpleGrid>
    </Stack>
  )
}
