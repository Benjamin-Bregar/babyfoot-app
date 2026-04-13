import { ref } from 'vue'
import { defineStore } from 'pinia'
import { tournamentsService } from '@/services/tournaments'
import { mapApiError } from '@/services/errorMapper'
import type { Tournament, TournamentLeaderboardRow, TournamentTeam } from '@/types'

export const useTournamentsStore = defineStore('tournaments', () => {
  const detail = ref<Tournament | null>(null)
  const teams = ref<TournamentTeam[]>([])
  const leaderboard = ref<TournamentLeaderboardRow[]>([])
  const loading = ref(false)
  const teamsLoading = ref(false)
  const leaderboardLoading = ref(false)
  const detailError = ref<string | null>(null)
  const teamsError = ref<string | null>(null)
  const leaderboardError = ref<string | null>(null)

  const loadDetail = async (tournamentId: number): Promise<void> => {
    loading.value = true
    detailError.value = null

    try {
      detail.value = await tournamentsService.detail(tournamentId)
    } catch (error) {
      detailError.value = mapApiError(error).message
      throw error
    } finally {
      loading.value = false
    }
  }

  const loadTeams = async (tournamentId: number): Promise<void> => {
    teamsLoading.value = true
    teamsError.value = null

    try {
      teams.value = await tournamentsService.listTeams(tournamentId)
    } catch (error) {
      teamsError.value = mapApiError(error).message
      throw error
    } finally {
      teamsLoading.value = false
    }
  }

  const loadLeaderboard = async (tournamentId: number): Promise<void> => {
    leaderboardLoading.value = true
    leaderboardError.value = null

    try {
      const payload = await tournamentsService.leaderboard(tournamentId)
      leaderboard.value = payload.standings
    } catch (error) {
      leaderboardError.value = mapApiError(error).message
      throw error
    } finally {
      leaderboardLoading.value = false
    }
  }

  return {
    detail,
    teams,
    leaderboard,
    loading,
    teamsLoading,
    leaderboardLoading,
    detailError,
    teamsError,
    leaderboardError,
    loadDetail,
    loadTeams,
    loadLeaderboard,
  }
})
