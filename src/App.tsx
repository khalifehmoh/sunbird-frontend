import { AppShell, Box, Container, Group, Title, Text } from '@mantine/core'
import { ThemeToggle } from './components/ThemeToggle'

function App() {
  return (
    <AppShell header={{ height: 56 }}>
      <AppShell.Header>
        <Group h="100%" justify="space-between" px="md">
          <Title order={4}>Sunbird</Title>
          <ThemeToggle />
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="md" py="xl">
          <Box>
            <Title order={1} mb="xs">Sunbird</Title>
            <Text c="dimmed">React + Vite + Mantine</Text>
          </Box>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

export default App
