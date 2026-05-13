import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DEFAULT_MESSAGE = '访客预览次数已用完，注册或登录后可继续保存进度、复盘错题和收藏题目。'

export default function GuestLimitDialog() {
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handleGuestLimit = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>
      setMessage(customEvent.detail?.message || DEFAULT_MESSAGE)
    }

    window.addEventListener('allotcf:guest-limit-reached', handleGuestLimit)
    return () => window.removeEventListener('allotcf:guest-limit-reached', handleGuestLimit)
  }, [])

  if (!message) {
    return null
  }

  return (
    <div className="dialog-scrim" role="presentation">
      <section
        className="page-panel confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-limit-dialog-title"
      >
        <p className="page-kicker">访客预览</p>
        <h2 id="guest-limit-dialog-title" className="confirm-dialog-title">
          访客预览次数已用完
        </h2>
        <p className="confirm-dialog-copy">{message}</p>
        <div className="confirm-dialog-actions">
          <button
            className="ghost-button confirm-dialog-secondary"
            type="button"
            onClick={() => setMessage('')}
          >
            继续浏览
          </button>
          <button
            className="primary-button confirm-dialog-primary"
            type="button"
            onClick={() => {
              setMessage('')
              navigate('/register')
            }}
          >
            去注册
          </button>
        </div>
      </section>
    </div>
  )
}
