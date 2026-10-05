import { MedplumProvider } from '@medplum/react'
import { Outlet, useNavigate } from 'react-router-dom'
import '@medplum/react/styles.css'
import { medplum } from './medplumClient'

/**
 * Route wrapper that supplies the FHIR client to `@medplum/react`.
 *
 * `@medplum/react` is built on Mantine v8 — the same version this app already
 * uses — so its components inherit the surrounding `MantineProvider` theme
 * rather than bringing their own. No nested theme provider is needed.
 */
export function MedplumRoot() {
  const navigate = useNavigate()

  return (
    <MedplumProvider medplum={medplum} navigate={(path) => void navigate(path)}>
      <Outlet />
    </MedplumProvider>
  )
}
