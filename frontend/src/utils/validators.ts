import type { FieldErrors } from '@/types/validation'
import { validationRules } from './validationRules'

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const isIsoDate = (value: string): boolean => !Number.isNaN(Date.parse(value))

const isPositiveInteger = (value: number): boolean => Number.isInteger(value) && value > 0

interface LoginValues {
  email: string
  password: string
}

interface TournamentValues {
  name: string
  startDate: string
  endDate: string
  description: string
}

interface UserValues {
  name: string
  email: string
  password: string
  role: 'admin' | 'player'
  teamId: string
}

interface ScoreValues {
  homeTeamId: number
  awayTeamId: number
  homeScore: number
  awayScore: number
}

export const validateLogin = (values: LoginValues): FieldErrors<'email' | 'password'> => {
  const errors: FieldErrors<'email' | 'password'> = {}

  if (!values.email.trim()) {
    errors.email = ['Email is required.']
  } else {
    if (values.email.length > validationRules.auth.emailMax) {
      errors.email = [`Email must be at most ${validationRules.auth.emailMax} characters.`]
    } else if (!isValidEmail(values.email)) {
      errors.email = ['Enter a valid email address.']
    }
  }

  if (!values.password) {
    errors.password = ['Password is required.']
  } else {
    if (values.password.length < validationRules.auth.passwordMin) {
      errors.password = [`Password must be at least ${validationRules.auth.passwordMin} characters.`]
    } else if (values.password.length > validationRules.auth.passwordMax) {
      errors.password = [`Password must be at most ${validationRules.auth.passwordMax} characters.`]
    }
  }

  return errors
}

export const validateTournamentForm = (
  values: TournamentValues,
): FieldErrors<'name' | 'startDate' | 'endDate' | 'description'> => {
  const errors: FieldErrors<'name' | 'startDate' | 'endDate' | 'description'> = {}

  const name = values.name.trim()
  if (!name) {
    errors.name = ['Tournament name is required.']
  } else if (name.length < validationRules.tournament.nameMin || name.length > validationRules.tournament.nameMax) {
    errors.name = [
      `Tournament name must be between ${validationRules.tournament.nameMin} and ${validationRules.tournament.nameMax} characters.`,
    ]
  }

  if (!values.startDate) {
    errors.startDate = ['Start date is required.']
  } else if (!isIsoDate(values.startDate)) {
    errors.startDate = ['Start date must be a valid ISO date.']
  }

  if (values.endDate && !isIsoDate(values.endDate)) {
    errors.endDate = ['End date must be a valid ISO date.']
  }

  if (values.endDate && values.startDate && values.endDate < values.startDate) {
    errors.endDate = ['End date must be greater than or equal to start date.']
  }

  if (values.description && values.description.trim().length > validationRules.tournament.descriptionMax) {
    errors.description = [`Description must be at most ${validationRules.tournament.descriptionMax} characters.`]
  }

  return errors
}

export const validateUserForm = (values: UserValues): FieldErrors<'name' | 'email' | 'password' | 'role' | 'teamId'> => {
  const errors: FieldErrors<'name' | 'email' | 'password' | 'role' | 'teamId'> = {}

  const name = values.name.trim()
  if (!name) {
    errors.name = ['Name is required.']
  } else if (name.length < validationRules.user.nameMin || name.length > validationRules.user.nameMax) {
    errors.name = [`Name must be between ${validationRules.user.nameMin} and ${validationRules.user.nameMax} characters.`]
  }

  if (!values.email.trim()) {
    errors.email = ['Email is required.']
  } else if (!isValidEmail(values.email) || values.email.length > validationRules.user.emailMax) {
    errors.email = ['Enter a valid email address (max 255 characters).']
  }

  if (!values.password) {
    errors.password = ['Password is required.']
  } else if (
    values.password.length < validationRules.user.passwordMin ||
    values.password.length > validationRules.user.passwordMax
  ) {
    errors.password = [`Password must be between ${validationRules.user.passwordMin} and ${validationRules.user.passwordMax} characters.`]
  }

  if (values.role !== 'admin' && values.role !== 'player') {
    errors.role = ['Role must be admin or player.']
  }

  if (values.teamId) {
    const teamIdNumber = Number(values.teamId)
    if (!isPositiveInteger(teamIdNumber)) {
      errors.teamId = ['Team ID must be a positive integer.']
    }
  }

  return errors
}

export const validateScoreForm = (
  values: ScoreValues,
): FieldErrors<'homeScore' | 'awayScore' | 'homeTeamId' | 'awayTeamId'> => {
  const errors: FieldErrors<'homeScore' | 'awayScore' | 'homeTeamId' | 'awayTeamId'> = {}

  if (!isPositiveInteger(values.homeTeamId)) {
    errors.homeTeamId = ['Home team ID must be a positive integer.']
  }

  if (!isPositiveInteger(values.awayTeamId)) {
    errors.awayTeamId = ['Away team ID must be a positive integer.']
  }

  if (values.homeTeamId === values.awayTeamId) {
    errors.awayTeamId = ['Home and away team must be different.']
  }

  if (!Number.isInteger(values.homeScore) || values.homeScore < validationRules.score.goalsMin) {
    errors.homeScore = ['Home score must be an integer greater than or equal to 0.']
  }

  if (!Number.isInteger(values.awayScore) || values.awayScore < validationRules.score.goalsMin) {
    errors.awayScore = ['Away score must be an integer greater than or equal to 0.']
  }

  return errors
}

export const hasErrors = (errors: FieldErrors): boolean => {
  return Object.keys(errors).length > 0
}
