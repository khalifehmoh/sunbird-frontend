import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Code,
  Group,
  Loader,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Tabs,
  Text,
  Textarea,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { notify } from '../../../../lib/notify'
import dayjs from 'dayjs'
import {
  Activity,
  ArrowLeft,
  Building2,
  Check,
  FileKey,
  GitBranch,
  Pencil,
  Plus,
  Save,
  Users,
  X,
} from 'lucide-react'
import { useGetBranchesQuery } from '../../../../redux/features/branches/branchesApi'
import {
  useGetTenantAuditQuery,
  useGetTenantConfigQuery,
  useGetTenantQuery,
  usePatchTenantStatusMutation,
  useUpdateTenantConfigMutation,
} from '../../../../redux/features/tenants/tenantsApi'
import type {
  TenantConfigItem,
  TenantStatus,
} from '../../../../redux/features/tenants/tenantsTypes'
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge'
import { usePermissions } from '../../../../hooks/usePermissions'
import {
  TENANT_STATUS_COLORS,
  TENANT_STATUS_OPTIONS,
} from '../tenantConstants'
import { BRANCH_STATUS_COLORS } from '../../BranchManagement/branchConstants'
import { BranchForm } from '../../BranchManagement/BranchForm/BranchForm'
import { TenantForm } from '../TenantForm/TenantForm'

type DetailTab = 'overview' | 'branches' | 'config' | 'audit'

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

function DetailField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <Stack gap={3}>
      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
        {label}
      </Text>
      <Text size="sm">{children || '—'}</Text>
    </Stack>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <Paper withBorder radius="md" p="md">
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon variant="light" size="lg" radius="md">
          {icon}
        </ThemeIcon>
        <Stack gap={0}>
          <Text size="xs" c="dimmed">
            {label}
          </Text>
          <Text fw={700}>{value}</Text>
        </Stack>
      </Group>
    </Paper>
  )
}

function TabError({ message }: { message: string }) {
  return (
    <Alert color="red" title="Could not load this section">
      {message}
    </Alert>
  )
}

