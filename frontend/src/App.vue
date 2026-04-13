<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

const isLoggedIn = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)

const handleLogout = () => {
  authStore.logout()
}

onMounted(() => {
  void authStore.restoreSession()
})
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand-block">
        <p class="eyebrow">Baby-Foot League</p>
        <h1 class="brand-title">Tournament Manager</h1>
      </div>
      <nav class="main-nav" aria-label="Primary navigation">
        <RouterLink to="/">Leaderboard</RouterLink>
        <RouterLink to="/tournaments">Tournaments</RouterLink>
        <RouterLink v-if="isLoggedIn" :to="`/profile/${authStore.currentUser?.id ?? ''}`">Profile</RouterLink>
        <RouterLink v-if="isAdmin" to="/dashboard">Dashboard</RouterLink>
        <RouterLink v-if="!isLoggedIn" to="/login">Login</RouterLink>
        <button v-else type="button" class="logout-btn" @click="handleLogout">Logout</button>
      </nav>
    </header>

    <main class="page-shell">
      <RouterView />
    </main>
  </div>
</template>
