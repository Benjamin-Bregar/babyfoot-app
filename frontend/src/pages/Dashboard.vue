<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useFormValidation } from '@/composables/useFormValidation'
import { useRetryableRequest } from '@/composables/useRetryableRequest'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import { mapApiError } from '@/services/errorMapper'
import { matchesService } from '@/services/matches'
import { teamsService } from '@/services/teams'
import { tournamentsService } from '@/services/tournaments'
import { usersService } from '@/services/users'
import { useUiStore } from '@/stores/ui'
import type { Match, MatchPlayer, Team, Tournament, TournamentTeam, User } from '@/types'
import { validateScoreForm, validateTournamentForm, validateUserForm } from '@/utils/validators'

const uiStore = useUiStore()
const tournaments = ref<Tournament[]>([])
const users = ref<User[]>([])
const teams = ref<Team[]>([])
const matches = ref<Match[]>([])
const tournamentTeams = ref<TournamentTeam[]>([])
const matchPlayers = ref<MatchPlayer[]>([])
const matchPlayerGoalsDraft = ref<Record<number, number>>({})

const selectedTournamentId = ref<number | null>(null)
const selectedMatchId = ref<number | null>(null)
const selectedRegistrationTeamId = ref<number | null>(null)
const selectedPlayerId = ref<number | null>(null)
const newPlayerGoals = ref(0)

const tournamentForm = reactive({
  name: '',
  startDate: '',
  endDate: '',
  description: '',
})

const userForm = reactive({
  name: '',
  email: '',
  password: '',
  role: 'player' as 'player' | 'admin',
  teamId: '',
})

const scoreForm = reactive({
  homeScore: 0,
  awayScore: 0,
})

const selectedMatch = computed(() => matches.value.find((match) => match.id === selectedMatchId.value) ?? null)
const selectedMatchTeams = computed(() => selectedMatch.value?.teams ?? [])
const playerOptions = computed(() => users.value.filter((user) => user.role === 'player'))

const tournamentValidation = useFormValidation<
  { name: string; startDate: string; endDate: string; description: string },
  'name' | 'startDate' | 'endDate' | 'description'
>(validateTournamentForm)
const userValidation = useFormValidation<
  { name: string; email: string; password: string; role: 'player' | 'admin'; teamId: string },
  'name' | 'email' | 'password' | 'role' | 'teamId'
>(validateUserForm)
const scoreValidation = useFormValidation<
  { homeTeamId: number; awayTeamId: number; homeScore: number; awayScore: number },
  'homeScore' | 'awayScore' | 'homeTeamId' | 'awayTeamId'
>(validateScoreForm)

const tournamentsPanelRequest = useRetryableRequest(async () => {
  tournaments.value = await tournamentsService.list({ page: 1, limit: 100 })
  selectedTournamentId.value = tournaments.value[0]?.id ?? null
})

const usersPanelRequest = useRetryableRequest(async () => {
  const [userList, teamList] = await Promise.all([
    usersService.list({ page: 1, limit: 100 }),
    teamsService.list({ page: 1, limit: 100 }),
  ])

  users.value = userList
  teams.value = teamList
})

const matchesPanelRequest = useRetryableRequest(async () => {
  if (!selectedTournamentId.value) {
    matches.value = []
    selectedMatchId.value = null
    return
  }

  matches.value = await matchesService.list({ tournamentId: selectedTournamentId.value, limit: 100, page: 1 })
  selectedMatchId.value = matches.value[0]?.id ?? null
})

const tournamentTeamsRequest = useRetryableRequest(async () => {
  if (!selectedTournamentId.value) {
    tournamentTeams.value = []
    return
  }

  tournamentTeams.value = await tournamentsService.listTeams(selectedTournamentId.value)
})

const matchPlayersRequest = useRetryableRequest(async () => {
  if (!selectedMatchId.value) {
    matchPlayers.value = []
    matchPlayerGoalsDraft.value = {}
    return
  }

  const players = await matchesService.listPlayers(selectedMatchId.value)
  matchPlayers.value = players
  matchPlayerGoalsDraft.value = players.reduce<Record<number, number>>((acc, player) => {
    acc[player.playerId] = player.goals
    return acc
  }, {})
})

