<script setup lang="ts">
import { onMounted } from 'vue'
import { useLeaderboardsStore } from '@/stores/leaderboards'

const leaderboardsStore = useLeaderboardsStore()

const loadLeaderboard = async (): Promise<void> => {
  await Promise.allSettled([leaderboardsStore.loadGlobal(), leaderboardsStore.loadTopTournament()])
}

onMounted(loadLeaderboard)
</script>

<template>
  <section class="grid gap-4">
    <article class="panel">
      <h2 class="section-title">Leaderboard Landing</h2>
      <p class="muted">Track global performance and jump into active tournaments.</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <RouterLink to="/tournaments" class="rounded border px-3 py-2 text-sm">Browse tournaments</RouterLink>
        <RouterLink
          v-for="tournament in leaderboardsStore.tournaments"
          :key="tournament.id"
          :to="`/tournaments/${tournament.id}`"
          class="rounded border px-3 py-2 text-sm"
        >
          {{ tournament.name }}
        </RouterLink>
      </div>
    </article>

    <article class="panel">
      <h2 class="section-title">Global Player Leaderboard</h2>
      <p class="muted">Top performers across all tournaments.</p>

      <p v-if="leaderboardsStore.globalLoading" class="muted">Loading leaderboard...</p>
      <div v-else-if="leaderboardsStore.globalError" class="grid gap-2">
        <p class="muted">{{ leaderboardsStore.globalError }}</p>
        <button type="button" class="rounded border px-3 py-2 text-sm" @click="leaderboardsStore.loadGlobal">
          Retry global leaderboard
        </button>
      </div>
      <p v-else-if="leaderboardsStore.globalRows.length === 0" class="muted">No leaderboard entries yet.</p>

      <div v-else class="mt-4 overflow-auto">
        <table class="w-full min-w-[540px] text-left text-sm">
          <thead>
            <tr>
              <th class="py-2 pr-3">Player</th>
              <th class="py-2 pr-3">Team ID</th>
              <th class="py-2 pr-3">Goals</th>
              <th class="py-2">Appearances</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in leaderboardsStore.globalRows" :key="row.playerId" class="border-t border-slate-200/70">
              <td class="py-2 pr-3 font-medium">{{ row.name }}</td>
              <td class="py-2 pr-3">{{ row.teamId ?? '-' }}</td>
              <td class="py-2 pr-3">{{ row.goals }}</td>
              <td class="py-2">{{ row.appearances }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>

    <article class="panel">
      <h2 class="section-title">Top Tournament Standings</h2>
      <p class="muted">Preview of the current top tournament leaderboard.</p>

      <p v-if="leaderboardsStore.tournamentLoading" class="muted">Loading tournament standings...</p>
      <div v-else-if="leaderboardsStore.tournamentError" class="grid gap-2">
        <p class="muted">{{ leaderboardsStore.tournamentError }}</p>
        <button
          type="button"
          class="rounded border px-3 py-2 text-sm"
          @click="leaderboardsStore.loadTopTournament"
        >
          Retry tournament standings
        </button>
      </div>
      <p v-else-if="leaderboardsStore.topTournamentRows.length === 0" class="muted">No standings available yet.</p>

      <div v-else class="mt-3 overflow-auto">
        <table class="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr>
              <th class="py-2 pr-3">Team</th>
              <th class="py-2 pr-3">Played</th>
              <th class="py-2 pr-3">Won</th>
              <th class="py-2">Points</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in leaderboardsStore.topTournamentRows" :key="row.teamId" class="border-t border-slate-200/70">
              <td class="py-2 pr-3">{{ row.teamName ?? `Team #${row.teamId}` }}</td>
              <td class="py-2 pr-3">{{ row.played }}</td>
              <td class="py-2 pr-3">{{ row.won }}</td>
              <td class="py-2">{{ row.points }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>
