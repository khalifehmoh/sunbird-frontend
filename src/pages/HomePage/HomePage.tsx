import { Container, Title, Text, Group, Button } from '@mantine/core'
import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <Container size="md" py="xl">
      <Title order={1} mb="xs">
        Sunbird
      </Title>
      <Text c="dimmed" mb="lg">
        React + Vite + Mantine
      </Text>
      <Group>
        <Button component={Link} to="/auth/login" variant="filled">
          Log in
        </Button>
        <Button component={Link} to="/auth/register" variant="light">
          Sign up
        </Button>
      </Group>
    </Container>
  )
}
