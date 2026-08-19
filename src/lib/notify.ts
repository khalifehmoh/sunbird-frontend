import { notifications } from '@mantine/notifications'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

const COLOR_BY_TYPE: Record<NotificationType, string> = {
  success: 'teal',
  error: 'red',
  warning: 'orange',
  info: 'blue',
}

export function notify(options: {
  type: NotificationType
  title: string
  message: string
  autoClose?: number | false
}) {
  notifications.show({
    color: COLOR_BY_TYPE[options.type],
    title: options.title,
    message: options.message,
    autoClose: options.autoClose,
  })
}
