import { beforeEach, describe, expect, it } from 'vitest'
import { useUserStore } from '../../stores/userStore'

describe('userStore', () => {
  beforeEach(() => {
    useUserStore.setState({
      token: null,
      email: null,
      nickname: null,
      userType: null,
      guestActionCount: null,
      guestActionLimit: null,
    })
    localStorage.clear()
  })

  it('setUser stores user info and token', () => {
    useUserStore.getState().setUser('tok123', 'a@b.com', 'Alice')
    const state = useUserStore.getState()

    expect(state.token).toBe('tok123')
    expect(state.email).toBe('a@b.com')
    expect(state.nickname).toBe('Alice')
  })

  it('logout clears user info', () => {
    useUserStore.getState().setUser('tok123', 'a@b.com', 'Alice')
    useUserStore.getState().logout()
    const state = useUserStore.getState()

    expect(state.token).toBeNull()
    expect(state.email).toBeNull()
  })

  it('isLoggedIn returns true when token exists', () => {
    useUserStore.getState().setUser('tok123', 'a@b.com', 'Alice')

    expect(useUserStore.getState().isLoggedIn()).toBe(true)
  })

  it('stores guest preview metadata', () => {
    useUserStore.getState().setUser('tok123', 'guest@guest.allotcf', '访客用户', {
      userType: 'GUEST',
      guestActionCount: 2,
      guestActionLimit: 10,
    })

    const state = useUserStore.getState()

    expect(state.userType).toBe('GUEST')
    expect(state.guestActionCount).toBe(2)
    expect(state.guestActionLimit).toBe(10)
    expect(localStorage.getItem('userType')).toBe('GUEST')
    expect(localStorage.getItem('guestActionCount')).toBe('2')
    expect(localStorage.getItem('guestActionLimit')).toBe('10')
  })
})