export function TenantDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const [editingConfigKey, setEditingConfigKey] = useState<string | null>(null)
  const [configDraft, setConfigDraft] = useState('')
  const [branchFormOpened, setBranchFormOpened] = useState(false)
  const [tenantFormOpened, setTenantFormOpened] = useState(
    searchParams.get('edit') === 'true',
  )

  const canRead = usePermissions('TENANT:READ')
  const canUpdate = usePermissions('TENANT:UPDATE')
  const canCreateBranch = usePermissions('BRANCH:CREATE')
  const canReadConfig = usePermissions('CONFIG:READ')
  const canUpdateConfig = usePermissions('CONFIG:UPDATE')
  const canReadAudit = usePermissions('AUDIT:READ')

  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setTenantFormOpened(true)
    }
  }, [searchParams])

  function closeTenantForm() {
    setTenantFormOpened(false)
    if (searchParams.get('edit') === 'true') {
      const next = new URLSearchParams(searchParams)
      next.delete('edit')
      setSearchParams(next, { replace: true })
    }
  }

  const {
    data: tenant,
    isLoading: tenantLoading,
    isError: tenantError,
    refetch: refetchTenant,
  } = useGetTenantQuery(id, { skip: !id || !canRead })

  const {
    data: branches,
    isLoading: branchesLoading,
    isError: branchesError,
  } = useGetBranchesQuery(
    {
      page: 0,
      size: 100,
      search: '',
      tenantId: id,
      status: '',
      type: '',
      hqOnly: false,
      sort: 'branchCode:asc',
    },
    { skip: !id || !canRead },
  )

  const {
    data: config,
    isLoading: configLoading,
    isError: configError,
  } = useGetTenantConfigQuery(id, {
    skip: !id || !canReadConfig || activeTab !== 'config',
  })

  const {
    data: audit,
    isLoading: auditLoading,
    isError: auditError,
  } = useGetTenantAuditQuery(id, {
    skip: !id || !canReadAudit || activeTab !== 'audit',
  })

  const [patchStatus, { isLoading: statusUpdating }] =
    usePatchTenantStatusMutation()
  const [updateConfig, { isLoading: configUpdating }] =
    useUpdateTenantConfigMutation()

  if (!canRead) {
    return (
      <Box p="xl">
        <Text>You don&apos;t have permission to view tenants.</Text>
      </Box>
    )
  }

  if (!id) {
    return (
      <Box p="xl">
        <Alert color="red" title="Invalid tenant">
          The tenant identifier is missing.
        </Alert>
      </Box>
    )
  }

  if (tenantLoading) {
    return (
      <Box p="xl">
        <Stack gap="lg">
          <Skeleton height={170} radius="md" />
          <Skeleton height={360} radius="md" />
        </Stack>
      </Box>
    )
  }

  if (tenantError || !tenant) {
    return (
      <Box p="xl">
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<ArrowLeft size={16} />}
            onClick={() => navigate('/admin/tenants')}
            w="fit-content"
          >
            Back to tenants
          </Button>
          <Alert color="red" title="Tenant not found">
            The tenant could not be loaded. It may have been deleted or you may
            not have access.
          </Alert>
        </Stack>
      </Box>
    )
  }

  const branchRows = branches?.content ?? []

  function confirmStatusChange(nextStatus: TenantStatus | null) {
    if (!nextStatus || nextStatus === tenant?.status) return
    modals.openConfirmModal({
      title: 'Change tenant status',
      children: (
        <Text size="sm">
          Change <strong>{tenant?.tenantName}</strong> from{' '}
          <strong>{tenant?.status}</strong> to <strong>{nextStatus}</strong>?
        </Text>
      ),
      labels: { confirm: 'Change status', cancel: 'Cancel' },
      confirmProps: { color: nextStatus === 'ACTIVE' ? 'teal' : 'orange' },
      onConfirm: async () => {
        try {
          await patchStatus({ tenantId: id, status: nextStatus }).unwrap()
          notify({
            type: 'success',
            title: 'Status updated',
            message: `${tenant?.tenantName} is now ${nextStatus}.`,
          })
          refetchTenant()
        } catch {
          // The shared base query displays the API error.
        }
      },
    })
  }

  function beginConfigEdit(item: TenantConfigItem) {
    setEditingConfigKey(item.configKey)
    setConfigDraft(displayValue(item.configValue))
  }

  async function saveConfig(item: TenantConfigItem) {
    let parsedValue: unknown = configDraft
    try {
      parsedValue = JSON.parse(configDraft)
    } catch {
      // Plain strings are valid JSONB values and are sent as strings.
    }

    try {
      await updateConfig({
        tenantId: id,
        key: item.configKey,
        value: parsedValue,
      }).unwrap()
      setEditingConfigKey(null)
      notify({
        type: 'success',
        title: 'Configuration updated',
        message: `${item.configKey} was saved.`,
      })
    } catch {
      // The shared base query displays the API error.
    }
  }

  return (
    <Box p="xl">
      <Stack gap="lg">
        <Button
          variant="subtle"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => navigate('/admin/tenants')}
          w="fit-content"
          px={0}
        >
          Back to tenants
        </Button>

        <Paper withBorder radius="md" p="lg">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Group align="flex-start" gap="md">
              <ThemeIcon size={52} radius="md" variant="light">
                <Building2 size={28} />
              </ThemeIcon>
              <Stack gap={5}>
                <Group gap="sm">
                  <Title order={2}>{tenant.tenantName}</Title>
                  <StatusBadge
                    value={tenant.status}
                    colorMap={TENANT_STATUS_COLORS}
                  />
                </Group>
                {tenant.tenantNameAr ? (
                  <Text c="dimmed" dir="rtl" w="fit-content">
                    {tenant.tenantNameAr}
                  </Text>
                ) : null}
                <Group gap="xs">
                  <Badge variant="light">{tenant.tenantCode}</Badge>
                  <Badge variant="outline" color="gray">
                    {tenant.organizationType}
                  </Badge>
                </Group>
              </Stack>
            </Group>

            <Group align="flex-end">
              {canUpdate ? (
                <>
                  <Select
                    label="Status"
                    data={TENANT_STATUS_OPTIONS}
                    value={tenant.status}
                    onChange={(value) =>
                      confirmStatusChange(value as TenantStatus | null)
                    }
                    disabled={statusUpdating}
                    allowDeselect={false}
                    w={160}
                  />
                  <Button
                    variant="light"
                    leftSection={<Pencil size={17} />}
                    onClick={() => setTenantFormOpened(true)}
                  >
                    Edit
                  </Button>
                </>
              ) : null}
            </Group>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mt="lg">
            <Stat
              icon={<GitBranch size={19} />}
              label="Branches"
              value={branchesLoading ? <Loader size="xs" /> : branchRows.length}
            />
            <Stat
              icon={<Users size={19} />}
              label="User limit"
              value={tenant.maxUsers}
            />
            <Stat
              icon={<FileKey size={19} />}
              label="License"
              value={tenant.licenseNumber ?? 'Not set'}
            />
            <Stat
              icon={<Activity size={19} />}
              label="Last updated"
              value={
                tenant.updatedAt
                  ? dayjs(tenant.updatedAt).format('MMM D, YYYY')
                  : '—'
              }
            />
          </SimpleGrid>
        </Paper>

        <Paper withBorder radius="md">
          <Tabs
            value={activeTab}
            onChange={(value) => setActiveTab((value ?? 'overview') as DetailTab)}
          >
            <Tabs.List px="md" pt="sm">
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
              <Tabs.Tab value="branches">
                Branches {branches ? `(${branches.totalElements})` : ''}
              </Tabs.Tab>
              <Tabs.Tab value="config" disabled={!canReadConfig}>
                Config
              </Tabs.Tab>
              <Tabs.Tab value="audit" disabled={!canReadAudit}>
                Audit Trail
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="overview" p="lg">
              <Stack gap="lg">
                <Title order={4}>Organization profile</Title>
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                  <DetailField label="Tenant code">
                    <Code>{tenant.tenantCode}</Code>
                  </DetailField>
                  <DetailField label="Organization type">
                    {tenant.organizationType}
                  </DetailField>
                  <DetailField label="Status">
                    <StatusBadge
                      value={tenant.status}
                      colorMap={TENANT_STATUS_COLORS}
                    />
                  </DetailField>
                  <DetailField label="English name">
                    {tenant.tenantName}
                  </DetailField>
                  <DetailField label="Arabic name">
                    <span dir="rtl">{tenant.tenantNameAr ?? '—'}</span>
                  </DetailField>
                  <DetailField label="License number">
                    {tenant.licenseNumber ?? '—'}
                  </DetailField>
                  <DetailField label="Maximum users">
                    {tenant.maxUsers}
                  </DetailField>
                  <DetailField label="Created">
                    {tenant.createdAt
                      ? dayjs(tenant.createdAt).format('MMM D, YYYY h:mm A')
                      : '—'}
                  </DetailField>
                  <DetailField label="Last updated">
                    {tenant.updatedAt
                      ? dayjs(tenant.updatedAt).format('MMM D, YYYY h:mm A')
                      : '—'}
                  </DetailField>
                </SimpleGrid>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="branches" p="lg">
              <Stack gap="md">
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Title order={4}>Branches</Title>
                    <Text size="sm" c="dimmed">
                      Branches assigned to this tenant.
                    </Text>
                  </Stack>
                  {canCreateBranch ? (
                    <Button
                      leftSection={<Plus size={17} />}
                      onClick={() => {
                        setBranchFormOpened(true)
                      }}
                    >
                      Add branch
                    </Button>
                  ) : null}
                </Group>

                {branchesError ? (
                  <TabError message="Branches are currently unavailable." />
                ) : branchesLoading ? (
                  <Stack>
                    <Skeleton height={42} />
                    <Skeleton height={42} />
                    <Skeleton height={42} />
                  </Stack>
                ) : (
                  <Box style={{ overflowX: 'auto' }}>
                    <Table highlightOnHover verticalSpacing="sm" miw={720}>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Code</Table.Th>
                          <Table.Th>Name</Table.Th>
                          <Table.Th>Type</Table.Th>
                          <Table.Th>Location</Table.Th>
                          <Table.Th>Status</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {branchRows.length === 0 ? (
                          <Table.Tr>
                            <Table.Td colSpan={5}>
                              <Text ta="center" c="dimmed" py="lg">
                                No branches have been added.
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ) : (
                          branchRows.map((branch) => (
                            <Table.Tr key={branch.branchId}>
                              <Table.Td>
                                <Text size="sm" fw={600}>
                                  {branch.branchCode}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Stack gap={1}>
                                  <Text size="sm">{branch.branchName}</Text>
                                  {branch.isHeadquarters ? (
                                    <Badge size="xs" variant="light">
                                      Headquarters
                                    </Badge>
                                  ) : null}
                                </Stack>
                              </Table.Td>
                              <Table.Td>{branch.branchType}</Table.Td>
                              <Table.Td>
                                {[branch.city, branch.region]
                                  .filter(Boolean)
                                  .join(', ') || '—'}
                              </Table.Td>
                              <Table.Td>
                                <StatusBadge
                                  value={branch.status}
                                  colorMap={BRANCH_STATUS_COLORS}
                                />
                              </Table.Td>
                            </Table.Tr>
                          ))
                        )}
                      </Table.Tbody>
                    </Table>
                  </Box>
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="config" p="lg">
              <Stack gap="md">
                <Stack gap={2}>
                  <Title order={4}>Configuration</Title>
                  <Text size="sm" c="dimmed">
                    Tenant-specific key-value settings.
                  </Text>
                </Stack>

                {configError ? (
                  <TabError message="The tenant configuration endpoint is not available." />
                ) : configLoading ? (
                  <Stack>
                    <Skeleton height={48} />
                    <Skeleton height={48} />
                  </Stack>
                ) : (
                  <Box style={{ overflowX: 'auto' }}>
                    <Table verticalSpacing="sm" miw={760}>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Key</Table.Th>
                          <Table.Th>Value</Table.Th>
                          <Table.Th>Updated</Table.Th>
                          <Table.Th w={90}>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {(config ?? []).length === 0 ? (
                          <Table.Tr>
                            <Table.Td colSpan={4}>
                              <Text ta="center" c="dimmed" py="lg">
                                No tenant configuration found.
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ) : (
                          config?.map((item) => (
                            <Table.Tr key={item.configKey}>
                              <Table.Td>
                                <Code>{item.configKey}</Code>
                              </Table.Td>
                              <Table.Td>
                                {editingConfigKey === item.configKey ? (
                                  <Textarea
                                    value={configDraft}
                                    onChange={(event) =>
                                      setConfigDraft(event.currentTarget.value)
                                    }
                                    autosize
                                    minRows={2}
                                    maxRows={8}
                                    aria-label={`Value for ${item.configKey}`}
                                  />
                                ) : item.isEncrypted ? (
                                  <Code>••••••••</Code>
                                ) : (
                                  <Code block>
                                    {displayValue(item.configValue)}
                                  </Code>
                                )}
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">
                                  {item.updatedAt
                                    ? dayjs(item.updatedAt).format('MMM D, YYYY')
                                    : '—'}
                                </Text>
                                {item.updatedBy ? (
                                  <Text size="xs" c="dimmed">
                                    by {item.updatedBy}
                                  </Text>
                                ) : null}
                              </Table.Td>
                              <Table.Td>
                                {editingConfigKey === item.configKey ? (
                                  <Group gap={4} wrap="nowrap">
                                    <Tooltip label="Save">
                                      <ActionIcon
                                        color="teal"
                                        onClick={() => saveConfig(item)}
                                        loading={configUpdating}
                                        aria-label="Save configuration"
                                      >
                                        <Save size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Cancel">
                                      <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        onClick={() => setEditingConfigKey(null)}
                                        aria-label="Cancel configuration edit"
                                      >
                                        <X size={16} />
                                      </ActionIcon>
                                    </Tooltip>
                                  </Group>
                                ) : canUpdateConfig ? (
                                  <Tooltip label="Edit value">
                                    <ActionIcon
                                      variant="subtle"
                                      onClick={() => beginConfigEdit(item)}
                                      aria-label={`Edit ${item.configKey}`}
                                    >
                                      <Pencil size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                ) : null}
                              </Table.Td>
                            </Table.Tr>
                          ))
                        )}
                      </Table.Tbody>
                    </Table>
                  </Box>
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="audit" p="lg">
              <Stack gap="md">
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Title order={4}>Audit trail</Title>
                    <Text size="sm" c="dimmed">
                      The latest 50 events for this tenant.
                    </Text>
                  </Stack>
                  <Button
                    component={Link}
                    to={`/admin/audit?tenantId=${id}`}
                    variant="subtle"
                  >
                    View full audit
                  </Button>
                </Group>

                {auditError ? (
                  <TabError message="The audit endpoint is not available." />
                ) : auditLoading ? (
                  <Stack>
                    <Skeleton height={44} />
                    <Skeleton height={44} />
                    <Skeleton height={44} />
                  </Stack>
                ) : (
                  <Box style={{ overflowX: 'auto' }}>
                    <Table highlightOnHover verticalSpacing="sm" miw={800}>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Time</Table.Th>
                          <Table.Th>User</Table.Th>
                          <Table.Th>Action</Table.Th>
                          <Table.Th>Entity</Table.Th>
                          <Table.Th>Result</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {(audit?.content ?? []).length === 0 ? (
                          <Table.Tr>
                            <Table.Td colSpan={5}>
                              <Text ta="center" c="dimmed" py="lg">
                                No audit events found.
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ) : (
                          audit?.content.map((event) => (
                            <Table.Tr key={event.id}>
                              <Table.Td>
                                <Text size="sm">
                                  {dayjs(event.createdAt).format(
                                    'MMM D, YYYY h:mm A',
                                  )}
                                </Text>
                              </Table.Td>
                              <Table.Td>{event.username ?? 'System'}</Table.Td>
                              <Table.Td>
                                <Badge variant="light">{event.actionType}</Badge>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{event.entityName}</Text>
                                <Text size="xs" c="dimmed">
                                  {event.entityType}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <ThemeIcon
                                  size="sm"
                                  color={event.success ? 'teal' : 'red'}
                                  variant="light"
                                  aria-label={
                                    event.success ? 'Succeeded' : 'Failed'
                                  }
                                >
                                  {event.success ? (
                                    <Check size={13} />
                                  ) : (
                                    <X size={13} />
                                  )}
                                </ThemeIcon>
                              </Table.Td>
                            </Table.Tr>
                          ))
                        )}
                      </Table.Tbody>
                    </Table>
                  </Box>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>

      <BranchForm
        opened={branchFormOpened}
        onClose={() => {
          setBranchFormOpened(false)
        }}
        defaultTenantId={id || undefined}
      />

      <TenantForm
        opened={tenantFormOpened}
        onClose={closeTenantForm}
        tenantId={id || undefined}
      />
    </Box>
  )
}
