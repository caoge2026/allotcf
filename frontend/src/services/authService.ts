import http from './http'

export interface AuthResponse {
  token: string
  email: string
  nickname: string
  userType?: 'REGISTERED' | 'GUEST'
  guestActionCount?: number
  guestActionLimit?: number
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await http.post<AuthResponse>('/auth/login', { email, password })
  return response.data
}

export async function loginAsGuest(): Promise<AuthResponse> {
  const response = await http.post<AuthResponse>('/auth/guest')
  return response.data
}

export async function register(email: string, password: string, nickname: string): Promise<void> {
  await http.post('/auth/register', { email, password, nickname })
}
