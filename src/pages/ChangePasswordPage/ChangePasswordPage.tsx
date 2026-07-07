import { Link, useNavigate } from 'react-router-dom'
import {
  Anchor,
  Box,
  Button,
  List,
  Paper,
  PasswordInput,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { zod4Resolver } from 'mantine-form-zod-resolver'
import { notifications } from '@mantine/notifications'
import {
  changePasswordSchema,
  passwordRequirements,
  useChangePasswordMutation,
  useLogoutUserMutation,
  type ChangePasswordFormValues,
} from '../../redux/features/auth/authService'
import type { ErrorResponse } from '../../redux/baseQuery'
import classes from './ChangePasswordPage.module.css'

interface ChangePasswordPageProps {
  forced?: boolean
}

export function ChangePasswordPage({ forced = false }: ChangePasswordPageProps) {
  const navigate = useNavigate()
  const [changePasswordMutation, { isLoading }] = useChangePasswordMutation()
  const [logoutUser] = useLogoutUserMutation()

  const form = useForm<ChangePasswordFormValues>({
    mode: 'uncontrolled',
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: zod4Resolver(changePasswordSchema),
  })

  const handleSubmit = async (values: ChangePasswordFormValues) => {
    const result = await changePasswordMutation({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    })

    if (result.error) {
      const { data } = result.error as { data: ErrorResponse }
      const fieldErrors = data?.errors

      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setFieldError(field as keyof ChangePasswordFormValues, message)
        })
      }
      return
    }

    if ('data' in result) {
      notifications.show({
        title: 'Password changed',
        message: 'Please sign in again with your new password.',
        color: 'green',
      })
      navigate('/auth/login', { replace: true })
    }
  }

  const handleLogout = async () => {
    await logoutUser()
    navigate('/auth/login', { replace: true })
  }

  const formContent = (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {forced
            ? 'You must set a new password before continuing.'
            : 'Update your account password.'}
        </Text>

        <PasswordInput
          label="Current password"
          placeholder="Enter your current password"
          key={form.key('currentPassword')}
          {...form.getInputProps('currentPassword')}
        />
        <PasswordInput
          label="New password"
          placeholder="Enter a new password"
          key={form.key('newPassword')}
          {...form.getInputProps('newPassword')}
        />
        <PasswordInput
          label="Confirm new password"
          placeholder="Confirm your new password"
          key={form.key('confirmPassword')}
          {...form.getInputProps('confirmPassword')}
        />

        <Box>
          <Text size="sm" fw={500} mb={4}>
            Password requirements
          </Text>
          <List size="sm" c="dimmed" spacing={2}>
            {passwordRequirements.map((item) => (
              <List.Item key={item}>{item}</List.Item>
            ))}
          </List>
        </Box>

        <Button type="submit" fullWidth loading={isLoading}>
          Change password
        </Button>

        {forced ? (
          <Anchor component="button" type="button" size="sm" onClick={handleLogout}>
            Log out instead
          </Anchor>
        ) : (
          <Anchor component={Link} to="/" size="sm">
            Cancel
          </Anchor>
        )}
      </Stack>
    </form>
  )

  if (forced) {
    return (
      <div className={`${classes.wrapper} ${classes.forced}`}>
        <Paper className={classes.form} shadow="sm">
          <Title order={2} className={classes.title}>
            Change your password
          </Title>
          {formContent}
        </Paper>
        <div className={classes.image} aria-hidden />
      </div>
    )
  }

  return (
    <Box maw={480}>
      <Title order={2} mb="xs">
        Change password
      </Title>
      <Paper p="lg" withBorder>
        {formContent}
      </Paper>
    </Box>
  )
}
