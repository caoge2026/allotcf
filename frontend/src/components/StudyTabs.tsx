import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'

interface StudyTabsProps {
  subject: 'reading' | 'listening' | 'speaking'
  task?: 'examSets' | 'wrongQuestions' | 'bookmarkedQuestions' | 'wordMatch'
}

export default function StudyTabs({ subject, task }: StudyTabsProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useUserStore((state) => state.logout)
  const nickname = useUserStore((state) => state.nickname)
  const userType = useUserStore((state) => state.userType)
  const guestActionCount = useUserStore((state) => state.guestActionCount)
  const guestActionLimit = useUserStore((state) => state.guestActionLimit)

  const isReading = subject === 'reading'
  const isSpeaking = subject === 'speaking'
  const isGuest = userType === 'GUEST'
  const remainingGuestActions = guestActionLimit == null
    ? null
    : Math.max(guestActionLimit - (guestActionCount ?? 0), 0)

  return (
    <div className="study-shell-header">
      <div className="page-header">
        <div>
          <p className="page-kicker">Bibliotheque TCF</p>
          <h1 className="page-title">
            {isReading ? '阅读 Compréhension écrite' : isSpeaking ? '口语 Expression orale' : '听力 Compréhension orale'}
          </h1>
        </div>
        <div className="user-box">
          <span className="user-chip">
            {isGuest ? '访客预览' : nickname || '用户'}
            {isGuest && remainingGuestActions != null ? ` · 剩余 ${remainingGuestActions} 次` : ''}
          </span>
          <button
            className="ghost-button"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            退出
          </button>
        </div>
      </div>

      <div className="study-tabs">
        <div className="study-tab-row" role="tablist" aria-label="科目">
          <NavLink
            to="/exam-sets"
            className={`study-tab${isReading ? ' active' : ''}`}
          >
            阅读
          </NavLink>
          <NavLink
            to="/listening"
            className={`study-tab${subject === 'listening' ? ' active' : ''}`}
          >
            听力
          </NavLink>
          <NavLink
            to="/picture-speaking"
            className={`study-tab${isSpeaking ? ' active' : ''}`}
          >
            口语
          </NavLink>
        </div>

        {isReading ? (
          <div className="study-subtab-row" role="tablist" aria-label="学习任务">
            <NavLink
              to="/exam-sets"
              className={`study-subtab${task === 'examSets' || location.pathname === '/exam-sets' ? ' active' : ''}`}
            >
              套题练习
            </NavLink>
            <NavLink
              to="/wrong-questions"
              className={`study-subtab${task === 'wrongQuestions' || location.pathname === '/wrong-questions' ? ' active' : ''}`}
            >
              错题复习
            </NavLink>
            <NavLink
              to="/bookmarked-questions"
              className={`study-subtab${task === 'bookmarkedQuestions' || location.pathname === '/bookmarked-questions' ? ' active' : ''}`}
            >
              收藏练习
            </NavLink>
            <NavLink
              to="/word-match"
              className={`study-subtab${task === 'wordMatch' || location.pathname === '/word-match' ? ' active' : ''}`}
            >
              单词连连看
            </NavLink>
          </div>
        ) : null}
      </div>
    </div>
  )
}
