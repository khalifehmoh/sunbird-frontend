import { Box } from '@mantine/core'
import { useParams } from 'react-router-dom'
import { useGetPatientAuditQuery } from '../../../redux/features/emr/emrApi'
import { PageHeader } from '../shared/PageHeader'
import { PatientAuditView } from './PatientAuditView'

export function PatientAuditPage() {
  const { id = '' } = useParams()
  const { data } = useGetPatientAuditQuery(id)

  return (
    <Box p="md">
      <PageHeader
        title="Patient audit trail"
        description={
          data
            ? `${data.patient.name}${data.patient.mrn ? ` · ${data.patient.mrn}` : ''}`
            : undefined
        }
        crumbs={[
          { label: 'Patients', to: '/emr/patients' },
          { label: 'Profile', to: `/emr/patients/${id}` },
          { label: 'Audit' },
        ]}
      />
      <PatientAuditView patientId={id} />
    </Box>
  )
}
