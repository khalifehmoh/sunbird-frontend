import * as React from 'react'
import { Link } from 'react-router-dom'
import { Center, Box, Paper, Title, Text, TextInput, Button, Stack, Anchor } from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { z } from 'zod'

const forgotSchema = z.object({
  email: z.string().email('Invalid email'),
})

type ForgotFormValues = z.infer<typeof forgotSchema>

export function ForgotPasswordPage() {
  const form = useForm<ForgotFormValues>({
    mode: 'uncontrolled',
    initialValues: { email: '' },
    validate: zodResolver(forgotSchema),
  })

  const handleSubmit = (values: ForgotFormValues) => {
    console.log('Forgot password', values)
    // TODO: call auth API
  }

  return (
    <Center mih="calc(100vh - 56px)" p="md">
      <Box maw={400} w="100%">
        <Paper p="xl" radius="md" withBorder>
          <Title order={2} mb="xs">
            Forgot password
          </Title>
          <Text c="dimmed" size="sm" mb="lg">
            Enter your email and we&apos;ll send you a link to reset your password.
          </Text>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Email"
                placeholder="you@example.com"
                type="email"
                key={form.key('email')}
                {...form.getInputProps('email')}
              />
              <Button type="submit" fullWidth>
                Send reset link
              </Button>
              <Text size="sm" c="dimmed" ta="center">
                <Anchor component={Link} to="/auth/login">
                  Back to log in
                </Anchor>
              </Text>
            </Stack>
          </form>
        </Paper>
      </Box>
    </Center>
  )
}
