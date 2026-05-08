import type { UseFormReturnType } from '@mantine/form';
import type { ErrorResponse } from '../redux/baseQuery';
type MutationTrigger<TArg, TResult> = (arg: TArg) => Promise<
  | { data: TResult; error?: undefined }
  | { error: unknown; data?: undefined }
>;

/**
 * Wraps any RTK Query mutation trigger with a Mantine form instance.
 * On success: returns the data as-is.
 * On error: automatically maps `fieldErrors` from the backend response
 * onto the form fields so you never have to do it manually per-page.
 */
export function useFormMutation<TArg, TResult>(
  trigger: MutationTrigger<TArg, TResult>,
  form: UseFormReturnType<TArg extends object ? TArg : never>
) {
  return async (values: TArg) => {
    const result = await trigger(values);

    if (result.error) {
      const { data } = result.error as { data: ErrorResponse };
      const fieldErrors = data?.errors;

      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setFieldError(field, message);
        });
      }
    }

    return result;
  };
}
