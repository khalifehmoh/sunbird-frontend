import { useEffect, useState } from 'react'
import {
  Badge,
  Code,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import { Bell, Check, MessageSquare, X } from 'lucide-react'
import {
  useGetDischargeNotificationsQuery,
  type DemoSms,
  type DischargeNotificationsResponse,
} from '../../../redux/features/events/eventsApi'

type Props = {
  encounterId: string
  /** Open the backend SSE watch (timeout owned by the API). */
  watch?: boolean
}

type WatchSnapshot = Pick<
  DischargeNotificationsResponse,
  'bot' | 'bullmq' | 'items' | 'sms'
> & {
  status: 'watching' | 'complete' | 'timeout' | 'error' | 'idle'
}

type PathState = 'ready' | 'waiting' | 'timed-out' | 'idle'

function PathStatus({ label, state }: { label: string; state: PathState }) {
  if (state === 'ready') {
    return (
      <Badge
        color="teal"
        variant="light"
        leftSection={
          <ThemeIcon size={12} color="teal" variant="transparent">
            <Check size={12} />
          </ThemeIcon>
        }
      >
        {label}
      </Badge>
    )
  }
  if (state === 'waiting') {
    return (
      <Badge color="gray" variant="outline" leftSection={<Loader size={10} />}>
        {label}…
      </Badge>
    )
  }
  if (state === 'timed-out') {
    return (
      <Badge
        color="red"
        variant="light"
        leftSection={
          <ThemeIcon size={12} color="red" variant="transparent">
            <X size={12} />
          </ThemeIcon>
        }
      >
        {label} timed out
      </Badge>
    )
  }
  return (
    <Badge color="yellow" variant="light">
      {label} pending
    </Badge>
  )
}

function pathState(
  ready: boolean,
  watching: boolean,
  timedOut: boolean,
): PathState {
  if (ready) return 'ready'
  if (watching && !timedOut) return 'waiting'
  if (watching && timedOut) return 'timed-out'
  return 'idle'
}

function apiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (!base) throw new Error('VITE_API_BASE_URL is not set')
  return base.replace(/\/$/, '')
}

function DemoSmsPreview({ sms }: { sms: DemoSms }) {
  return (
    <Paper withBorder radius="sm" p="sm" bg="gray.0">
      <Group gap="xs" mb={6}>
        <ThemeIcon size="sm" variant="light" color="grape">
          <MessageSquare size={12} />
        </ThemeIcon>
        <Text size="sm" fw={600}>
          Demo SMS
        </Text>
        <Badge size="xs" variant="outline" color="gray">
          {sms.provider}
        </Badge>
      </Group>
      <Text size="xs" c="dimmed" mb={4}>
        To <Code>{sms.to}</Code>
        {sms.sentAt ? ` · ${new Date(sms.sentAt).toLocaleString()}` : ''}
      </Text>
      <Text size="sm">{sms.body}</Text>
      <Text size="xs" c="dimmed" mt={6}>
        Logged by BullMQ only — no SMS gateway charged.
      </Text>
    </Paper>
  )
}

/**
 * Spike UI: Bot vs BullMQ discharge Communications.
 * In watch mode the backend SSE stream owns timeout + polling; the panel
 * starts pending and flips as each path lands. BullMQ also surfaces a demo SMS.
 */
