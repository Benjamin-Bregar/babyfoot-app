import type {
  ApiResponse,
  Match,
  MatchMutationPayload,
  MatchPlayer,
  MatchScorePayload,
  MatchUpdatePayload,
} from '@/types'
import { http } from './http'

export const matchesService = {
  async list(params?: { page?: number; limit?: number; tournamentId?: number; status?: Match['status'] }): Promise<Match[]> {
    const { data } = await http.get<ApiResponse<Match[]>>('/matches', { params })

    return data.data ?? []
  },

  async detail(matchId: number): Promise<Match> {
    const { data } = await http.get<ApiResponse<Match>>(`/matches/${matchId}`)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Match not found')
    }

    return data.data
  },

  async create(payload: MatchMutationPayload): Promise<Match> {
    const { data } = await http.post<ApiResponse<Match>>('/matches', payload)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Could not create match')
    }

    return data.data
  },

  async update(matchId: number, payload: MatchUpdatePayload): Promise<Match> {
    const { data } = await http.patch<ApiResponse<Match>>(`/matches/${matchId}`, payload)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Could not update match')
    }

    return data.data
  },

  async remove(matchId: number): Promise<void> {
    await http.delete(`/matches/${matchId}`)
  },

  async updateScore(matchId: number, payload: MatchScorePayload): Promise<Match> {
    const { data } = await http.patch<ApiResponse<Match>>(`/matches/${matchId}/score`, payload)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Could not update score')
    }

    return data.data
  },

  async listPlayers(matchId: number): Promise<MatchPlayer[]> {
    const { data } = await http.get<ApiResponse<MatchPlayer[]>>(`/matches/${matchId}/players`)

    return data.data ?? []
  },

  async createPlayer(matchId: number, payload: { playerId: number; goals?: number }): Promise<MatchPlayer> {
    const { data } = await http.post<ApiResponse<MatchPlayer>>(`/matches/${matchId}/players`, payload)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Could not add player to match')
    }

    return data.data
  },

  async updatePlayer(matchId: number, playerId: number, payload: { goals: number }): Promise<MatchPlayer> {
    const { data } = await http.patch<ApiResponse<MatchPlayer>>(`/matches/${matchId}/players/${playerId}`, payload)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Could not update match player')
    }

    return data.data
  },

  async removePlayer(matchId: number, playerId: number): Promise<void> {
    await http.delete(`/matches/${matchId}/players/${playerId}`)
  },
}
