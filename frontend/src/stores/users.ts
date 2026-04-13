import { ref } from 'vue'
import { defineStore } from 'pinia'
import { mapApiError } from '@/services/errorMapper'
import { usersService } from '@/services/users'
import type { Tournament, User } from '@/types'

export const useUsersStore = defineStore('users', () => {
  const profile = ref<User | null>(null)
  const joinedTournaments = ref<Tournament[]>([])
  const loadingProfile = ref(false)
  const loadingTournaments = ref(false)
  const profileError = ref<string | null>(null)
  const tournamentsError = ref<string | null>(null)

  const fetchProfile = async (userId: number): Promise<void> => {
    loadingProfile.value = true
    profileError.value = null

    try {
      profile.value = await usersService.getById(userId)
    } catch (error) {
      profileError.value = mapApiError(error).message
      throw error
    } finally {
      loadingProfile.value = false
    }
  }

  const fetchMyTournaments = async (): Promise<void> => {
    loadingTournaments.value = true
    tournamentsError.value = null

    try {
      joinedTournaments.value = await usersService.getMyTournaments()
    } catch (error) {
      tournamentsError.value = mapApiError(error).message
      throw error
    } finally {
      loadingTournaments.value = false
    }
  }

  return {
    profile,
    joinedTournaments,
    loadingProfile,
    loadingTournaments,
    profileError,
    tournamentsError,
    fetchProfile,
    fetchMyTournaments,
  }
})