export function DischargeNotificationsPanel({
  encounterId,
  watch = false,
}: Props) {
  const [stream, setStream] = useState<WatchSnapshot>({
    bot: false,
    bullmq: false,
    items: [],
    sms: undefined,
    status: watch ? 'watching' : 'idle',
  })

  const { data, error, isFetching, isError } =
    useGetDischargeNotificationsQuery(encounterId, {
      skip: watch,
      refetchOnMountOrArgChange: true,
    })

  useEffect(() => {
    if (!watch) return

    setStream({
      bot: false,
      bullmq: false,
      items: [],
      sms: undefined,
      status: 'watching',
    })

    const url = `${apiBaseUrl()}/events/notifications/${encodeURIComponent(encounterId)}/stream?timeoutMs=15000`
    const source = new EventSource(url, { withCredentials: true })

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string) as WatchSnapshot
        setStream({
          bot: Boolean(payload.bot),
          bullmq: Boolean(payload.bullmq),
          items: payload.items ?? [],
          sms: payload.sms,
          status: payload.status ?? 'watching',
        })
        if (
          payload.status === 'complete' ||
          payload.status === 'timeout'
        ) {
          source.close()
        }
      } catch {
        setStream((prev) => ({ ...prev, status: 'error' }))
        source.close()
      }
    }

    source.onerror = () => {
      // EventSource fires error when the server closes after complete/timeout;
      // only treat it as failure while still watching.
      setStream((prev) => {
        if (
          prev.status === 'complete' ||
          prev.status === 'timeout' ||
          prev.status === 'error'
        ) {
          return prev
        }
        return { ...prev, status: 'error' }
      })
      source.close()
    }

    return () => source.close()
  }, [watch, encounterId])

  const disabled =
    !watch &&
    isError &&
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: number }).status === 503

  if (disabled) {
    return (
      <Paper withBorder radius="md" p="md" mb="md">
        <Text size="sm" c="dimmed">
          Event-driven spike is off on the API (
          <code>EVENTS_ENABLED=false</code>). Enable it to compare Bot vs
          BullMQ discharge notifications.
        </Text>
      </Paper>
    )
  }

  const botReady = watch ? stream.bot : Boolean(data?.bot)
  const bullmqReady = watch ? stream.bullmq : Boolean(data?.bullmq)
  const items = watch ? stream.items : (data?.items ?? [])
  const sms = watch ? stream.sms : data?.sms
  const watching = watch && stream.status === 'watching'
  const timedOut = watch && stream.status === 'timeout'
  const pathsReady = botReady && bullmqReady

  return (
    <Paper withBorder radius="md" p="md" mb="md">
      <Group justify="space-between" align="flex-start" mb="sm">
        <Group gap="xs">
          <ThemeIcon variant="light" color="blue" size="sm">
            <Bell size={14} />
          </ThemeIcon>
          <div>
            <Text fw={600} size="sm">
              Discharge notifications
            </Text>
            <Text size="xs" c="dimmed">
              {watch
                ? 'Live watch (API streams updates — demo pace)'
                : 'Latest Bot / BullMQ Communications for this encounter'}
            </Text>
          </div>
        </Group>
        <Group gap="xs">
          <PathStatus
            label="Bot"
            state={pathState(botReady, watch, timedOut)}
          />
          <PathStatus
            label="BullMQ → SMS"
            state={pathState(bullmqReady, watch, timedOut)}
          />
        </Group>
      </Group>

      {stream.status === 'error' || (isError && !watch) ? (
        <Text size="sm" c="red">
          Could not load notification status.
        </Text>
      ) : (
        <Stack gap={6}>
          {pathsReady && (
            <Text size="sm" c="teal">
              Both event paths wrote a Communication.
            </Text>
          )}
          {timedOut && !pathsReady && (
            <Text size="sm" c="red">
              Timed out after 15s
              {!botReady && !bullmqReady
                ? ' — neither path fired'
                : !botReady
                  ? ' — Bot missing'
                  : ' — BullMQ missing'}
              .
            </Text>
          )}
          {watching && (
            <Text size="xs" c="dimmed">
              Waiting for Subscriptions to fire…
            </Text>
          )}
          {!watch && !botReady && !bullmqReady && !isFetching && (
            <Text size="sm" c="dimmed">
              No discharge Communications for this encounter.
            </Text>
          )}
          {sms && <DemoSmsPreview sms={sms} />}
          {items
            .filter((i) => i.sent)
            .map((item) => (
              <Text key={`${item.path}-${item.id}`} size="xs" c="dimmed">
                {item.path} sent {new Date(item.sent!).toLocaleString()}
                {item.id ? ` · Communication/${item.id}` : ''}
              </Text>
            ))}
        </Stack>
      )}
    </Paper>
  )
}
