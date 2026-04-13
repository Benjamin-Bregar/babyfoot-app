<script setup lang="ts">
import { reactive } from 'vue'
import { useFormValidation } from '@/composables/useFormValidation'
import { useAuthStore } from '@/stores/auth'
import { validateLogin } from '@/utils/validators'

const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
})

const { errors, validate, validateField } = useFormValidation<
  { email: string; password: string },
  'email' | 'password'
>(validateLogin)

const submit = async (): Promise<void> => {
  const isValid = validate(form)
  if (!isValid) {
    return
  }

  await authStore.login(form.email, form.password)
}
</script>

<template>
  <section class="panel max-w-xl mx-auto">
    <h2 class="section-title">Login</h2>
    <p class="muted">Sign in with your player or admin account.</p>

    <form class="mt-4 grid gap-3" @submit.prevent="submit">
      <label class="grid gap-1">
        <span class="text-sm">Email</span>
        <input
          v-model="form.email"
          required
          type="email"
          class="rounded-lg border border-slate-300 px-3 py-2"
          @blur="validateField(form, 'email')"
        />
        <span v-if="errors.email?.length" class="text-xs text-red-700">{{ errors.email[0] }}</span>
      </label>

      <label class="grid gap-1">
        <span class="text-sm">Password</span>
        <input
          v-model="form.password"
          required
          type="password"
          minlength="8"
          class="rounded-lg border border-slate-300 px-3 py-2"
          @blur="validateField(form, 'password')"
        />
        <span v-if="errors.password?.length" class="text-xs text-red-700">{{ errors.password[0] }}</span>
      </label>

      <button
        type="submit"
        class="rounded-lg bg-night px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="authStore.isLoading"
      >
        {{ authStore.isLoading ? 'Signing in...' : 'Sign in' }}
      </button>
    </form>
  </section>
</template>
