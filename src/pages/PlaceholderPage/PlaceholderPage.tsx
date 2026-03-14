import { Container, Text, Title } from '@mantine/core'

interface PlaceholderPageProps {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <Container size="md" py="xl">
      <Title order={1} mb="xs">
        {title}
      </Title>
      <Text c="dimmed">
        Content for this section will appear here.
      </Text>
    </Container>
  )
}
