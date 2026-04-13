<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRetryableRequest } from '@/composables/useRetryableRequest'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import { useUsersStore } from '@/stores/users'

const route = useRoute()
const router = useRouter()
const usersStore = useUsersStore()

const profileId = computed(() => Number(route.params.id))

const tournamentsPlayed = computed(() => usersStore.joinedTournaments.length)

const profileRequest = useRetryableRequest(async () => {
  await usersStore.fetchProfile(profileId.value)

  if (usersStore.profileError?.toLowerCase().includes('access denied')) {
    await router.push('/forbidden')
  }
})

const tournamentsRequest = useRetryableRequest(async () => {
  await usersStore.fetchMyTournaments()
})

const loadData = async (): Promise<void> => {
  if (!Number.isFinite(profileId.value)) {
    await router.push({ name: 'not-found' })
    return
  }

  await Promise.allSettled([profileRequest.run(), tournamentsRequest.run()])
}

onMounted(loadData)
</script>

<template>
  <section class="grid-2">
    <article class="panel">
      <h2 class="section-title">Profile</h2>

      <LoadingState v-if="profileRequest.isLoading.value" message="Loading your profile..." />
      <ErrorState
        v-else-if="profileRequest.error.value"
        :message="profileRequest.error.value ?? ''"
        retry-label="Retry profile"
        @retry="profileRequest.retry"
      />
      <template v-else-if="usersStore.profile">
        <dl class="grid gap-3">
          <div>
            <dt class="text-xs uppercase tracking-wide muted">Name</dt>
            <dd class="font-semibold">{{ usersStore.profile.name }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wide muted">Email</dt>
            <dd>{{ usersStore.profile.email }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wide muted">Role</dt>
            <dd class="capitalize">{{ usersStore.profile.role }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wide muted">Assigned Team</dt>
            <dd>{{ usersStore.profile.teamId ?? 'No team assigned yet' }}</dd>
          </div>
        </dl>
      </template>
      <EmptyState v-else title="No Profile" message="Profile information is not available." />
    </article>

    <article class="panel">
      <h2 class="section-title">Participation Summary</h2>

      <LoadingState v-if="tournamentsRequest.isLoading.value" message="Loading tournaments..." />
      <ErrorState
        v-else-if="tournamentsRequest.error.value"
        :message="tournamentsRequest.error.value ?? ''"
        retry-label="Retry tournaments"
        @retry="tournamentsRequest.retry"
      />
      <template v-else>
        <p class="muted">Tournaments joined: {{ tournamentsPlayed }}</p>

        <EmptyState
          v-if="usersStore.joinedTournaments.length === 0"
          title="No joined tournaments"
          message="Register your team in a tournament to see it listed here."
        />

        <ul v-else class="mt-3 grid gap-3">
          <li v-for="tournament in usersStore.joinedTournaments" :key="tournament.id" class="panel">
            <RouterLink :to="`/tournaments/${tournament.id}`" class="font-semibold text-night">
              {{ tournament.name }}
            </RouterLink>
            <p class="text-sm muted">{{ tournament.startDate }} - {{ tournament.endDate ?? 'TBD' }}</p>
          </li>
        </ul>
      </template>
    </article>
  </section>
</template>
