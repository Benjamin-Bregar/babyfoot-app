import { ref } from 'vue'
import { defineStore } from 'pinia'
import { leaderboardService } from '@/services/leaderboards'
import { tournamentsService } from '@/services/tournaments'
import { mapApiError } from '@/services/errorMapper'
import type { GlobalPlayerLeaderboardRow, Tournament, TournamentLeaderboardRow } from '@/types'

export const useLeaderboardsStore = defineStore('leaderboards', () => {
  const globalRows = ref<GlobalPlayerLeaderboardRow[]>([])
  const topTournamentRows = ref<TournamentLeaderboardRow[]>([])
  const tournaments = ref<Tournament[]>([])

  const globalLoading = ref(false)
  const tournamentLoading = ref(false)

  const globalError = ref<string | null>(null)
  const tournamentError = ref<string | null>(null)

  const loadGlobal = async (): Promise<void> => {
    globalLoading.value = true
    globalError.value = null

    try {
      globalRows.value = await leaderboardService.getGlobalPlayers()
    } catch (error) {
      globalError.value = mapApiError(error).message
    } finally {
      globalLoading.value = false
    }
  }

  const loadTopTournament = async (): Promise<void> => {
    tournamentLoading.value = true
    tournamentError.value = null

    try {
      tournaments.value = await tournamentsService.list({ page: 1, limit: 5 })

      const target = tournaments.value[0]
      if (!target) {
        topTournamentRows.value = []
        return
      }

      const leaderboard = await tournamentsService.leaderboard(target.id)
      topTournamentRows.value = leaderboard.standings.slice(0, 5)
    } catch (error) {
      tournamentError.value = mapApiError(error).message
    } finally {
      tournamentLoading.value = false
    }
  }

  return {
    globalRows,
    topTournamentRows,
    tournaments,
    globalLoading,
    tournamentLoading,
    globalError,
    tournamentError,
    loadGlobal,
    loadTopTournament,
  }
})