const loadDashboard = async (): Promise<void> => {
  await Promise.allSettled([tournamentsPanelRequest.run(), usersPanelRequest.run()])
  await Promise.allSettled([matchesPanelRequest.run(), tournamentTeamsRequest.run(), matchPlayersRequest.run()])
}

watch(selectedTournamentId, async () => {
  await Promise.allSettled([matchesPanelRequest.run(), tournamentTeamsRequest.run()])
})

watch(selectedMatchId, async () => {
  await matchPlayersRequest.run()
})

const createTournament = async (): Promise<void> => {
  const isValid = tournamentValidation.validate(tournamentForm)
  if (!isValid) {
    return
  }

  try {
    await tournamentsService.create({
      name: tournamentForm.name,
      startDate: tournamentForm.startDate,
      endDate: tournamentForm.endDate || null,
      description: tournamentForm.description || null,
    })

    tournamentForm.name = ''
    tournamentForm.startDate = ''
    tournamentForm.endDate = ''
    tournamentForm.description = ''
    tournamentValidation.resetValidation()

    uiStore.notifySuccess('Tournament created.')
    await tournamentsPanelRequest.run()
  } catch (err) {
    uiStore.notifyError(mapApiError(err).message)
  }
}

const deleteTournament = async (tournamentId: number): Promise<void> => {
  try {
    await tournamentsService.remove(tournamentId)
    uiStore.notifySuccess('Tournament deleted.')
    await Promise.allSettled([tournamentsPanelRequest.run(), matchesPanelRequest.run()])
  } catch (err) {
    uiStore.notifyError(mapApiError(err).message)
  }
}

const registerTeamToTournament = async (): Promise<void> => {
  if (!selectedTournamentId.value || !selectedRegistrationTeamId.value) {
    uiStore.notifyError('Select both tournament and team before registering.')
    return
  }

  try {
    await tournamentsService.registerTeam(selectedTournamentId.value, selectedRegistrationTeamId.value)
    uiStore.notifySuccess('Team registered in tournament.')
    await tournamentTeamsRequest.run()
  } catch (err) {
    uiStore.notifyError(mapApiError(err).message)
  }
}

const removeRegisteredTeam = async (teamId: number): Promise<void> => {
  if (!selectedTournamentId.value) {
    return
  }

  try {
    await tournamentsService.removeTeam(selectedTournamentId.value, teamId)
    uiStore.notifySuccess('Team removed from tournament.')
    await tournamentTeamsRequest.run()
  } catch (err) {
    uiStore.notifyError(mapApiError(err).message)
  }
}

const generateSchedule = async (): Promise<void> => {
  if (!selectedTournamentId.value) {
    return
  }

  try {
    const response = await tournamentsService.scheduleRoundRobin(selectedTournamentId.value, {
      intervalMinutes: 60,
      roundsLabelPrefix: 'Round',
    })
    uiStore.notifySuccess(`Schedule generated with ${response.createdMatches} matches.`)
    await matchesPanelRequest.run()
  } catch (err) {
    uiStore.notifyError(mapApiError(err).message)
  }
}

const submitScore = async (): Promise<void> => {
  if (!selectedMatch.value || selectedMatchTeams.value.length < 2) {
    uiStore.notifyError('Select a match with two teams first.')
    return
  }

  const payload = {
    homeTeamId: selectedMatchTeams.value[0].teamId,
    awayTeamId: selectedMatchTeams.value[1].teamId,
    homeScore: Number(scoreForm.homeScore),
    awayScore: Number(scoreForm.awayScore),
  }

  if (!scoreValidation.validate(payload)) {
    return
  }

  try {
    await matchesService.updateScore(selectedMatch.value.id, payload)
    uiStore.notifySuccess('Score updated successfully.')
    await matchesPanelRequest.run()
  } catch (err) {
    uiStore.notifyError(mapApiError(err).message)
  }
}

