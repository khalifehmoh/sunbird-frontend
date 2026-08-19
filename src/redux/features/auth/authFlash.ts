import type { NotificationType } from '../../../lib/notify'

const AUTH_FLASH_KEY = 'sunbird.authFlash'

export type AuthFlashMessage = {
  title: string
  message: string
  type?: NotificationType
}

export function setAuthFlash(flash: AuthFlashMessage) {
  try {
    sessionStorage.setItem(AUTH_FLASH_KEY, JSON.stringify(flash))
  } catch {
    // Ignore storage failures (private mode quotas, etc.).
  }
}

export function consumeAuthFlash(): AuthFlashMessage | null {
  try {
    const raw = sessionStorage.getItem(AUTH_FLASH_KEY)
    if (!raw) return null
    sessionStorage.removeItem(AUTH_FLASH_KEY)
    return JSON.parse(raw) as AuthFlashMessage
  } catch {
    return null
  }
}
