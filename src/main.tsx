import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { RouterProvider } from 'react-router-dom'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css';
import { theme } from './theme/theme'
import { router } from './routes'
import './index.css'
import { store } from './redux/store'   
import { Provider } from 'react-redux'
import { Notifications } from '@mantine/notifications'

createRoot(document.getElementById('root') as HTMLDivElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <MantineProvider theme={theme} defaultColorScheme="auto">
        <Notifications limit={10} position="top-right"/>
        <RouterProvider router={router} />
      </MantineProvider>
    </Provider>
  </React.StrictMode>,
)
