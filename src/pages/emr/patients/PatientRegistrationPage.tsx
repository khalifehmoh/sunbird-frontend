import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Stepper,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notify } from '../../../lib/notify'
import {
  useRegisterPatientMutation,
  type RegisteredPatient,
  type RegisterPatientRequest,
} from '../../../redux/features/emr/emrApi'
import { PageHeader } from '../shared/PageHeader'
import { errorMessage, genderLabel } from '../shared/format'

type FormValues = {
  firstName: string
  lastName: string
  firstNameAr: string
  lastNameAr: string
  gender: string
  birthDate: string
  nationalId: string
  mobile: string
  email: string
  preferredLanguage: string
  contactName: string
  contactRelationship: string
  contactPhone: string
}

const NATIONAL_ID = /^[12]\d{9}$/
const PHONE = /^\+?[0-9]{8,15}$/
const EMAIL = /^\S+@\S+\.\S+$/

const IDENTITY_FIELDS = [
  'firstName',
  'lastName',
  'gender',
  'birthDate',
  'nationalId',
] as const
const CONTACT_FIELDS = [
  'mobile',
  'email',
  'contactName',
  'contactPhone',
] as const

function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="sm">{value || '—'}</Text>
    </Group>
  )
}

export function PatientRegistrationPage() {
  const navigate = useNavigate()
  const [active, setActive] = useState(0)
  const [created, setCreated] = useState<RegisteredPatient | null>(null)
  const [register, { isLoading }] = useRegisterPatientMutation()

  const form = useForm<FormValues>({
    initialValues: {
      firstName: '',
      lastName: '',
      firstNameAr: '',
      lastNameAr: '',
      gender: '',
      birthDate: '',
      nationalId: '',
      mobile: '',
      email: '',
      preferredLanguage: 'en',
      contactName: '',
      contactRelationship: '',
      contactPhone: '',
    },
    validate: {
      firstName: (v) => (v.trim() ? null : 'First name is required'),
      lastName: (v) => (v.trim() ? null : 'Last name is required'),
      gender: (v) => (v ? null : 'Gender is required'),
      birthDate: (v) => {
        if (!v) return 'Date of birth is required'
        if (v > todayIso()) return 'Date of birth cannot be in the future'
        return null
      },
      nationalId: (v) =>
        !v || NATIONAL_ID.test(v)
          ? null
          : '10 digits starting with 1 (citizen) or 2 (resident)',
      mobile: (v) =>
        !v || PHONE.test(v) ? null : '8-15 digits, optionally starting with +',
      email: (v) => (!v || EMAIL.test(v) ? null : 'Enter a valid email'),
      contactName: (v, values) =>
        !v && (values.contactPhone || values.contactRelationship)
          ? 'Contact name is required'
          : null,
      contactPhone: (v, values) => {
        if (!v) return values.contactName ? 'Contact phone is required' : null
        return PHONE.test(v) ? null : '8-15 digits, optionally starting with +'
      },
    },
  })

  function validateStep(fields: readonly (keyof FormValues)[]): boolean {
    const result = form.validate()
    return !fields.some((field) => field in result.errors)
  }

  function next() {
    if (active === 0 && !validateStep(IDENTITY_FIELDS)) return
    if (active === 1 && !validateStep(CONTACT_FIELDS)) return
    setActive((step) => Math.min(step + 1, 2))
  }

  async function submit() {
    if (form.validate().hasErrors) return
    const v = form.values
    const body: RegisterPatientRequest = {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      firstNameAr: v.firstNameAr.trim() || undefined,
      lastNameAr: v.lastNameAr.trim() || undefined,
      gender: v.gender as RegisterPatientRequest['gender'],
      birthDate: v.birthDate,
      nationalId: v.nationalId || undefined,
      mobile: v.mobile || undefined,
      email: v.email.trim() || undefined,
      preferredLanguage: v.preferredLanguage as 'en' | 'ar',
      emergencyContact: v.contactName
        ? {
            name: v.contactName.trim(),
            relationship: v.contactRelationship.trim() || undefined,
            phone: v.contactPhone,
          }
        : undefined,
    }
    try {
      const result = await register(body).unwrap()
      setCreated(result)
      notify({
        type: 'success',
        title: 'Patient registered',
        message: `${result.name} was assigned MRN ${result.mrn}.`,
      })
    } catch (error) {
      notify({
        type: 'error',
        title: 'Registration failed',
        message: errorMessage(error),
      })
    }
  }

  if (created) {
    return (
      <Box p="md">
        <PageHeader title="Patient registered" />
        <Paper withBorder radius="md" p="lg" maw={560}>
          <Stack>
            <Alert color="teal" title="Registration complete">
              {created.name} has been registered.
            </Alert>
            <ReviewRow label="Medical record number" value={created.mrn} />
            <Group>
              <Button component={Link} to={`/emr/patients/${created.id}`}>
                Open chart
              </Button>
              <Button
                variant="light"
                component={Link}
                to={`/clinical/adt/register?patient=${created.id}`}
              >
                Register a visit
              </Button>
              <Button variant="default" onClick={() => void navigate('/emr/patients')}>
                Back to worklist
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Box>
    )
  }

  const v = form.values

  return (
    <Box p="md">
      <PageHeader
        title="Register patient"
        crumbs={[{ label: 'Patients', to: '/emr/patients' }, { label: 'Register' }]}
        description="Fields marked * are required."
      />
      <Paper withBorder radius="md" p="lg">
        <Stepper active={active} onStepClick={(step) => step < active && setActive(step)}>
          <Stepper.Step label="Identity" description="Name, sex, birth date">
            <Stack mt="md" maw={720}>
              <TextInput
                label="Medical record number"
                value="Assigned automatically on save"
                readOnly
                disabled
              />
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput label="First name" withAsterisk {...form.getInputProps('firstName')} />
                <TextInput label="Last name" withAsterisk {...form.getInputProps('lastName')} />
                <TextInput label="First name (Arabic)" dir="rtl" {...form.getInputProps('firstNameAr')} />
                <TextInput label="Last name (Arabic)" dir="rtl" {...form.getInputProps('lastNameAr')} />
                <Select
                  label="Gender"
                  withAsterisk
                  data={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                    { value: 'unknown', label: 'Unknown' },
                  ]}
                  {...form.getInputProps('gender')}
                />
                <TextInput
                  label="Date of birth"
                  type="date"
                  withAsterisk
                  max={todayIso()}
                  {...form.getInputProps('birthDate')}
                />
              </SimpleGrid>
              <TextInput
                label="National ID / Iqama"
                description="10 digits; starts with 1 (citizen) or 2 (resident)"
                maxLength={10}
                {...form.getInputProps('nationalId')}
              />
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Contact" description="Phone, email, emergency contact">
            <Stack mt="md" maw={720}>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput label="Mobile" placeholder="+9665XXXXXXXX" {...form.getInputProps('mobile')} />
                <TextInput label="Email" {...form.getInputProps('email')} />
                <Select
                  label="Message language"
                  data={[
                    { value: 'en', label: 'English' },
                    { value: 'ar', label: 'Arabic' },
                  ]}
                  allowDeselect={false}
                  {...form.getInputProps('preferredLanguage')}
                />
              </SimpleGrid>
              <Title order={5} mt="sm">
                Emergency contact
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 3 }}>
                <TextInput label="Name" {...form.getInputProps('contactName')} />
                <TextInput label="Relationship" {...form.getInputProps('contactRelationship')} />
                <TextInput label="Phone" {...form.getInputProps('contactPhone')} />
              </SimpleGrid>
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Review" description="Confirm and save">
            <Stack mt="md" maw={560} gap={6}>
              <ReviewRow label="MRN" value="Assigned on save" />
              <ReviewRow label="Name" value={`${v.firstName} ${v.lastName}`.trim()} />
              <ReviewRow label="Name (Arabic)" value={`${v.firstNameAr} ${v.lastNameAr}`.trim()} />
              <ReviewRow label="Gender" value={genderLabel(v.gender)} />
              <ReviewRow label="Date of birth" value={v.birthDate} />
              <ReviewRow label="National ID" value={v.nationalId} />
              <ReviewRow label="Mobile" value={v.mobile} />
              <ReviewRow label="Email" value={v.email} />
              <ReviewRow label="Message language" value={v.preferredLanguage === 'ar' ? 'Arabic' : 'English'} />
              <ReviewRow
                label="Emergency contact"
                value={
                  v.contactName
                    ? `${v.contactName}${v.contactRelationship ? ` (${v.contactRelationship})` : ''} · ${v.contactPhone}`
                    : ''
                }
              />
            </Stack>
          </Stepper.Step>
        </Stepper>

        <Group justify="space-between" mt="xl">
          <Button
            variant="default"
            onClick={() => (active === 0 ? void navigate('/emr/patients') : setActive(active - 1))}
          >
            {active === 0 ? 'Cancel' : 'Back'}
          </Button>
          {active < 2 ? (
            <Button onClick={next}>Next</Button>
          ) : (
            <Button loading={isLoading} onClick={() => void submit()}>
              Register patient
            </Button>
          )}
        </Group>
      </Paper>
    </Box>
  )
}
