import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import allotcfLogo from '../assets/allotcf-logo.png'
import { login, loginAsGuest } from '../services/authService'
import { useUserStore } from '../stores/userStore'

const quickMenus = [
  {
    label: '阅读套题',
    detail: '完整进入 42 套阅读练习',
    path: '/exam-sets',
    tone: 'primary',
    size: 'wide',
    icon: 'Lire',
  },
  {
    label: '错题复习',
    detail: '按今日复习、错误次数和掌握状态回看',
    path: '/wrong-questions',
    tone: 'green',
    size: 'large',
    icon: 'Err',
  },
  {
    label: '收藏练习',
    detail: '集中练习自己标记的重要题',
    path: '/bookmarked-questions',
    tone: 'teal',
    size: 'small',
    icon: '+',
  },
  {
    label: '听力练习',
    detail: '预留听力入口，后续接入题库',
    path: '/listening',
    tone: 'blue',
    size: 'small',
    icon: 'Oral',
  },
  {
    label: '单词连连看',
    detail: '图片和法语单词配对消除',
    path: '/word-match',
    tone: 'mint',
    size: 'wide',
    icon: 'Mot',
  },
  {
    label: '看图说话',
    detail: '观察真实场景并获得 AI 对比反馈',
    path: '/picture-speaking',
    tone: 'green',
    size: 'wide',
    icon: 'Oral',
  },
  {
    label: '结果记录',
    detail: '查看最近提交与复盘状态',
    path: '/exam-sets',
    tone: 'soft',
    size: 'wide',
    icon: 'CLB',
  },
]

function getLoginErrorMessage(error: unknown): string {
  if (!import.meta.env.DEV) {
    return '邮箱或密码错误'
  }

  if (error instanceof Error && error.message) {
    return `开发环境错误：${error.message}`
  }

  return '开发环境错误：登录失败，请检查浏览器控制台或网络请求。'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [quickMenuHint, setQuickMenuHint] = useState('')
  const [isGuestLoading, setIsGuestLoading] = useState(false)
  const navigate = useNavigate()
  const setUser = useUserStore((state) => state.setUser)
  const isLoggedIn = useUserStore((state) => state.isLoggedIn())
  const nickname = useUserStore((state) => state.nickname)

  const handleQuickMenuClick = (label: string, path: string) => {
    if (isLoggedIn) {
      navigate(path)
      return
    }

    setQuickMenuHint(`想进入「${label}」的话，请先登录，或使用访客预览进入完整功能。`)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setQuickMenuHint('')

    try {
      const response = await login(email, password)
      setUser(response.token, response.email, response.nickname, {
        userType: response.userType,
        guestActionCount: response.guestActionCount,
        guestActionLimit: response.guestActionLimit,
      })
      setQuickMenuHint('已登录。现在可以从左侧快捷功能区选择要进入的学习功能。')
    } catch (error) {
      setError(getLoginErrorMessage(error))
    }
  }

  const handleGuestPreview = async () => {
    setError('')
    setQuickMenuHint('')
    setIsGuestLoading(true)

    try {
      const response = await loginAsGuest()
      setUser(response.token, response.email, response.nickname, {
        userType: response.userType,
        guestActionCount: response.guestActionCount,
        guestActionLimit: response.guestActionLimit,
      })
      setQuickMenuHint('已进入访客预览。现在可以从左侧快捷功能区选择要试用的功能。')
    } catch (error) {
      setError(getLoginErrorMessage(error))
    } finally {
      setIsGuestLoading(false)
    }
  }

  return (
    <div className="auth-layout login-layout">
      <section className="page-panel auth-hero login-hero">
        <div className="login-brand-mark" aria-label="AllôTCF">
          <img src={allotcfLogo} alt="AllôTCF" />
        </div>
        <div className="quick-tile-grid" aria-label="快捷功能区">
          {quickMenus.map((menu) => (
            <button
              key={menu.label}
              type="button"
              className={`quick-tile ${menu.size} ${menu.tone}`}
              onClick={() => handleQuickMenuClick(menu.label, menu.path)}
              aria-label={`打开${menu.label}`}
              data-path={menu.path}
            >
              <span className="quick-tile-icon">{menu.icon}</span>
              <span className="quick-tile-label">{menu.label}</span>
              <span className="quick-tile-detail">{menu.detail}</span>
            </button>
          ))}
        </div>
        {quickMenuHint ? <p className="quick-menu-hint">{quickMenuHint}</p> : null}
      </section>

      <section className="page-panel auth-card login-card">
        <div className="login-card-header compact">
          <div>
            <div className="page-kicker">Connexion</div>
            <h2 className="question-title login-card-title">登录</h2>
            <p className="login-card-copy">
              {isLoggedIn
                ? `${nickname || '你'} 已登录，请从左侧选择功能。`
                : '登录后停留在本页，你可以再从左侧快捷功能区选择入口。'}
            </p>
          </div>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field-stack">
            <input
              className="editorial-input"
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <input
              className="editorial-input"
              type="password"
              placeholder="密码"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="status-message error">{error}</p> : null}
          <button className="primary-button login-submit-button" type="submit">
            登录
          </button>
        </form>
        <div className="login-simple-actions">
          <button
            className="ghost-button"
            type="button"
            onClick={handleGuestPreview}
            disabled={isGuestLoading}
          >
            {isGuestLoading ? '正在进入访客预览' : '访客预览'}
          </button>
          <Link to="/register">注册账号</Link>
        </div>
      </section>
    </div>
  )
}
