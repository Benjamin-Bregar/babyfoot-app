import type { ApiResponse, User, Tournament, UserMutationPayload } from '@/types'
import { http } from './http'

export const usersService = {
  async getById(userId: number): Promise<User> {
    const { data } = await http.get<ApiResponse<User>>(`/users/${userId}`)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'User not found')
    }

    return data.data
  },

  async getMyTournaments(): Promise<Tournament[]> {
    const { data } = await http.get<ApiResponse<Tournament[]>>('/users/me/tournaments')

    return data.data ?? []
  },

  async list(params?: { page?: number; limit?: number; role?: 'admin' | 'player'; search?: string }): Promise<User[]> {
    const { data } = await http.get<ApiResponse<User[]>>('/users', { params })

    return data.data ?? []
  },

  async create(payload: UserMutationPayload): Promise<User> {
    const { data } = await http.post<ApiResponse<User>>('/users', payload)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Could not create user')
    }

    return data.data
  },

  async update(userId: number, payload: Partial<UserMutationPayload>): Promise<User> {
    const { data } = await http.patch<ApiResponse<User>>(`/users/${userId}`, payload)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Could not update user')
    }

    return data.data
  },

  async remove(userId: number): Promise<void> {
    await http.delete(`/users/${userId}`)
  },
}
