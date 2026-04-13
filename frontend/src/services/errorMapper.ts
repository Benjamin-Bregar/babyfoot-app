import type { AxiosError } from 'axios'
import type { ApiError, ApiResponse } from '@/types'

export const mapApiError = (error: unknown): ApiError => {
  const fallback: ApiError = {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred. Please try again.',
  }

  const axiosError = error as AxiosError<ApiResponse<unknown>>
  const serverError = axiosError.response?.data?.error

  if (serverError?.message && serverError?.code) {
    return {
      ...serverError,
      details: serverError.details,
    }
  }

  if (!axiosError.response) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error. Check your connection and retry.',
    }
  }

  if (axiosError.response?.status === 401) {
    return { code: 'UNAUTHORIZED', message: 'Your session is no longer valid.' }
  }

  if (axiosError.response?.status === 403) {
    return { code: 'FORBIDDEN', message: 'You are not allowed to perform this action.' }
  }

  if (axiosError.response?.status === 404) {
    return { code: 'NOT_FOUND', message: 'The requested resource was not found.' }
  }

  if (axiosError.response?.status === 400) {
    return { code: 'BAD_REQUEST', message: 'One or more fields are invalid.' }
  }

  if (axiosError.response?.status && axiosError.response.status >= 500) {
    return { code: 'SERVER_ERROR', message: 'Server error. Please retry shortly.' }
  }

  return fallback
}
