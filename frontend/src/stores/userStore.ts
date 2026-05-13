import { create } from 'zustand'

interface UserState {
  token: string | null
  email: string | null
  nickname: string | null
  userType: 'REGISTERED' | 'GUEST' | null
  guestActionCount: number | null
  guestActionLimit: number | null
  setUser: (
    token: string,
    email: string,
    nickname: string,
    options?: {
      userType?: 'REGISTERED' | 'GUEST'
      guestActionCount?: number
      guestActionLimit?: number
    }
  ) => void
  recordGuestAction: () => void
  logout: () => void
  isLoggedIn: () => boolean
}

export const useUserStore = create<UserState>((set, get) => ({
  token: localStorage.getItem('token'),
  email: localStorage.getItem('userEmail'),
  nickname: localStorage.getItem('userNickname'),
  userType: (localStorage.getItem('userType') as 'REGISTERED' | 'GUEST' | null) ?? null,
  guestActionCount: localStorage.getItem('guestActionCount') ? Number(localStorage.getItem('guestActionCount')) : null,
  guestActionLimit: localStorage.getItem('guestActionLimit') ? Number(localStorage.getItem('guestActionLimit')) : null,

  setUser: (token, email, nickname, options) => {
    const userType = options?.userType ?? 'REGISTERED'
    localStorage.setItem('token', token)
    localStorage.setItem('userEmail', email)
    localStorage.setItem('userNickname', nickname)
    localStorage.setItem('userType', userType)

    if (options?.guestActionCount !== undefined) {
      localStorage.setItem('guestActionCount', String(options.guestActionCount))
    } else {
      localStorage.removeItem('guestActionCount')
    }

    if (options?.guestActionLimit !== undefined) {
      localStorage.setItem('guestActionLimit', String(options.guestActionLimit))
    } else {
      localStorage.removeItem('guestActionLimit')
    }

    set({
      token,
      email,
      nickname,
      userType,
      guestActionCount: options?.guestActionCount ?? null,
      guestActionLimit: options?.guestActionLimit ?? null,
    })
  },

  recordGuestAction: () => {
    const state = get()
    if (state.userType !== 'GUEST') {
      return
    }

    const nextCount = (state.guestActionCount ?? 0) + 1
    localStorage.setItem('guestActionCount', String(nextCount))
    set({ guestActionCount: nextCount })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userNickname')
    localStorage.removeItem('userType')
    localStorage.removeItem('guestActionCount')
    localStorage.removeItem('guestActionLimit')
    set({
      token: null,
      email: null,
      nickname: null,
      userType: null,
      guestActionCount: null,
      guestActionLimit: null,
    })
  },

  isLoggedIn: () => !!get().token,
}))
