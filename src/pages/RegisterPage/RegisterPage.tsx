import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Anchor,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { zodResolver } from 'mantine-form-zod-resolver'
import { z } from 'zod'
import classes from './RegisterPage.module.css'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const form = useForm<RegisterFormValues>({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: zodResolver(registerSchema),
  })

  const handleSubmit = (values: RegisterFormValues) => {
    console.log('Register', values)
    // TODO: call auth API
  }

  return (
    <div className={classes.wrapper}>
      <div className={classes.content}>
        <Box maw={400} w="100%">
          <Paper p="xl" radius="md" withBorder>
            <Title order={2} mb="xs">
              Sign up
            </Title>
            <Text c="dimmed" size="sm" mb="lg">
              Create an account to get started.
            </Text>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label="Name"
                  placeholder="Your name"
                  key={form.key('name')}
                  {...form.getInputProps('name')}
                />
                <TextInput
                  label="Email"
                  placeholder="you@example.com"
                  type="email"
                  key={form.key('email')}
                  {...form.getInputProps('email')}
                />
                <PasswordInput
                  label="Password"
                  placeholder="At least 8 characters"
                  key={form.key('password')}
                  {...form.getInputProps('password')}
                />
                <PasswordInput
                  label="Confirm password"
                  placeholder="Confirm your password"
                  key={form.key('confirmPassword')}
                  {...form.getInputProps('confirmPassword')}
                />
                <Button type="submit" fullWidth>
                  Create account
                </Button>
                <Text size="sm" c="dimmed" ta="center">
                  Already have an account?{' '}
                  <Anchor component={Link} to="/auth/login">
                    Log in
                  </Anchor>
                </Text>
              </Stack>
            </form>
          </Paper>
        </Box>
      </div>
    </div>
  )
}