const addMatchPlayer = async (): Promise<void> => {
  if (!selectedMatchId.value || !selectedPlayerId.value) {
    uiStore.notifyError('Select a match and player first.')
    return
  }

  if (!Number.isInteger(newPlayerGoals.value) || newPlayerGoals.value < 0) {
    uiStore.notifyError('Goals must be an integer greater than or equal to 0.')
    return
  }

  try {
    await matchesService.createPlayer(selectedMatchId.value, {
      playerId: selectedPlayerId.value,
      goals: newPlayerGoals.value,
    })
    uiStore.notifySuccess('Match player added.')
    newPlayerGoals.value = 0
    await matchPlayersRequest.run()
  } catch (err) {
    uiStore.notifyError(mapApiError(err).message)
  }
}

const updateMatchPlayerGoals = async (playerId: number): Promise<void> => {
  if (!selectedMatchId.value) {
    return
  }

  const goals = matchPlayerGoalsDraft.value[playerId]
  if (!Number.isInteger(goals) || goals < 0) {
    uiStore.notifyError('Goals must be an integer greater than or equal to 0.')
    return
  }

  try {
    await matchesService.updatePlayer(selectedMatchId.value, playerId, { goals })
    uiStore.notifySuccess('Player goals updated.')
    await matchPlayersRequest.run()
  } catch (err) {
    uiStore.notifyError(mapApiError(err).message)
  }
}

const removeMatchPlayer = async (playerId: number): Promise<void> => {
  if (!selectedMatchId.value) {
    return
  }

  try {
    await matchesService.removePlayer(selectedMatchId.value, playerId)
    uiStore.notifyInfo('Player removed from match.')
    await matchPlayersRequest.run()
  } catch (err) {
    uiStore.notifyError(mapApiError(err).message)
  }
}

const createUser = async (): Promise<void> => {
  const isValid = userValidation.validate(userForm)
  if (!isValid) {
    return
  }

  try {
    await usersService.create({
      name: userForm.name,
      email: userForm.email,
      password: userForm.password,
      role: userForm.role,
      teamId: userForm.teamId ? Number(userForm.teamId) : null,
    })

    userForm.name = ''
    userForm.email = ''
    userForm.password = ''
    userForm.role = 'player'
    userForm.teamId = ''
    userValidation.resetValidation()

    uiStore.notifySuccess('User created.')
    await usersPanelRequest.run()
  } catch (err) {
    uiStore.notifyError(mapApiError(err).message)
  }
}

const promoteToAdmin = async (user: User): Promise<void> => {
  try {
    await usersService.update(user.id, { role: 'admin' })
    uiStore.notifySuccess(`Updated ${user.name}.`)
    await usersPanelRequest.run()
  } catch (err) {
    uiStore.notifyError(mapApiError(err).message)
  }
}

const deleteUser = async (userId: number): Promise<void> => {
  try {
    await usersService.remove(userId)
    uiStore.notifySuccess('User deleted.')
    await usersPanelRequest.run()
  } catch (err) {
    uiStore.notifyError(mapApiError(err).message)
  }
}

onMounted(loadDashboard)
</script>

