import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { clearSessionToken, setSessionToken } from '@/auth/session'
import { authService } from '@/services/auth'
import { mapApiError } from '@/services/errorMapper'
import type { User } from '@/types'
import { router } from '@/routes'
import { useUiStore } from './ui'

export const useAuthStore = defineStore('auth', () => {
  const uiStore = useUiStore()
  const token = ref<string | null>(null)
  const currentUser = ref<User | null>(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => Boolean(token.value && currentUser.value))
  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  const login = async (email: string, password: string): Promise<void> => {
    isLoading.value = true

    try {
      const result = await authService.login({ email, password })
      token.value = result.token
      currentUser.value = result.user
      setSessionToken(result.token)
      uiStore.notifySuccess(`Welcome back, ${result.user.name}`)

      if (result.user.role === 'admin') {
        await router.push('/dashboard')
      } else {
        await router.push(`/profile/${result.user.id}`)
      }
    } catch (error) {
      const mapped = mapApiError(error)
      uiStore.notifyError(mapped.message)
      throw mapped
    } finally {
      isLoading.value = false
    }
  }

  const restoreSession = async (): Promise<void> => {
    if (!token.value) {
      return
    }

    try {
      currentUser.value = await authService.me()
    } catch {
      logout(false)
    }
  }

  const logout = (notify = true): void => {
    token.value = null
    currentUser.value = null
    clearSessionToken()

    if (notify) {
      uiStore.notifyInfo('You are now logged out.')
    }

    void router.push('/login')
  }

  return {
    token,
    currentUser,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    restoreSession,
  }
})
