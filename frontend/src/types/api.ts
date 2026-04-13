export type UserRole = 'admin' | 'player'

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
}

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
  meta?: {
    pagination?: PaginationMeta
  }
}

export interface PaginatedResult<T> {
  items: T[]
  pagination: PaginationMeta | null
}

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  teamId: number | null
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Team {
  id: number
  name: string
}

export interface UserMutationPayload {
  name: string
  email: string
  password?: string
  role: UserRole
  teamId?: number | null
}

export interface Tournament {
  id: number
  name: string
  startDate: string
  endDate: string | null
  description: string | null
}

export interface TournamentMutationPayload {
  name: string
  startDate: string
  endDate?: string | null
  description?: string | null
}

export interface TournamentTeam {
  id: number
  tournamentId: number
  teamId: number
  teamName: string | null
  played: number
  won: number
  drawn: number
  lost: number
  points: number
}

export interface MatchTeam {
  teamId: number
  teamName: string | null
  score: number | null
}

export interface Match {
  id: number
  tournamentId: number
  matchDate: string | null
  round: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  teams: MatchTeam[]
}

export interface MatchMutationPayload {
  tournamentId: number
  matchDate?: string | null
  round?: string | null
  status?: Match['status']
  teamIds?: number[]
}

export interface MatchUpdatePayload {
  matchDate?: string | null
  round?: string | null
  status?: Match['status']
}

export interface MatchPlayer {
  id: number
  matchId: number
  playerId: number
  playerName: string | null
  teamId: number | null
  goals: number
}

export interface MatchScorePayload {
  homeTeamId: number
  awayTeamId: number
  homeScore: number
  awayScore: number
}

export interface TournamentLeaderboardRow {
  teamId: number
  teamName: string | null
  played: number
  won: number
  drawn: number
  lost: number
  points: number
}

export interface GlobalPlayerLeaderboardRow {
  playerId: number
  name: string
  email: string
  teamId: number | null
  goals: number
  appearances: number
}

export interface TournamentLeaderboard {
  tournamentId: number
  standings: TournamentLeaderboardRow[]
}
