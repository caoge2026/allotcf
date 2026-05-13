import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/authService'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    try {
      await register(email, password, nickname)
      navigate('/login')
    } catch {
      setError('注册失败，邮箱可能已被使用')
    }
  }

  return (
    <div className="auth-layout">
      <section className="page-panel auth-hero">
        <div className="page-kicker">Nouveau Dossier</div>
        <h1 className="page-title">开始你的阅读档案</h1>
        <p className="page-subtitle">
          新建一个专属练习身份，把每一次阅读题都留在同一条备考轨迹里。目标很简单：安静地做题，稳定地提分。
        </p>
        <div className="auth-copy-block">
          <p>注册只需要邮箱和密码。昵称是选填，用来标注你的练习身份。</p>
          <p>创建完成后会回到登录页，然后就可以直接进入题库目录。</p>
        </div>
      </section>

      <section className="page-panel auth-card">
        <div className="page-kicker">Inscription</div>
        <h2 className="question-title">登记新的练习册</h2>
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
            <input
              className="editorial-input"
              type="text"
              placeholder="昵称（选填）"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
            />
          </div>
          {error ? <p className="status-message error">{error}</p> : null}
          <button className="primary-button" type="submit">
            注册
          </button>
        </form>
        <p className="auth-footer">
          已有账号？<Link to="/login">登录</Link>
        </p>
      </section>
    </div>
  )
}
