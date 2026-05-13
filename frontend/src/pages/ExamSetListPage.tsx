import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StudyTabs from '../components/StudyTabs'
import { listExamSets } from '../services/examSetService'
import { startPractice } from '../services/practiceService'
import type { ExamSet } from '../types'
import { clearExamSetDraft, examSetDraftStorageKey, readCompletedPractice, readSavedDraft } from '../utils/practicePersistence'

const PAGE_SIZE = 10

function seedDraftFromServerProgress(examSet: ExamSet) {
  if (!examSet.answersJson) {
    return
  }

  try {
    const parsed = JSON.parse(examSet.answersJson) as Array<{
      questionId?: number
      userAnswer?: string
      timeSpentSeconds?: number
    }>
    const answers = parsed.reduce<Record<number, { answer: string; timeSpent: number }>>((acc, item) => {
      if (
        Number.isFinite(item.questionId) &&
        typeof item.userAnswer === 'string' &&
        item.userAnswer.trim() !== ''
      ) {
        acc[item.questionId] = {
          answer: item.userAnswer,
          timeSpent: item.timeSpentSeconds ?? 0,
        }
      }
      return acc
    }, {})

    localStorage.setItem(
      examSetDraftStorageKey(examSet.id),
      JSON.stringify({
        startedAt: Date.now(),
        currentIndex: examSet.currentIndex ?? 0,
        answers,
        pausedRemainingSeconds: examSet.pausedRemainingSeconds ?? undefined,
      }),
    )
  } catch {
    localStorage.removeItem(examSetDraftStorageKey(examSet.id))
  }
}

