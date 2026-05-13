import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginPage from '../../pages/LoginPage'
import * as authService from '../../services/authService'
import { useUserStore } from '../../stores/userStore'

vi.mock('../../services/authService')

const renderLogin = (initialEntries = ['/login']) => render(
  <MemoryRouter initialEntries={initialEntries}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/exam-sets" element={<div>题库页</div>} />
      <Route path="/bookmarked-questions" element={<div>收藏练习页</div>} />
      <Route path="/word-match" element={<div>单词连连看页</div>} />
    </Routes>
  </MemoryRouter>,
)

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useUserStore.getState().logout()
  })

  it('renders email and password inputs', () => {
    renderLogin()

    expect(screen.getByRole('img', { name: 'AllôTCF' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '打开阅读套题' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '打开错题复习' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '打开收藏练习' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '打开单词连连看' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/邮箱/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/密码/i)).toBeInTheDocument()
  })

  it('guides unauthenticated users when they click a quick menu tile', () => {
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: '打开收藏练习' }))

    expect(screen.getByText(/想进入「收藏练习」的话，请先登录/)).toBeInTheDocument()
  })

  it('calls login on submit', async () => {
    const mockLogin = vi.spyOn(authService, 'login').mockResolvedValue({
      token: 'tok',
      email: 'a@b.com',
      nickname: 'Alice',
      userType: 'REGISTERED',
    })

    renderLogin()

    fireEvent.change(screen.getByPlaceholderText(/邮箱/i), {
      target: { value: 'a@b.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/密码/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /登录/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('a@b.com', 'password123')
    })
  })

  it('stays on login page after login and navigates only when a quick menu is clicked', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue({
      token: 'tok',
      email: 'a@b.com',
      nickname: 'Alice',
      userType: 'REGISTERED',
    })

    renderLogin()

    fireEvent.change(screen.getByPlaceholderText(/邮箱/i), {
      target: { value: 'a@b.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/密码/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: '登录' }))

    await waitFor(() => {
      expect(screen.getByText(/已登录。现在可以从左侧快捷功能区选择/)).toBeInTheDocument()
    })
    expect(screen.queryByText('题库页')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '打开收藏练习' }))

    expect(await screen.findByText('收藏练习页')).toBeInTheDocument()
  })

  it('starts guest preview from login page', async () => {
    const mockGuestLogin = vi.spyOn(authService, 'loginAsGuest').mockResolvedValue({
      token: 'guest-token',
      email: 'guest_abc@guest.allotcf',
      nickname: '访客用户',
      userType: 'GUEST',
      guestActionCount: 0,
      guestActionLimit: 10,
    })

    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: '访客预览' }))

    await waitFor(() => {
      expect(mockGuestLogin).toHaveBeenCalled()
      expect(localStorage.getItem('token')).toBe('guest-token')
      expect(localStorage.getItem('userType')).toBe('GUEST')
      expect(localStorage.getItem('guestActionLimit')).toBe('10')
    })
  })

  it('shows detailed error message in development when login fails', async () => {
    vi.spyOn(authService, 'login').mockRejectedValue(new Error('代理连接失败'))

    renderLogin()

    fireEvent.change(screen.getByPlaceholderText(/邮箱/i), {
      target: { value: 'a@b.com' },
    })
    fireEvent.change(screen.getByPlaceholderText(/密码/i), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /登录/i }))

    await waitFor(() => {
      expect(screen.getByText(/开发环境错误：代理连接失败/i)).toBeInTheDocument()
    })
  })
})
