import type {
  ApiResponse,
  PaginatedResult,
  Tournament,
  TournamentLeaderboard,
  TournamentMutationPayload,
  TournamentTeam,
} from '@/types'
import { http } from './http'

export const tournamentsService = {
  async listPaginated(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResult<Tournament>> {
    const { data } = await http.get<ApiResponse<Tournament[]>>('/tournaments', { params })

    return {
      items: data.data ?? [],
      pagination: data.meta?.pagination ?? null,
    }
  },

  async list(params?: { page?: number; limit?: number; search?: string }): Promise<Tournament[]> {
    const result = await this.listPaginated(params)
    return result.items
  },

  async detail(tournamentId: number): Promise<Tournament> {
    const { data } = await http.get<ApiResponse<Tournament>>(`/tournaments/${tournamentId}`)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Tournament not found')
    }

    return data.data
  },

  async listTeams(tournamentId: number): Promise<TournamentTeam[]> {
    const { data } = await http.get<ApiResponse<TournamentTeam[]>>(`/tournaments/${tournamentId}/teams`)

    return data.data ?? []
  },

  async leaderboard(tournamentId: number): Promise<TournamentLeaderboard> {
    const { data } = await http.get<ApiResponse<TournamentLeaderboard>>(`/tournaments/${tournamentId}/leaderboard`)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Leaderboard unavailable')
    }

    return data.data
  },

  async registerTeam(tournamentId: number, teamId: number): Promise<TournamentTeam> {
    const { data } = await http.post<ApiResponse<TournamentTeam>>(`/tournaments/${tournamentId}/teams`, {
      teamId,
    })

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Could not register team')
    }

    return data.data
  },

  async create(payload: TournamentMutationPayload): Promise<Tournament> {
    const { data } = await http.post<ApiResponse<Tournament>>('/tournaments', payload)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Could not create tournament')
    }

    return data.data
  },

  async update(tournamentId: number, payload: Partial<TournamentMutationPayload>): Promise<Tournament> {
    const { data } = await http.patch<ApiResponse<Tournament>>(`/tournaments/${tournamentId}`, payload)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Could not update tournament')
    }

    return data.data
  },

  async remove(tournamentId: number): Promise<void> {
    await http.delete(`/tournaments/${tournamentId}`)
  },

  async removeTeam(tournamentId: number, teamId: number): Promise<void> {
    await http.delete(`/tournaments/${tournamentId}/teams/${teamId}`)
  },

  async scheduleRoundRobin(
    tournamentId: number,
    payload: { startAt?: string; intervalMinutes?: number; roundsLabelPrefix?: string },
  ): Promise<{ createdMatches: number; tournamentId: number }> {
    const { data } = await http.post<ApiResponse<{ createdMatches: number; tournamentId: number }>>(
      `/tournaments/${tournamentId}/schedule/round-robin`,
      payload,
    )

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Could not generate schedule')
    }

    return data.data
  },
}
