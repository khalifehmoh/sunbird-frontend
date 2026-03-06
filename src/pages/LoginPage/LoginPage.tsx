import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  Anchor,
  Button,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
  Stack,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { z } from 'zod'
import classes from './LoginPage.module.css'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const form = useForm<LoginFormValues>({
    mode: 'uncontrolled',
    initialValues: { email: '', password: '' },
    validate: zodResolver(loginSchema),
  })

  const handleSubmit = (values: LoginFormValues) => {
    console.log('Login', values)
    // TODO: call auth API
  }

  return (
    <div className={classes.wrapper}>
      <Paper className={classes.form} shadow="sm">
        <Title order={2} className={classes.title}>
          Welcome back to Sunbird!
        </Title>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Email"
              placeholder="you@example.com"
              type="email"
              size="md"
              key={form.key('email')}
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              size="md"
              key={form.key('password')}
              {...form.getInputProps('password')}
            />
            <Anchor size="sm" component={Link} to="/auth/forgot-password">
              Forgot password?
            </Anchor>
            <Button type="submit" fullWidth size="md">
              Login
            </Button>
            <Text size="sm" c="dimmed" ta="center">
              Don&apos;t have an account?{' '}
              <Anchor component={Link} to="/auth/register">
                Register
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Paper>
      <div className={classes.image} aria-hidden />
    </div>
  )
}
