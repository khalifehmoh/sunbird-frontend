import { Link, useNavigate } from 'react-router-dom'
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
import { zod4Resolver } from 'mantine-form-zod-resolver'
import { z } from 'zod'
import classes from './LoginPage.module.css'
import { useLoginUserMutation } from '../../redux/features/auth/authService'
import { useEffect } from 'react'
import { notifications } from '@mantine/notifications'
import { useFormMutation } from '../../hooks/useFormMutation'

const loginSchema = z.object({
  username: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const [loginUserMutation] = useLoginUserMutation()
  const navigate = useNavigate()
  const form = useForm<LoginFormValues>({
    mode: 'uncontrolled',
    initialValues: { username: '', password: '' },
    validate: zod4Resolver(loginSchema),
  })

  const loginUser = useFormMutation(loginUserMutation, form)

  const handleSubmit = async (values: LoginFormValues) => {
    const result = await loginUser(values);
    if ('data' in result) {
      notifications.show({
        title: 'Login successful',
        message: `Welcome back, ${result.data?.username}!`,
        color: 'green',
      });
      navigate('/dashboard');
    }
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
              label="Username"
              placeholder="Your username"
              size="md"
              key={form.key('username')}
              {...form.getInputProps('username')}
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