export default function ExamSetListPage() {
  const [examSets, setExamSets] = useState<ExamSet[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [discardingExamSetId, setDiscardingExamSetId] = useState<number | null>(null)
  const [loadError, setLoadError] = useState('')
  const [startError, setStartError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    listExamSets()
      .then((data) => {
        setExamSets(data)
        setPage(1)
      })
      .catch(() => {
        setLoadError('题库加载失败，请重新登录或稍后重试。')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleStart = async (examSetId: number) => {
    setStarting(examSetId)
    setStartError('')
    try {
      const { sessionId } = await startPractice(examSetId)
      navigate(`/practice/${sessionId}`, { state: { examSetId } })
    } catch {
      setStartError('进入练习失败，请确认网络和后端服务正常后重试。')
    } finally {
      setStarting(null)
    }
  }

  const handleViewReview = (sessionId: number, examSetId: number) => {
    navigate(`/practice/${sessionId}`, { state: { examSetId, reviewMode: true } })
  }

  const handleOpenDiscardDialog = (examSetId: number) => {
    setDiscardingExamSetId(examSetId)
  }

  const handleCloseDiscardDialog = () => {
    setDiscardingExamSetId(null)
  }

  const handleConfirmDiscard = async () => {
    if (discardingExamSetId === null) {
      return
    }

    clearExamSetDraft(discardingExamSetId)
    setDiscardingExamSetId(null)
    await handleStart(discardingExamSetId)
  }

  if (loading) {
    return <div className="loading-view">加载中...</div>
  }

  const totalPages = Math.max(1, Math.ceil(examSets.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedExamSets = examSets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="app-shell">
      <section className="page-panel">
        <StudyTabs subject="reading" task="examSets" />

        {loadError ? <div className="form-error catalog-start-error">{loadError}</div> : null}

        {!loadError && examSets.length === 0 ? (
          <div className="empty-view">暂无题库，稍后导入后这里会显示可练习的套题。</div>
        ) : null}

        {startError ? <div className="form-error catalog-start-error">{startError}</div> : null}

        <div className="catalog-grid">
          {pagedExamSets.map((examSet, index) => {
            const absoluteIndex = (currentPage - 1) * PAGE_SIZE + index
            const serverStatus = examSet.practiceStatus
            const completion = serverStatus ? undefined : readCompletedPractice(examSet.id)
            const draft = serverStatus ? undefined : readSavedDraft(examSet.id)
            const hasNewerDraft =
              completion !== undefined &&
              draft !== undefined &&
              draft.startedAt > completion.completedAt
            const hasDraft = serverStatus === 'IN_PROGRESS' || (draft !== undefined && (completion === undefined || hasNewerDraft))
            const isCompleted = serverStatus === 'COMPLETED' || (completion !== undefined && !hasDraft)
            const resumeProgress = hasDraft
              ? Math.min((examSet.currentIndex ?? draft?.currentIndex ?? 0) + 1, examSet.questionCount)
              : null

            return (
              <article
                key={examSet.id}
                className={[
                  'catalog-card',
                  !hasDraft && !isCompleted ? 'catalog-card-fresh' : '',
                  hasDraft ? 'catalog-card-resume' : '',
                  isCompleted ? 'catalog-card-completed' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div>
                  <div className="catalog-card-topline">
                    <p className="page-kicker">Serie {String(absoluteIndex + 1).padStart(2, '0')}</p>
                  </div>
                  <div className="catalog-card-heading">
                    <h2 className="catalog-card-title">{examSet.title}</h2>
                    {isCompleted ? (
                      <span className="catalog-status-badge completed">
                        <span className="catalog-status-icon" aria-hidden="true">✓</span>
                        <span>已完成，可查看最近一次复盘</span>
                      </span>
                    ) : null}
                  </div>
                  {hasDraft && resumeProgress !== null ? (
                    <p className="catalog-card-resume-note">上次进度 {resumeProgress}/{examSet.questionCount}</p>
                  ) : null}
                  {isCompleted && completion?.score !== undefined && completion?.nclcLevelLabel ? (
                    <p className="catalog-card-completed-summary">
                      上次得分 {completion.score} 分，{completion.nclcLevelLabel}
                    </p>
                  ) : null}
                  {isCompleted && serverStatus === 'COMPLETED' && examSet.score !== null && examSet.score !== undefined && examSet.nclcLevelLabel ? (
                    <p className="catalog-card-completed-summary">
                      上次得分 {examSet.score} 分，{examSet.nclcLevelLabel}
                    </p>
                  ) : null}
                </div>
                <div className="catalog-card-actions">
                  <button
                    className={[
                      'chapter-button',
                      hasDraft ? 'chapter-button-resume' : '',
                      isCompleted ? 'chapter-button-completed' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => {
                      const reviewSessionId = examSet.latestSessionId ?? completion?.sessionId
                      if (isCompleted && reviewSessionId) {
                        handleViewReview(reviewSessionId, examSet.id)
                        return
                      }
                      if (hasDraft && examSet.latestSessionId) {
                        seedDraftFromServerProgress(examSet)
                        navigate(`/practice/${examSet.latestSessionId}`, { state: { examSetId: examSet.id } })
                        return
                      }
                      void handleStart(examSet.id)
                    }}
                    disabled={starting === examSet.id}
                  >
                    {starting === examSet.id ? '进入中...' : hasDraft ? '继续作答' : isCompleted ? '查看复盘' : '开始练习'}
                  </button>
                  {hasDraft ? (
                    <button
                      type="button"
                      className="ghost-button catalog-discard-button"
                      onClick={() => handleOpenDiscardDialog(examSet.id)}
                      disabled={starting === examSet.id}
                    >
                      放弃进度
                    </button>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>

        {totalPages > 1 ? (
          <div className="catalog-pagination">
            <button
              type="button"
              className="ghost-button catalog-page-button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
            >
              上一页
            </button>
            <div className="catalog-page-numbers" aria-label="分页">
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    className={`catalog-page-number${pageNumber === currentPage ? ' active' : ''}`}
                    onClick={() => setPage(pageNumber)}
                    aria-current={pageNumber === currentPage ? 'page' : undefined}
                  >
                    {pageNumber}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              className="ghost-button catalog-page-button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage === totalPages}
            >
              下一页
            </button>
          </div>
        ) : null}

        {discardingExamSetId !== null ? (
          <div className="dialog-scrim" role="presentation">
            <section
              className="page-panel confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="discard-dialog-title"
            >
              <p className="page-kicker">放弃进度</p>
              <h2 id="discard-dialog-title" className="confirm-dialog-title">
                是否清空当前进度并重新开始？
              </h2>
              <p className="confirm-dialog-copy">
                当前这套题的本地草稿将被删除，并从第 1 题重新开始计时。
              </p>
              <div className="confirm-dialog-actions">
                <button
                  type="button"
                  className="ghost-button confirm-dialog-secondary"
                  onClick={handleCloseDiscardDialog}
                >
                  继续保留
                </button>
                <button
                  type="button"
                  className="primary-button confirm-dialog-primary"
                  onClick={() => void handleConfirmDiscard()}
                >
                  清空进度并开始
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </div>
  )
}
