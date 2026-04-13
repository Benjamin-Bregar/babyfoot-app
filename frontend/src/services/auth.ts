import type { ApiResponse, AuthResponse, User } from '@/types'
import { http } from './http'

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  name: string
  email: string
  password: string
  teamId?: number | null
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await http.post<ApiResponse<AuthResponse>>('/auth/register', payload)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Registration failed')
    }

    return data.data
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await http.post<ApiResponse<AuthResponse>>('/auth/login', payload)

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Login failed')
    }

    return data.data
  },

  async me(): Promise<User> {
    const { data } = await http.get<ApiResponse<{ user: User }>>('/auth/me')

    if (!data.data) {
      throw new Error(data.error?.message ?? 'Could not load current user')
    }

    return data.data.user
  },
}
