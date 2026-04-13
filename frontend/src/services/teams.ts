import type { ApiResponse, Team } from '@/types'
import { http } from './http'

export const teamsService = {
  async list(params?: { page?: number; limit?: number; search?: string }): Promise<Team[]> {
    const { data } = await http.get<ApiResponse<Team[]>>('/teams', { params })

    return data.data ?? []
  },

  async create(payload: { name: string }): Promise<Team> {
    const { data } = await http.post<ApiResponse<Team>>('/teams', payload)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Could not create team')
    }

    return data.data
  },

  async update(teamId: number, payload: { name: string }): Promise<Team> {
    const { data } = await http.patch<ApiResponse<Team>>(`/teams/${teamId}`, payload)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Could not update team')
    }

    return data.data
  },

  async remove(teamId: number): Promise<void> {
    await http.delete(`/teams/${teamId}`)
  },
}
