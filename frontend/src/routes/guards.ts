import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const getMeta = (to: RouteLocationNormalized) => {
  return {
    requiresAuth: Boolean(to.meta.requiresAuth),
    guestOnly: Boolean(to.meta.guestOnly),
    requiresAdmin: Boolean(to.meta.requiresAdmin),
  }
}

export const authGuard = async (
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext,
): Promise<void> => {
  const authStore = useAuthStore()
  const meta = getMeta(to)

  if (meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  if (meta.guestOnly && authStore.isAuthenticated) {
    next('/')
    return
  }

  if (meta.requiresAdmin && !authStore.isAdmin) {
    next('/forbidden')
    return
  }

  next()
}
