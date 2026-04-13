import { ref } from 'vue'
import { defineStore } from 'pinia'
import { matchesService } from '@/services/matches'
import { mapApiError } from '@/services/errorMapper'
import type { Match } from '@/types'

export const useMatchesStore = defineStore('matches', () => {
  const list = ref<Match[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const loadByTournament = async (tournamentId: number): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      list.value = await matchesService.list({ tournamentId, limit: 50, page: 1 })
    } catch (err) {
      error.value = mapApiError(err).message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    list,
    loading,
    error,
    loadByTournament,
  }
})
