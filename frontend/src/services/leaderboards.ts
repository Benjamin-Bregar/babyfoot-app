import type { ApiResponse, GlobalPlayerLeaderboardRow } from '@/types'
import { http } from './http'

export const leaderboardService = {
  async getGlobalPlayers(): Promise<GlobalPlayerLeaderboardRow[]> {
    const { data } = await http.get<ApiResponse<GlobalPlayerLeaderboardRow[]>>('/leaderboards/players/global')

    return data.data ?? []
  },
}
