<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRetryableRequest } from '@/composables/useRetryableRequest'
import { tournamentsService } from '@/services/tournaments'
import { useAuthStore } from '@/stores/auth'
import { useMatchesStore } from '@/stores/matches'
import { useTournamentsStore } from '@/stores/tournaments'
import { useUiStore } from '@/stores/ui'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'

const route = useRoute()
const authStore = useAuthStore()
const tournamentsStore = useTournamentsStore()
const matchesStore = useMatchesStore()
const uiStore = useUiStore()

const tournamentId = computed(() => Number(route.params.id))
const canRegisterTeam = computed(() => authStore.isAuthenticated && authStore.currentUser?.role === 'player')
const hasAssignedTeam = computed(() => Boolean(authStore.currentUser?.teamId))

const detailRequest = useRetryableRequest(async () => {
  await tournamentsStore.loadDetail(tournamentId.value)
})

const teamsRequest = useRetryableRequest(async () => {
  if (!authStore.isAuthenticated) {
    return
  }

  await tournamentsStore.loadTeams(tournamentId.value)
})

const matchesRequest = useRetryableRequest(async () => {
  await matchesStore.loadByTournament(tournamentId.value)
})

const leaderboardRequest = useRetryableRequest(async () => {
  await tournamentsStore.loadLeaderboard(tournamentId.value)
})

const loadTournament = async (): Promise<void> => {
  const calls = [detailRequest.run(), matchesRequest.run(), leaderboardRequest.run()]
  if (authStore.isAuthenticated) {
    calls.push(teamsRequest.run())
  }

  await Promise.allSettled(calls)
}

const registerMyTeam = async (): Promise<void> => {
  if (!authStore.currentUser?.teamId) {
    return
  }

  try {
    await tournamentsService.registerTeam(tournamentId.value, authStore.currentUser.teamId)
    uiStore.notifySuccess('Team registered successfully.')
    await teamsRequest.run()
  } catch {
    uiStore.notifyError('Could not register your team in this tournament.')
  }
}

onMounted(async () => {
  await loadTournament()
})
</script>

<template>
  <section class="grid gap-4">
    <article class="panel">
      <h2 class="section-title">Tournament Detail</h2>

      <LoadingState v-if="detailRequest.isLoading.value" message="Loading tournament details..." />
      <ErrorState
        v-else-if="detailRequest.error.value"
        :message="detailRequest.error.value ?? ''"
        retry-label="Retry tournament"
        @retry="detailRequest.retry"
      />
      <template v-else-if="tournamentsStore.detail">
        <h3 class="text-xl font-semibold text-night">{{ tournamentsStore.detail.name }}</h3>
        <p class="mt-2 muted">{{ tournamentsStore.detail.description || 'No description provided.' }}</p>
        <p class="mt-2 text-sm muted">Start: {{ tournamentsStore.detail.startDate }}</p>
        <p class="text-sm muted">End: {{ tournamentsStore.detail.endDate ?? 'TBD' }}</p>

        <div class="mt-4">
          <button
            v-if="canRegisterTeam && hasAssignedTeam"
            type="button"
            class="rounded-lg bg-night px-4 py-2 text-sm text-white"
            @click="registerMyTeam"
          >
            Register My Team
          </button>
          <p v-else-if="canRegisterTeam" class="muted">
            Your team is not assigned yet. Ask an admin to assign you to a team before registering.
          </p>
          <p v-else class="muted">Login as a player to register your team.</p>
        </div>
      </template>
      <EmptyState v-else title="No tournament found" />
    </article>

    <section class="grid-2">
      <article class="panel">
        <h2 class="section-title">Registered Teams</h2>
        <p v-if="!authStore.isAuthenticated" class="muted">Login to view registered teams.</p>
        <LoadingState v-else-if="teamsRequest.isLoading.value" message="Loading teams..." />
        <ErrorState
          v-else-if="teamsRequest.error.value"
          :message="teamsRequest.error.value ?? ''"
          retry-label="Retry teams"
          @retry="teamsRequest.retry"
        />
        <EmptyState
          v-else-if="tournamentsStore.teams.length === 0"
          title="No registered teams"
          message="No team has joined this tournament yet."
        />
        <div v-else class="overflow-auto">
          <table class="w-full min-w-[440px] text-left text-sm">
            <thead>
              <tr>
                <th class="py-2 pr-3">Team</th>
                <th class="py-2 pr-3">Played</th>
                <th class="py-2 pr-3">Won</th>
                <th class="py-2">Points</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="team in tournamentsStore.teams" :key="team.id" class="border-t border-slate-200/70">
                <td class="py-2 pr-3">{{ team.teamName ?? `Team #${team.teamId}` }}</td>
                <td class="py-2 pr-3">{{ team.played }}</td>
                <td class="py-2 pr-3">{{ team.won }}</td>
                <td class="py-2">{{ team.points }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel">
        <h2 class="section-title">Matches</h2>
        <LoadingState v-if="matchesRequest.isLoading.value" message="Loading matches..." />
        <ErrorState
          v-else-if="matchesRequest.error.value"
          :message="matchesRequest.error.value ?? ''"
          @retry="matchesRequest.retry"
        />
        <EmptyState
          v-else-if="matchesStore.list.length === 0"
          title="No matches yet"
          message="Matches will appear once schedule generation runs."
        />
        <ul v-else class="grid gap-2">
          <li v-for="match in matchesStore.list" :key="match.id" class="rounded-lg border border-slate-200 p-3">
            <p class="font-semibold text-night">{{ match.round ?? 'Round TBD' }}</p>
            <p class="text-sm muted">Status: {{ match.status }}</p>
            <ul class="mt-1 text-sm">
              <li v-for="team in match.teams" :key="team.teamId">
                {{ team.teamName ?? `Team #${team.teamId}` }}: {{ team.score ?? '-' }}
              </li>
            </ul>
          </li>
        </ul>
      </article>
    </section>

    <article class="panel">
      <h2 class="section-title">Tournament Leaderboard</h2>

      <LoadingState v-if="leaderboardRequest.isLoading.value" message="Loading standings..." />
      <ErrorState
        v-else-if="leaderboardRequest.error.value"
        :message="leaderboardRequest.error.value ?? ''"
        retry-label="Retry standings"
        @retry="leaderboardRequest.retry"
      />
      <EmptyState
        v-else-if="tournamentsStore.leaderboard.length === 0"
        title="No standings yet"
        message="Standings will update once matches are completed."
      />
      <div v-else class="overflow-auto">
        <table class="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr>
              <th class="py-2 pr-3">Team</th>
              <th class="py-2 pr-3">Played</th>
              <th class="py-2 pr-3">Won</th>
              <th class="py-2 pr-3">Drawn</th>
              <th class="py-2">Points</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in tournamentsStore.leaderboard"
              :key="row.teamId"
              class="border-t border-slate-200/70"
            >
              <td class="py-2 pr-3">{{ row.teamName ?? `Team #${row.teamId}` }}</td>
              <td class="py-2 pr-3">{{ row.played }}</td>
              <td class="py-2 pr-3">{{ row.won }}</td>
              <td class="py-2 pr-3">{{ row.drawn }}</td>
              <td class="py-2">{{ row.points }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>
