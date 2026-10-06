import { useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../../../components/StatusBadge/StatusBadge'
import { notify } from '../../../lib/notify'
import {
  useCreateTemplateMutation,
  useGetNotificationEventsQuery,
  useGetNotificationLogQuery,
  useGetTemplatesQuery,
  usePreviewTemplateMutation,
  useUpdateTemplateMutation,
  type NotificationChannel,
  type NotificationLanguage,
  type NotificationStatus,
  type TemplatePreview,
  type TemplateRow,
} from '../../../redux/features/emr/emrApi'
import { PageHeader } from '../shared/PageHeader'
import { QueryState } from '../shared/QueryState'
import { NOTIFICATION_STATUS_COLOR, errorMessage, formatDateTime } from '../shared/format'
import { useHasPermissions } from '../../../hooks/usePermissions'
import { EmrAccess } from '../../../constants/permissions'

const CHANNELS: NotificationChannel[] = ['SMS', 'WHATSAPP', 'EMAIL']

/** Page 28: what was sent, to whom, and whether it arrived. */
export function NotificationLogPage() {
  const canAdmin = useHasPermissions(EmrAccess.notificationAdmin)
  const [status, setStatus] = useState<NotificationStatus | null>(null)
  const [channel, setChannel] = useState<NotificationChannel | null>(null)
  const [eventCode, setEventCode] = useState<string | null>(null)
  const { data: events } = useGetNotificationEventsQuery(undefined, { skip: !canAdmin })
  const { data, isLoading, error } = useGetNotificationLogQuery({
    status: status ?? undefined,
    channel: channel ?? undefined,
    eventCode: eventCode ?? undefined,
    limit: 100,
  })
  const rows = data?.items ?? []

  return (
    <Box p="md">
      <PageHeader
        title="Notification log"
        actions={
          canAdmin && (
            <Button component={Link} to="/emr/notifications/templates" variant="light">
              Manage templates
            </Button>
          )
        }
      />
      <Paper withBorder radius="md" p="md" mb="md">
        <Group>
          <Select
            placeholder="Status"
            clearable
            data={['PENDING', 'SENT', 'FAILED']}
            value={status}
            onChange={(value) => setStatus(value as NotificationStatus | null)}
          />
          <Select
            placeholder="Channel"
            clearable
            data={CHANNELS}
            value={channel}
            onChange={(value) => setChannel(value as NotificationChannel | null)}
          />
          {canAdmin && (
            <Select
              placeholder="Event"
              clearable
              data={(events?.items ?? []).map((e) => ({ value: e.code, label: e.label }))}
              value={eventCode}
              onChange={setEventCode}
            />
          )}
        </Group>
      </Paper>
      <QueryState isLoading={isLoading} error={error} empty={rows.length === 0} emptyMessage="No notifications.">
        <Paper withBorder radius="md" p="md">
          <Table.ScrollContainer minWidth={760}>
            <Table highlightOnHover verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Event</Table.Th>
                  <Table.Th>Channel</Table.Th>
                  <Table.Th>Recipient</Table.Th>
                  <Table.Th>Message</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{formatDateTime(row.createdAt)}</Table.Td>
                    <Table.Td>{row.eventCode}</Table.Td>
                    <Table.Td>
                      {row.channel} · {row.language}
                    </Table.Td>
                    <Table.Td>{row.recipient ?? '—'}</Table.Td>
                    <Table.Td maw={320}>
                      <Text size="sm" lineClamp={2} dir={row.language === 'ar' ? 'rtl' : undefined}>
                        {row.body}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <StatusBadge value={row.status} colorMap={NOTIFICATION_STATUS_COLOR} variant="light" />
                      {row.error && (
                        <Text size="xs" c="red">
                          {row.error}
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </QueryState>
    </Box>
  )
}

type Draft = {
  id?: string
  eventCode: string | null
  language: NotificationLanguage
  channel: NotificationChannel
  subject: string
  body: string
}

const EMPTY_DRAFT: Draft = {
  eventCode: null,
  language: 'en',
  channel: 'SMS',
  subject: '',
  body: '',
}

function sampleValues(placeholders: string[]): Record<string, string> {
  return Object.fromEntries(placeholders.map((name) => [name, `<${name}>`]))
}

function TemplateEditor({
  draft,
  onChange,
  onClose,
}: {
  draft: Draft
  onChange: (draft: Draft) => void
  onClose: () => void
}) {
  const { data: events } = useGetNotificationEventsQuery()
  const [create, { isLoading: creating }] = useCreateTemplateMutation()
  const [update, { isLoading: updating }] = useUpdateTemplateMutation()
  const [preview, { isLoading: previewing }] = usePreviewTemplateMutation()
  const [result, setResult] = useState<TemplatePreview | null>(null)
  const editing = !!draft.id
  const placeholders = events?.items.find((e) => e.code === draft.eventCode)?.placeholders ?? []

  useEffect(() => {
    setResult(null)
  }, [draft.body, draft.eventCode])

  async function runPreview() {
    if (!draft.eventCode || !draft.body.trim()) return
    try {
      setResult(
        await preview({
          eventCode: draft.eventCode,
          body: draft.body,
          values: sampleValues(placeholders),
        }).unwrap(),
      )
    } catch (err) {
      notify({ type: 'error', title: 'Preview failed', message: errorMessage(err) })
    }
  }

  async function save() {
    if (!draft.eventCode || !draft.body.trim()) return
    try {
      if (draft.id) {
        await update({
          id: draft.id,
          subject: draft.subject || undefined,
          body: draft.body,
        }).unwrap()
      } else {
        await create({
          eventCode: draft.eventCode,
          language: draft.language,
          channel: draft.channel,
          subject: draft.subject || undefined,
          body: draft.body,
        }).unwrap()
      }
      notify({ type: 'success', title: 'Template saved', message: 'Changes apply to new notifications.' })
      onClose()
    } catch (err) {
      notify({ type: 'error', title: 'Could not save template', message: errorMessage(err) })
    }
  }

  return (
    <Stack>
      <Select
        label="Event"
        required
        disabled={editing}
        data={(events?.items ?? []).map((e) => ({ value: e.code, label: e.label }))}
        value={draft.eventCode}
        onChange={(value) => onChange({ ...draft, eventCode: value })}
      />
      <Group grow>
        <Select
          label="Language"
          disabled={editing}
          allowDeselect={false}
          data={[
            { value: 'en', label: 'English' },
            { value: 'ar', label: 'Arabic' },
          ]}
          value={draft.language}
          onChange={(value) => onChange({ ...draft, language: (value as NotificationLanguage) ?? 'en' })}
        />
        <Select
          label="Channel"
          disabled={editing}
          allowDeselect={false}
          data={CHANNELS}
          value={draft.channel}
          onChange={(value) => onChange({ ...draft, channel: (value as NotificationChannel) ?? 'SMS' })}
        />
      </Group>
      {draft.channel === 'EMAIL' && (
        <TextInput
          label="Subject"
          value={draft.subject}
          onChange={(event) => onChange({ ...draft, subject: event.currentTarget.value })}
        />
      )}
      <Textarea
        label="Message"
        required
        minRows={4}
        autosize
        maxLength={1000}
        dir={draft.language === 'ar' ? 'rtl' : undefined}
        value={draft.body}
        onChange={(event) => onChange({ ...draft, body: event.currentTarget.value })}
      />
      {placeholders.length > 0 && (
        <Group gap={6}>
          <Text size="xs" c="dimmed">
            Placeholders:
          </Text>
          {placeholders.map((name) => (
            <Badge
              key={name}
              variant="light"
              style={{ cursor: 'pointer', textTransform: 'none' }}
              onClick={() => onChange({ ...draft, body: `${draft.body}{{${name}}}` })}
            >
              {`{{${name}}}`}
            </Badge>
          ))}
        </Group>
      )}
      {result && (
        <Paper withBorder p="sm" radius="sm">
          <Text size="xs" c="dimmed" mb={4}>
            Preview
          </Text>
          <Text size="sm" dir={draft.language === 'ar' ? 'rtl' : undefined}>
            {result.text}
          </Text>
          {result.unknown.length > 0 && (
            <Alert color="orange" mt="xs" p="xs">
              Unknown placeholders for this event: {result.unknown.join(', ')}
            </Alert>
          )}
          {result.missing.length > 0 && (
            <Alert color="yellow" mt="xs" p="xs">
              No value for: {result.missing.join(', ')}
            </Alert>
          )}
        </Paper>
      )}
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="light" loading={previewing} onClick={() => void runPreview()}>
          Preview
        </Button>
        <Button loading={creating || updating} disabled={!draft.eventCode || !draft.body.trim()} onClick={() => void save()}>
          Save
        </Button>
      </Group>
    </Stack>
  )
}

/** Page 29: bilingual message templates, per event and channel. */
export function NotificationTemplatesPage() {
  const { data, isLoading, error } = useGetTemplatesQuery()
  const [update] = useUpdateTemplateMutation()
  const [draft, setDraft] = useState<Draft | null>(null)
  const rows = data?.items ?? []

  async function toggle(row: TemplateRow, isActive: boolean) {
    try {
      await update({ id: row.id, isActive }).unwrap()
    } catch (err) {
      notify({ type: 'error', title: 'Could not update template', message: errorMessage(err) })
    }
  }

  return (
    <Box p="md">
      <PageHeader
        title="Notification templates"
        crumbs={[{ label: 'Notifications', to: '/emr/notifications' }, { label: 'Templates' }]}
        actions={<Button onClick={() => setDraft({ ...EMPTY_DRAFT })}>New template</Button>}
      />
      <QueryState isLoading={isLoading} error={error} empty={rows.length === 0} emptyMessage="No templates yet.">
        <Paper withBorder radius="md" p="md">
          <Table.ScrollContainer minWidth={760}>
            <Table highlightOnHover verticalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Event</Table.Th>
                  <Table.Th>Language</Table.Th>
                  <Table.Th>Channel</Table.Th>
                  <Table.Th>Message</Table.Th>
                  <Table.Th>Active</Table.Th>
                  <Table.Th>Updated</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{row.eventLabel}</Table.Td>
                    <Table.Td>{row.language === 'ar' ? 'Arabic' : 'English'}</Table.Td>
                    <Table.Td>{row.channel}</Table.Td>
                    <Table.Td maw={320}>
                      <Text size="sm" lineClamp={2} dir={row.language === 'ar' ? 'rtl' : undefined}>
                        {row.body}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Switch checked={row.isActive} onChange={(event) => void toggle(row, event.currentTarget.checked)} />
                    </Table.Td>
                    <Table.Td>{formatDateTime(row.updatedAt)}</Table.Td>
                    <Table.Td>
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        onClick={() =>
                          setDraft({
                            id: row.id,
                            eventCode: row.eventCode,
                            language: row.language as NotificationLanguage,
                            channel: row.channel as NotificationChannel,
                            subject: row.subject ?? '',
                            body: row.body,
                          })
                        }
                      >
                        Edit
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </QueryState>
      <Modal
        opened={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Edit template' : 'New template'}
        size="lg"
      >
        {draft && <TemplateEditor draft={draft} onChange={setDraft} onClose={() => setDraft(null)} />}
      </Modal>
    </Box>
  )
}
