import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { RouterProvider } from 'react-router-dom'
import '@mantine/core/styles.css'
import '@mantine/charts/styles.css'
import '@mantine/notifications/styles.css';
import { theme } from './theme/theme'
import { router } from './routing/routes'
import './index.css'
import { store, persistor } from './redux/store'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'

createRoot(document.getElementById('root') as HTMLDivElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <ModalsProvider>
            <Notifications limit={10} position="top-right" />
            <RouterProvider router={router} />
          </ModalsProvider>
        </MantineProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
)
