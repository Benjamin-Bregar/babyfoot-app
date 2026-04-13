import { computed, ref } from 'vue'
import type { FieldErrors } from '@/types/validation'

export const useFormValidation = <TValues extends Record<string, unknown>, TFields extends string = string>(
  validator: (values: TValues) => FieldErrors<TFields>,
) => {
  const errors = ref<FieldErrors<TFields>>({})
  const touched = ref<Partial<Record<TFields, boolean>>>({})

  const hasError = computed(() => Object.keys(errors.value).length > 0)

  const validate = (values: TValues): boolean => {
    errors.value = validator(values)
    return Object.keys(errors.value).length === 0
  }

  const validateField = (values: TValues, field: TFields): void => {
    touched.value[field] = true
    const next = validator(values)
    errors.value = next
  }

  const resetValidation = (): void => {
    errors.value = {}
    touched.value = {}
  }

  return {
    errors,
    touched,
    hasError,
    validate,
    validateField,
    resetValidation,
  }
}