<template>
  <section class="grid gap-4">
    <article class="panel">
      <h2 class="section-title">Admin Dashboard</h2>
      <p class="muted">Manage tournaments, schedules, match scores, and users.</p>
    </article>

    <section class="grid-2">
      <article class="panel">
        <LoadingState v-if="tournamentsPanelRequest.isLoading.value" message="Loading tournament data..." />
        <ErrorState
          v-else-if="tournamentsPanelRequest.error.value"
          title="Tournament Panel"
          :message="tournamentsPanelRequest.error.value ?? ''"
          retry-label="Retry tournaments"
          @retry="tournamentsPanelRequest.retry"
        />
        <template v-else>
          <h3 class="section-title">Tournament Management</h3>

          <form class="grid gap-2" @submit.prevent="createTournament">
            <input
              v-model="tournamentForm.name"
              class="rounded border px-3 py-2"
              placeholder="Tournament name"
              aria-label="Tournament name"
              required
              @blur="tournamentValidation.validateField(tournamentForm, 'name')"
            />
            <p v-if="tournamentValidation.errors.value.name?.length" class="text-xs text-red-700">
              {{ tournamentValidation.errors.value.name[0] }}
            </p>
            <input
              v-model="tournamentForm.startDate"
              type="date"
              class="rounded border px-3 py-2"
              aria-label="Tournament start date"
              required
              @blur="tournamentValidation.validateField(tournamentForm, 'startDate')"
            />
            <p v-if="tournamentValidation.errors.value.startDate?.length" class="text-xs text-red-700">
              {{ tournamentValidation.errors.value.startDate[0] }}
            </p>
            <input
              v-model="tournamentForm.endDate"
              type="date"
              class="rounded border px-3 py-2"
              aria-label="Tournament end date"
            />
            <p v-if="tournamentValidation.errors.value.endDate?.length" class="text-xs text-red-700">
              {{ tournamentValidation.errors.value.endDate[0] }}
            </p>
            <textarea
              v-model="tournamentForm.description"
              class="rounded border px-3 py-2"
              rows="2"
              placeholder="Description"
              aria-label="Tournament description"
              @blur="tournamentValidation.validateField(tournamentForm, 'description')"
            />
            <p v-if="tournamentValidation.errors.value.description?.length" class="text-xs text-red-700">
              {{ tournamentValidation.errors.value.description[0] }}
            </p>
            <button type="submit" class="rounded bg-night px-3 py-2 text-sm text-white">Create Tournament</button>
          </form>

          <ul class="mt-3 grid gap-2">
            <li v-for="tournament in tournaments" :key="tournament.id" class="rounded border p-3">
              <p class="font-semibold text-night">{{ tournament.name }}</p>
              <p class="text-sm muted">{{ tournament.startDate }} - {{ tournament.endDate ?? 'TBD' }}</p>
              <div class="mt-2 flex gap-2">
                <button
                  type="button"
                  class="rounded border px-2 py-1 text-xs"
                  @click="selectedTournamentId = tournament.id"
                >
                  Select
                </button>
                <button
                  type="button"
                  class="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                  @click="deleteTournament(tournament.id)"
                >
                  Delete
                </button>
              </div>
            </li>
          </ul>

          <div class="mt-4 border-t pt-4">
            <h4 class="font-semibold text-night">Tournament Teams</h4>
            <p class="text-sm muted">Register teams in the selected tournament or remove existing registrations.</p>
            <div class="mt-2 grid gap-2 md:grid-cols-2">
              <select
                v-model.number="selectedRegistrationTeamId"
                class="rounded border px-3 py-2"
                aria-label="Select team to register"
              >
                <option :value="null">Select team</option>
                <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
              </select>
              <button
                type="button"
                class="rounded border px-3 py-2 text-sm"
                :disabled="!selectedTournamentId || !selectedRegistrationTeamId"
                @click="registerTeamToTournament"
              >
                Register Team In Selected Tournament
              </button>
            </div>

            <LoadingState v-if="tournamentTeamsRequest.isLoading.value" message="Loading registered teams..." />
            <ErrorState
              v-else-if="tournamentTeamsRequest.error.value"
              title="Tournament Team Links"
              :message="tournamentTeamsRequest.error.value ?? ''"
              retry-label="Retry team links"
              @retry="tournamentTeamsRequest.retry"
            />
            <div v-else class="mt-3 overflow-auto">
              <table class="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr>
                    <th class="py-2 pr-3">Team</th>
                    <th class="py-2 pr-3">Points</th>
                    <th class="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in tournamentTeams" :key="row.id" class="border-t border-slate-200/70">
                    <td class="py-2 pr-3">{{ row.teamName ?? `Team #${row.teamId}` }}</td>
                    <td class="py-2 pr-3">{{ row.points }}</td>
                    <td class="py-2">
                      <button
                        type="button"
                        class="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                        @click="removeRegisteredTeam(row.teamId)"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </article>

      <article class="panel">
        <LoadingState v-if="matchesPanelRequest.isLoading.value" message="Loading scheduling panel..." />
        <ErrorState
          v-else-if="matchesPanelRequest.error.value"
          title="Scheduling Panel"
          :message="matchesPanelRequest.error.value ?? ''"
          retry-label="Retry scheduling"
          @retry="matchesPanelRequest.retry"
        />
        <template v-else>
          <h3 class="section-title">Scheduling and Scores</h3>
          <label class="grid gap-1">
            <span class="text-sm muted">Selected tournament</span>
            <select v-model.number="selectedTournamentId" class="rounded border px-3 py-2" aria-label="Selected tournament">
              <option :value="null">Choose tournament</option>
              <option v-for="tournament in tournaments" :key="tournament.id" :value="tournament.id">
                {{ tournament.name }}
              </option>
            </select>
          </label>

          <button
            type="button"
            class="mt-3 rounded bg-fire px-3 py-2 text-sm text-white disabled:opacity-50"
            :disabled="!selectedTournamentId"
            @click="generateSchedule"
          >
            Generate Round-Robin Schedule
          </button>

          <label class="mt-4 grid gap-1">
            <span class="text-sm muted">Select match</span>
            <select v-model.number="selectedMatchId" class="rounded border px-3 py-2" aria-label="Select match">
              <option :value="null">Choose match</option>
              <option v-for="match in matches" :key="match.id" :value="match.id">
                #{{ match.id }} - {{ match.round ?? 'Round TBD' }} ({{ match.status }})
              </option>
            </select>
          </label>

          <div v-if="selectedMatchTeams.length >= 2" class="mt-3 grid gap-2">
            <p class="text-sm">
              {{ selectedMatchTeams[0].teamName ?? `Team #${selectedMatchTeams[0].teamId}` }} vs
              {{ selectedMatchTeams[1].teamName ?? `Team #${selectedMatchTeams[1].teamId}` }}
            </p>

            <div class="grid grid-cols-2 gap-2">
              <input
                v-model.number="scoreForm.homeScore"
                type="number"
                min="0"
                class="rounded border px-3 py-2"
                aria-label="Home score"
              />
              <input
                v-model.number="scoreForm.awayScore"
                type="number"
                min="0"
                class="rounded border px-3 py-2"
                aria-label="Away score"
              />
            </div>
            <p v-if="scoreValidation.errors.value.homeScore?.length" class="text-xs text-red-700">
              {{ scoreValidation.errors.value.homeScore[0] }}
            </p>
            <p v-if="scoreValidation.errors.value.awayScore?.length" class="text-xs text-red-700">
              {{ scoreValidation.errors.value.awayScore[0] }}
            </p>
            <p v-if="scoreValidation.errors.value.awayTeamId?.length" class="text-xs text-red-700">
              {{ scoreValidation.errors.value.awayTeamId[0] }}
            </p>

            <button type="button" class="rounded bg-night px-3 py-2 text-sm text-white" @click="submitScore">
              Update Match Score
            </button>
          </div>

          <div class="mt-5 border-t pt-4">
            <h4 class="font-semibold text-night">Match Player Stats</h4>
            <p class="text-sm muted">Add players to selected match and manage goals.</p>

            <div class="mt-2 grid gap-2 md:grid-cols-3">
              <select v-model.number="selectedPlayerId" class="rounded border px-3 py-2" aria-label="Select player">
                <option :value="null">Select player</option>
                <option v-for="player in playerOptions" :key="player.id" :value="player.id">
                  {{ player.name }} (team {{ player.teamId ?? '-' }})
                </option>
              </select>
              <input
                v-model.number="newPlayerGoals"
                type="number"
                min="0"
                class="rounded border px-3 py-2"
                aria-label="Initial player goals"
                placeholder="Initial goals"
              />
              <button type="button" class="rounded border px-3 py-2 text-sm" @click="addMatchPlayer">
                Add Match Player
              </button>
            </div>

            <LoadingState v-if="matchPlayersRequest.isLoading.value" message="Loading match players..." />
            <ErrorState
              v-else-if="matchPlayersRequest.error.value"
              title="Match Players"
              :message="matchPlayersRequest.error.value ?? ''"
              retry-label="Retry match players"
              @retry="matchPlayersRequest.retry"
            />

            <div v-else class="mt-3 overflow-auto">
              <table class="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr>
                    <th class="py-2 pr-3">Player</th>
                    <th class="py-2 pr-3">Goals</th>
                    <th class="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in matchPlayers" :key="row.id" class="border-t border-slate-200/70">
                    <td class="py-2 pr-3">{{ row.playerName ?? `Player #${row.playerId}` }}</td>
                    <td class="py-2 pr-3">
                      <input
                        v-model.number="matchPlayerGoalsDraft[row.playerId]"
                        type="number"
                        min="0"
                        class="w-24 rounded border px-2 py-1"
                        :aria-label="`Goals for ${row.playerName ?? row.playerId}`"
                      />
                    </td>
                    <td class="py-2">
                      <div class="flex gap-2">
                        <button
                          type="button"
                          class="rounded border px-2 py-1 text-xs"
                          @click="updateMatchPlayerGoals(row.playerId)"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          class="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                          @click="removeMatchPlayer(row.playerId)"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </article>
    </section>

    <article class="panel">
      <LoadingState v-if="usersPanelRequest.isLoading.value" message="Loading user management..." />
      <ErrorState
        v-else-if="usersPanelRequest.error.value"
        title="User Panel"
        :message="usersPanelRequest.error.value ?? ''"
        retry-label="Retry users"
        @retry="usersPanelRequest.retry"
      />
      <template v-else>
        <h3 class="section-title">User Management</h3>

        <form class="grid gap-2 md:grid-cols-5" @submit.prevent="createUser">
          <input
            v-model="userForm.name"
            class="rounded border px-3 py-2"
            placeholder="Name"
            aria-label="User name"
            required
            @blur="userValidation.validateField(userForm, 'name')"
          />
          <input
            v-model="userForm.email"
            type="email"
            class="rounded border px-3 py-2"
            placeholder="Email"
            aria-label="User email"
            required
            @blur="userValidation.validateField(userForm, 'email')"
          />
          <input
            v-model="userForm.password"
            type="password"
            minlength="8"
            class="rounded border px-3 py-2"
            placeholder="Password"
            aria-label="User password"
            required
            @blur="userValidation.validateField(userForm, 'password')"
          />
          <select v-model="userForm.role" class="rounded border px-3 py-2" aria-label="User role">
            <option value="player">player</option>
            <option value="admin">admin</option>
          </select>
          <select v-model="userForm.teamId" class="rounded border px-3 py-2" aria-label="User team assignment">
            <option value="">No team</option>
            <option v-for="team in teams" :key="team.id" :value="String(team.id)">
              {{ team.name }}
            </option>
          </select>

          <p v-if="userValidation.errors.value.name?.length" class="text-xs text-red-700">
            {{ userValidation.errors.value.name[0] }}
          </p>
          <p v-if="userValidation.errors.value.email?.length" class="text-xs text-red-700">
            {{ userValidation.errors.value.email[0] }}
          </p>
          <p v-if="userValidation.errors.value.password?.length" class="text-xs text-red-700">
            {{ userValidation.errors.value.password[0] }}
          </p>
          <p v-if="userValidation.errors.value.teamId?.length" class="text-xs text-red-700">
            {{ userValidation.errors.value.teamId[0] }}
          </p>

          <button type="submit" class="rounded bg-night px-3 py-2 text-sm text-white md:col-span-5">
            Create User
          </button>
        </form>

        <div class="mt-4 overflow-auto">
          <table class="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr>
                <th class="py-2 pr-3">Name</th>
                <th class="py-2 pr-3">Email</th>
                <th class="py-2 pr-3">Role</th>
                <th class="py-2 pr-3">Team</th>
                <th class="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id" class="border-t border-slate-200/70">
                <td class="py-2 pr-3">{{ user.name }}</td>
                <td class="py-2 pr-3">{{ user.email }}</td>
                <td class="py-2 pr-3">{{ user.role }}</td>
                <td class="py-2 pr-3">{{ user.teamId ?? '-' }}</td>
                <td class="py-2">
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="rounded border px-2 py-1 text-xs"
                      @click="promoteToAdmin(user)"
                    >
                      Make admin
                    </button>
                    <button
                      type="button"
                      class="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                      @click="deleteUser(user.id)"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </article>
  </section>
</template>
