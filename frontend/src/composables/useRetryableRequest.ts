import { ref } from 'vue'
import { mapApiError } from '@/services/errorMapper'

export const useRetryableRequest = <T>(
  runner: () => Promise<T>,
  options?: {
    cooldownMs?: number
  },
) => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const attempts = ref(0)
  const lastRunAt = ref<number | null>(null)

  const cooldownMs = options?.cooldownMs ?? 600

  const run = async (): Promise<T | null> => {
    const now = Date.now()
    if (lastRunAt.value && now - lastRunAt.value < cooldownMs) {
      return null
    }

    attempts.value += 1
    isLoading.value = true
    error.value = null
    lastRunAt.value = now

    try {
      return await runner()
    } catch (err) {
      error.value = mapApiError(err).message
      return null
    } finally {
      isLoading.value = false
    }
  }

  const retry = async (): Promise<T | null> => run()

  const resetError = (): void => {
    error.value = null
  }

  return {
    isLoading,
    error,
    attempts,
    lastRunAt,
    run,
    retry,
    resetError,
  }
}
