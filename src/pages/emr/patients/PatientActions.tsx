import { Button, Group } from '@mantine/core'
import { Link } from 'react-router-dom'
import { EmrAccess } from '../../../constants/permissions'
import { useHasPermissions } from '../../../hooks/usePermissions'

type Props = {
  patientId: string
  /** Active encounter, which transfer and discharge act on. */
  encounterId?: string | null
  patientClass?: string | null
  /** Hide the "Open chart" button on the profile page itself. */
  hideChart?: boolean
}

/** Per-patient quick actions, each gated by what the target screen needs. */
export function PatientActions({
  patientId,
  encounterId,
  patientClass,
  hideChart,
}: Props) {
  const canCreate = useHasPermissions(EmrAccess.create)
  const canUpdate = useHasPermissions(EmrAccess.update)
  const inpatient = patientClass === 'IMP' && !!encounterId
  const adtQuery = `patient=${patientId}&encounter=${encounterId ?? ''}`

  return (
    <Group gap="xs">
      {!hideChart && (
        <Button component={Link} to={`/emr/patients/${patientId}`} size="xs">
          Open chart
        </Button>
      )}
      {canCreate && (
        <Button
          component={Link}
          to={`/emr/orders/new?patientId=${patientId}`}
          size="xs"
          variant="light"
        >
          New order
        </Button>
      )}
      {canCreate && (
        <Button
          component={Link}
          to={`/emr/vitals/new?patientId=${patientId}`}
          size="xs"
          variant="light"
        >
          Record vitals
        </Button>
      )}
      {canUpdate && inpatient && (
        <Button
          component={Link}
          to={`/clinical/adt/transfer?${adtQuery}`}
          size="xs"
          variant="light"
          color="indigo"
        >
          Transfer
        </Button>
      )}
      {canUpdate && inpatient && (
        <Button
          component={Link}
          to={`/clinical/adt/discharge?${adtQuery}`}
          size="xs"
          variant="light"
          color="grape"
        >
          Discharge
        </Button>
      )}
    </Group>
  )
}
