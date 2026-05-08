
import { Link, useNavigate } from 'react-router-dom'
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
  Divider,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { zod4Resolver } from 'mantine-form-zod-resolver'
import { z } from 'zod'
import classes from './RegisterPage.module.css'
import { useRegisterUserMutation } from '../../redux/features/auth/authService'
import { notifications } from '@mantine/notifications'
import { useFormMutation } from '../../hooks/useFormMutation'

const registerSchema = z
  .object({
    username: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    fullNameAr: z.string().min(2, 'Full name in Arabic must be at least 2 characters'),
    tenantCode: z.string().min(2, 'Tenant code must be at least 2 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export function RegisterPage() {
  const [registerUserMutation] = useRegisterUserMutation()
  const navigate = useNavigate()
  const form = useForm<RegisterFormValues>({
    mode: 'uncontrolled',
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      fullNameAr: '',
      tenantCode: '',
    },
    validate: zod4Resolver(registerSchema),
  })

  const registerUser = useFormMutation(registerUserMutation, form)

  const handleSubmit = async (values: RegisterFormValues) => {
    const result = await registerUser(values)
    if ('data' in result) {
      notifications.show({
        title: 'Account created',
        message: 'Please login to continue',
        color: 'green',
      })
      navigate('/auth/login')
    }
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
                  label="Username"
                  placeholder="Your username"
                  key={form.key('username')}
                  {...form.getInputProps('username')}
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
                <Divider mt="xs" />
                <TextInput
                  label="Full name"
                  placeholder="Your full name"
                  key={form.key('fullName')}
                  {...form.getInputProps('fullName')}
                />
                <TextInput
                  label="Full name in Arabic"
                  placeholder="Your full name in Arabic"
                  key={form.key('fullNameAr')}
                  {...form.getInputProps('fullNameAr')}
                />
                <TextInput
                  label="Tenant code"
                  placeholder="Your tenant code"
                  key={form.key('tenantCode')}
                  {...form.getInputProps('tenantCode')}
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
