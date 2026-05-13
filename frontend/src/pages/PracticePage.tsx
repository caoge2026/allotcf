import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import BookmarkToggle from '../components/BookmarkToggle'
import { getExamSetDetail } from '../services/examSetService'
import { getPracticeResult, savePracticeProgress, startPractice, submitPractice } from '../services/practiceService'
import { addBookmark, removeBookmark } from '../services/wrongQuestionService'
import { usePracticeStore } from '../stores/practiceStore'
import type { PracticeResult, QuestionResult } from '../types'
import {
  clearExamSetDraft,
  examSetDraftStorageKey,
  markExamSetCompleted,
} from '../utils/practicePersistence'

const TOTAL_SECONDS = 60 * 60

interface StoredAnswerEntry {
  answer: string
  timeSpent: number
}

interface StoredPracticeDraft {
  startedAt: number
  currentIndex: number
  answers: Record<number, StoredAnswerEntry>
  pausedRemainingSeconds?: number
}

function examSetStorageKey(sessionId: number) {
  return `practice-session-${sessionId}-exam-set-id`
}

function startedAtStorageKey(sessionId: number) {
  return `practice-session-${sessionId}-started-at`
}

function answersStorageKey(sessionId: number) {
  return `practice-session-${sessionId}-answers`
}

function isAnswerEntry(value: unknown): value is { answer: string; timeSpent: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { answer?: unknown }).answer === 'string' &&
    typeof (value as { timeSpent?: unknown }).timeSpent === 'number'
  )
}

function readStoredExamSetId(sessionId: number): number | undefined {
  const raw = localStorage.getItem(examSetStorageKey(sessionId))
  if (!raw) {
    return undefined
  }
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

function readStoredStartedAt(sessionId: number): number | undefined {
  const raw = localStorage.getItem(startedAtStorageKey(sessionId))
  if (!raw) {
    return undefined
  }
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

function readStoredAnswers(sessionId: number): Record<number, { answer: string; timeSpent: number }> {
  const raw = localStorage.getItem(answersStorageKey(sessionId))
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return Object.entries(parsed).reduce<Record<number, { answer: string; timeSpent: number }>>(
      (acc, [key, value]) => {
        const questionId = Number(key)
        if (Number.isFinite(questionId) && isAnswerEntry(value)) {
          acc[questionId] = value
        }
        return acc
      },
      {},
    )
  } catch {
    return {}
  }
}

function readStoredDraft(examSetId: number): StoredPracticeDraft | undefined {
  const raw = localStorage.getItem(examSetDraftStorageKey(examSetId))
  if (!raw) {
    return undefined
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const startedAt = Number(parsed.startedAt)
    const currentIndex = Number(parsed.currentIndex)
    const rawAnswers = parsed.answers

    if (
      !Number.isFinite(startedAt) ||
      !Number.isFinite(currentIndex) ||
      typeof rawAnswers !== 'object' ||
      rawAnswers === null
    ) {
      return undefined
    }

    const answers = Object.entries(rawAnswers as Record<string, unknown>).reduce<
      Record<number, StoredAnswerEntry>
    >((acc, [key, value]) => {
      const questionId = Number(key)
      if (Number.isFinite(questionId) && isAnswerEntry(value)) {
        acc[questionId] = value
      }
      return acc
    }, {})

    const pausedRemainingSeconds = Number(parsed.pausedRemainingSeconds)

    return {
      startedAt,
      currentIndex,
      answers,
      pausedRemainingSeconds: Number.isFinite(pausedRemainingSeconds)
        ? pausedRemainingSeconds
        : undefined,
    }
  } catch {
    return undefined
  }
}

function persistStoredAnswers(
  sessionId: number,
  answers: Record<number, { answer: string; timeSpent: number }>,
) {
  localStorage.setItem(answersStorageKey(sessionId), JSON.stringify(answers))
}

function persistExamSetDraft(examSetId: number, draft: StoredPracticeDraft) {
  localStorage.setItem(examSetDraftStorageKey(examSetId), JSON.stringify(draft))
}

function persistPracticeContext(sessionId: number, examSetId: number, startedAt: number) {
  localStorage.setItem(examSetStorageKey(sessionId), String(examSetId))
  localStorage.setItem(startedAtStorageKey(sessionId), String(startedAt))
}

function clearPracticeContext(sessionId: number) {
  localStorage.removeItem(examSetStorageKey(sessionId))
  localStorage.removeItem(startedAtStorageKey(sessionId))
  localStorage.removeItem(answersStorageKey(sessionId))
}

function getRemainingSeconds(startedAt: number) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
  return Math.max(0, TOTAL_SECONDS - elapsedSeconds)
}

function getStartedAtFromRemainingSeconds(remainingSeconds: number) {
  const elapsedSeconds = Math.max(0, TOTAL_SECONDS - remainingSeconds)
  return Date.now() - elapsedSeconds * 1000
}

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatMobileRemainingTime(totalSeconds: number) {
  return formatRemainingTime(totalSeconds).replace(':', '：')
}

function formatClbLevelLabel(label: string | undefined) {
  if (!label) {
    return ''
  }
  return label.replace(/^(?:CLB\/NCLC|CLB|NCLC)\s*/i, '')
}

export default function PracticePage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const sessionId = Number(id)
  const routeExamSetId = location.state?.examSetId as number | undefined
  const routeReviewMode = location.state?.reviewMode as boolean | undefined
  const examSetId = routeExamSetId ?? readStoredExamSetId(sessionId)
  const isReviewRoute = routeReviewMode === true

  const { questions, currentIndex, answers, startSession, recordAnswer, nextQuestion, goToQuestion } =
    usePracticeStore()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(TOTAL_SECONDS)
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false)
  const [isQuestionDrawerOpen, setIsQuestionDrawerOpen] = useState(false)
  const [isResultDrawerOpen, setIsResultDrawerOpen] = useState(false)
  const [reviewResult, setReviewResult] = useState<PracticeResult | null>(null)
  const [examSetTitle, setExamSetTitle] = useState('')
  const [bookmarkOverrides, setBookmarkOverrides] = useState<Record<number, boolean>>({})
  const startTimeRef = useRef<number>(Date.now())
  const initialDraftRef = useRef<StoredPracticeDraft | null>(null)
  const submittingRef = useRef(false)
  const isReviewMode = isReviewRoute || reviewResult !== null

  useEffect(() => {
    if (!examSetId) {
      navigate('/exam-sets')
      return
    }

    getExamSetDetail(examSetId).then((detail) => {
      const restoredDraft = readStoredDraft(examSetId)
      initialDraftRef.current = restoredDraft ?? null
      const restoredStartedAt =
        restoredDraft?.pausedRemainingSeconds !== undefined
          ? getStartedAtFromRemainingSeconds(restoredDraft.pausedRemainingSeconds)
          : restoredDraft?.startedAt ?? readStoredStartedAt(sessionId) ?? Date.now()
      const restoredAnswers = restoredDraft?.answers ?? readStoredAnswers(sessionId)
      const restoredCurrentIndex = restoredDraft?.currentIndex ?? 0
      persistPracticeContext(sessionId, examSetId, restoredStartedAt)
      startSession(sessionId, detail.questions, restoredAnswers, restoredCurrentIndex)
      setBookmarkOverrides({})
      setExamSetTitle(detail.title)
      setStartedAt(restoredStartedAt)
      setRemainingSeconds(getRemainingSeconds(restoredStartedAt))
      setLoading(false)
      startTimeRef.current = Date.now()

      if (routeReviewMode) {
        void getPracticeResult(sessionId).then((result) => {
          setReviewResult(result)
        })
      }
    })
  }, [examSetId, navigate, routeReviewMode, sessionId, startSession])

  const currentQuestion = questions[currentIndex]
  const currentReviewDetail = reviewResult?.details[currentIndex] ?? null
  const isLast = currentIndex === questions.length - 1

  useEffect(() => {
    const savedAnswer = isReviewMode
      ? currentReviewDetail?.userAnswer || null
      : currentQuestion
        ? answers[currentQuestion.id]?.answer ?? null
        : null
    setSelected(savedAnswer)
    startTimeRef.current = Date.now()
  }, [answers, currentQuestion, currentReviewDetail, isReviewMode])

  useEffect(() => {
    if (loading || !examSetId || !startedAt || isReviewMode) {
      return
    }

    persistStoredAnswers(sessionId, answers)
    persistExamSetDraft(examSetId, {
      startedAt,
      currentIndex,
      answers,
    })
  }, [answers, currentIndex, examSetId, isReviewMode, loading, sessionId, startedAt])

  useEffect(() => {
    if (!startedAt || loading || submitting || isReviewMode) {
      return
    }

    const updateRemaining = () => {
      const nextRemaining = getRemainingSeconds(startedAt)
      setRemainingSeconds(nextRemaining)
      if (nextRemaining === 0 && !submittingRef.current) {
        void handleSubmit()
      }
    }

    updateRemaining()
    const timerId = window.setInterval(updateRemaining, 1000)
    return () => window.clearInterval(timerId)
  }, [isReviewMode, loading, startedAt, submitting])

  const persistCurrentSelection = () => {
    if (!currentQuestion || !selected) {
      return
    }

    const timeSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
    const nextAnswers = {
      ...usePracticeStore.getState().answers,
      [currentQuestion.id]: { answer: selected, timeSpent },
    }
    recordAnswer(currentQuestion.id, selected, timeSpent)
    persistStoredAnswers(sessionId, nextAnswers)
    if (examSetId && startedAt) {
      persistExamSetDraft(examSetId, {
        startedAt,
        currentIndex,
        answers: nextAnswers,
      })
    }
  }

  useEffect(() => {
    const handleBeforeUnload = () => {
      persistCurrentSelection()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  const handleSubmit = async (shouldPersist = true) => {
    if (submittingRef.current) {
      return
    }

    if (shouldPersist) {
      persistCurrentSelection()
    }
    submittingRef.current = true
    setSubmitting(true)
    const { questions: allQuestions, answers: allAnswers } = usePracticeStore.getState()
    const answerList = allQuestions.map((question) => ({
      questionId: question.id,
      userAnswer: allAnswers[question.id]?.answer ?? '',
      timeSpentSeconds: allAnswers[question.id]?.timeSpent ?? 0,
    }))

    try {
      const result = await submitPractice(sessionId, answerList)
      clearPracticeContext(sessionId)
      if (examSetId) {
        clearExamSetDraft(examSetId)
        markExamSetCompleted(examSetId, {
          sessionId: result.sessionId,
          score: result.score,
          nclcLevelLabel: result.nclcLevelLabel,
        })
      }
      setReviewResult(result)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    if (!currentQuestion || isReviewMode) {
      return
    }

    if (selected) {
      persistCurrentSelection()
    }

    if (isLast) {
      void handleSubmit(false)
    } else {
      nextQuestion()
    }
  }

  const handleJump = (index: number) => {
    if (!isReviewMode) {
      persistCurrentSelection()
    }
    goToQuestion(index)
  }

  const handleExit = () => {
    setIsExitDialogOpen(true)
  }

  const handleCancelExit = () => {
    setIsExitDialogOpen(false)
  }

  const handleConfirmExit = async () => {
    persistCurrentSelection()
    const draftAnswers = usePracticeStore.getState().answers
    const answerList = questions.map((question) => ({
      questionId: question.id,
      userAnswer: draftAnswers[question.id]?.answer ?? '',
      timeSpentSeconds: draftAnswers[question.id]?.timeSpent ?? 0,
    }))
    if (examSetId && startedAt) {
      persistExamSetDraft(examSetId, {
        startedAt,
        currentIndex: usePracticeStore.getState().currentIndex,
        answers: draftAnswers,
        pausedRemainingSeconds: remainingSeconds,
      })
    }
    await savePracticeProgress(
      sessionId,
      usePracticeStore.getState().currentIndex,
      remainingSeconds,
      answerList,
    )
    setIsExitDialogOpen(false)
    navigate('/exam-sets')
  }

  const handleDiscardAndExit = () => {
    if (examSetId) {
      if (initialDraftRef.current) {
        persistExamSetDraft(examSetId, initialDraftRef.current)
      } else {
        clearExamSetDraft(examSetId)
      }
    }
    clearPracticeContext(sessionId)
    setIsExitDialogOpen(false)
    navigate('/exam-sets')
  }

  const getQuestionBookmarkState = (index: number) => {
    const reviewDetail = reviewResult?.details[index]
    const question = questions[index]
    const canonicalQuestionId = reviewDetail?.canonicalQuestionId ?? question?.canonicalQuestionId
    if (!canonicalQuestionId) {
      return false
    }

    return bookmarkOverrides[canonicalQuestionId] ?? reviewDetail?.isBookmarked ?? question?.isBookmarked ?? false
  }

  const handleToggleBookmark = async () => {
    const canonicalQuestionId = currentReviewDetail?.canonicalQuestionId ?? currentQuestion?.canonicalQuestionId
    if (!canonicalQuestionId) {
      return
    }

    const isCurrentlyBookmarked = getQuestionBookmarkState(currentIndex)
    const nextBookmarked = isCurrentlyBookmarked
      ? await removeBookmark(canonicalQuestionId)
      : await addBookmark(canonicalQuestionId)

    setBookmarkOverrides((current) => ({
      ...current,
      [canonicalQuestionId]: nextBookmarked,
    }))

    if (reviewResult) {
      setReviewResult({
        ...reviewResult,
        details: reviewResult.details.map((detail, index) =>
          index === currentIndex ? { ...detail, isBookmarked: nextBookmarked } : detail,
        ),
      })
    }
  }

  const handleRestartPractice = async () => {
    if (!examSetId) {
      return
    }

    setSubmitting(true)
    try {
      setLoading(true)
      setReviewResult(null)
      setIsResultDrawerOpen(false)
      setBookmarkOverrides({})
      setSelected(null)
      setStartedAt(Date.now())
      setRemainingSeconds(TOTAL_SECONDS)
      clearPracticeContext(sessionId)
      clearExamSetDraft(examSetId)
      usePracticeStore.getState().reset()
      initialDraftRef.current = null
      const { sessionId: nextSessionId } = await startPractice(examSetId)
      navigate(`/practice/${nextSessionId}`, { state: { examSetId } })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="loading-view">加载中...</div>
  }

  if (!currentQuestion) {
    return null
  }

  const optionSource = currentReviewDetail ?? currentQuestion
  const options: Array<{ key: string; text: string }> = [
    { key: 'A', text: optionSource.optionA },
    { key: 'B', text: optionSource.optionB },
    { key: 'C', text: optionSource.optionC },
    { key: 'D', text: optionSource.optionD },
  ]
  const completedCount = questions.filter((question) => answers[question.id] !== undefined).length
  const reviewCorrectCount = reviewResult?.correctCount ?? 0
  const reviewTotalCount = reviewResult?.totalCount ?? questions.length
  const reviewRate = reviewResult ? Math.round((reviewResult.correctCount / reviewResult.totalCount) * 100) : 0
  const currentIsBookmarked = getQuestionBookmarkState(currentIndex)

  function getReviewStatus(detail: QuestionResult | undefined) {
    if (!detail) {
      return 'neutral'
    }
    if (!detail.userAnswer) {
      return 'unanswered'
    }
    return detail.isCorrect ? 'correct' : 'wrong'
  }

  function getQuestionNavClass(questionId: number, index: number) {
    const isActive = index === currentIndex
    const isAnswered = answers[questionId] !== undefined
    const reviewStatus = isReviewMode ? getReviewStatus(reviewResult?.details[index]) : null

    return [
      'practice-nav-button',
      isActive ? 'active' : '',
      !isActive && isAnswered ? 'answered' : '',
      isReviewMode && reviewStatus === 'correct' ? 'review-correct' : '',
      isReviewMode && reviewStatus === 'wrong' ? 'review-wrong' : '',
      isReviewMode && reviewStatus === 'unanswered' ? 'review-unanswered' : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return (
    <div className="app-shell practice-layout">
      <div className="progress-banner">
        <span className="page-kicker">{isReviewMode ? 'Relecture' : 'Lecture en cours'}</span>
        <strong>{isReviewMode ? `复盘第 ${currentIndex + 1} 题 / 共 ${questions.length} 题` : `第 ${currentIndex + 1} 题 / 共 ${questions.length} 题`}</strong>
      </div>

      <div className="practice-grid">
        <aside className="page-panel practice-nav">
          <div className="practice-nav-header">
            <p className="page-kicker">Questions</p>
            <h2 className="practice-nav-title">{examSetTitle || '本套'}</h2>
          </div>
          <div className="practice-nav-grid">
            {questions.map((question, index) => {
              const isBookmarked = getQuestionBookmarkState(index)

              return (
                <button
                  key={question.id}
                  type="button"
                  className={getQuestionNavClass(question.id, index)}
                  onClick={() => handleJump(index)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {isBookmarked ? <span className="practice-nav-bookmark-dot" aria-hidden="true" /> : null}
                </button>
              )
            })}
          </div>
        </aside>

        <section className="page-panel practice-sheet">
          <div className="question-heading">
            <div>
              <p className="page-kicker">Question {String(currentIndex + 1).padStart(2, '0')}</p>
              <h1 className="question-title">{optionSource.questionText}</h1>
            </div>
            <BookmarkToggle
              isBookmarked={currentIsBookmarked}
              onToggle={() => void handleToggleBookmark()}
              className="question-bookmark-toggle"
            />
          </div>

          {optionSource.passage ? <div className="passage-card">{optionSource.passage}</div> : null}

          <div className="option-list">
            {options.map((option) => (
              <button
                key={option.key}
                type="button"
                className={[
                  'option-card',
                  !isReviewMode && selected === option.key ? 'active' : '',
                  isReviewMode && currentReviewDetail?.userAnswer === option.key && !currentReviewDetail.isCorrect
                    ? 'review-wrong'
                    : '',
                  isReviewMode && currentReviewDetail?.correctAnswer === option.key
                    ? 'review-correct'
                    : '',
                  isReviewMode && currentReviewDetail?.userAnswer === option.key
                    ? 'review-selected'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  if (!isReviewMode) {
                    setSelected(option.key)
                  }
                }}
                disabled={isReviewMode}
              >
                <span className="option-key">{option.key}</span>
                <span>{option.text}</span>
              </button>
            ))}
          </div>

          {isReviewMode ? (
            <>
              <div className={`review-status review-status-${getReviewStatus(currentReviewDetail ?? undefined)}`}>
                {getReviewStatus(currentReviewDetail ?? undefined) === 'correct'
                  ? '回答正确'
                  : getReviewStatus(currentReviewDetail ?? undefined) === 'wrong'
                    ? '回答错误'
                    : '本题未作答'}
              </div>
              <section className="review-explanation">
                <p className="page-kicker">Explication</p>
                <h2 className="review-explanation-title">讲解</h2>
                <p className="review-explanation-copy">
                  讲解功能即将开放。后续这里会显示正文中的关键句、关键词提示、选项排除思路与翻译内容。
                </p>
              </section>
            </>
          ) : !isLast ? (
            <div className="practice-actions">
              <button
                className="primary-button practice-action"
                onClick={handleNext}
                disabled={submitting}
              >
                Suivant
              </button>
            </div>
          ) : null}
        </section>

        <aside className="page-panel practice-sidecard">
          <p className="page-kicker">{isReviewMode ? 'Resultat' : 'Temps restant'}</p>
          <div className="practice-timer">
            {isReviewMode ? `${reviewCorrectCount} / ${reviewTotalCount}` : formatRemainingTime(remainingSeconds)}
          </div>
          <div className="practice-summary">
            <div className="practice-summary-row">
              <span>{isReviewMode ? '正确率' : '总题数'}</span>
              <strong>{isReviewMode ? `${reviewRate}%` : questions.length}</strong>
            </div>
            <div className="practice-summary-row">
              <span>{isReviewMode ? '总分' : '已作答'}</span>
              <strong>{isReviewMode ? `${reviewResult?.score ?? 0} 分` : completedCount}</strong>
            </div>
            <div className="practice-summary-row">
              <span>{isReviewMode ? 'CLB/NCLC' : '当前进度'}</span>
              <strong>{isReviewMode ? formatClbLevelLabel(reviewResult?.nclcLevelLabel) : `${currentIndex + 1} / ${questions.length}`}</strong>
            </div>
          </div>
          {isReviewMode ? (
            <div className="practice-side-actions">
              <button
                type="button"
                className="primary-button practice-side-submit"
                onClick={() => navigate('/exam-sets')}
              >
                返回题库
              </button>
              <button
                type="button"
                className="ghost-button practice-side-exit"
                onClick={() => void handleRestartPractice()}
                disabled={submitting}
              >
                重新练习
              </button>
            </div>
          ) : (
            <div className="practice-side-actions">
              <button
                className="primary-button practice-side-submit"
                onClick={() => void handleSubmit()}
                disabled={submitting}
              >
                {submitting ? '提交中...' : '提交'}
              </button>
              <button
                type="button"
                className="ghost-button practice-side-exit"
                onClick={handleExit}
                disabled={submitting}
              >
                退出
              </button>
            </div>
          )}
        </aside>
      </div>

      <nav className="mobile-practice-toolbar" aria-label="移动端练习工具栏">
        <button
          type="button"
          className="mobile-practice-tool active"
          aria-label="移动端目录"
          onClick={() => setIsQuestionDrawerOpen(true)}
        >
          目录
        </button>
        {isReviewMode ? (
          <button
            type="button"
            className="mobile-practice-tool"
            aria-label="移动端成绩"
            onClick={() => setIsResultDrawerOpen(true)}
          >
            成绩
          </button>
        ) : (
          <span className="mobile-practice-tool mobile-practice-timer" aria-label="移动端计时">
            剩余 {formatMobileRemainingTime(remainingSeconds)}
          </span>
        )}
        {!isReviewMode ? (
          <button
            type="button"
            className="mobile-practice-tool mobile-practice-tool-primary"
            aria-label="移动端提交"
            onClick={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting ? '提交中' : '提交'}
          </button>
        ) : null}
        {isReviewMode ? (
          <>
            <button
              type="button"
              className="mobile-practice-tool mobile-practice-tool-primary"
              aria-label="移动端返回题库"
              onClick={() => navigate('/exam-sets')}
            >
              返回题库
            </button>
            <button
              type="button"
              className="mobile-practice-tool"
              aria-label="移动端重新练习"
              onClick={() => void handleRestartPractice()}
              disabled={submitting}
            >
              重新练习
            </button>
          </>
        ) : (
          <button
            type="button"
            className="mobile-practice-tool"
            aria-label="mobile-exit"
            onClick={handleExit}
          >
            退出
          </button>
        )}
      </nav>

      {isQuestionDrawerOpen ? (
        <div className="mobile-question-drawer-scrim" role="presentation">
          <div
            className="page-panel mobile-question-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="题目目录"
          >
            <div className="mobile-question-drawer-header">
              <div>
                <p className="page-kicker">Questions</p>
                <h2 className="practice-nav-title">{examSetTitle || '本套'}</h2>
              </div>
              <button
                type="button"
                className="ghost-button mobile-question-drawer-close"
                onClick={() => setIsQuestionDrawerOpen(false)}
              >
                关闭
              </button>
            </div>
            <div className="mobile-question-drawer-grid">
              {questions.map((question, index) => {
                const isBookmarked = getQuestionBookmarkState(index)

                return (
                  <button
                    key={question.id}
                    type="button"
                    className={getQuestionNavClass(question.id, index)}
                    onClick={() => {
                      handleJump(index)
                      setIsQuestionDrawerOpen(false)
                    }}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {isBookmarked ? <span className="practice-nav-bookmark-dot" aria-hidden="true" /> : null}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      {isResultDrawerOpen && isReviewMode ? (
        <div className="mobile-question-drawer-scrim" role="presentation">
          <div
            className="page-panel mobile-question-drawer mobile-result-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="成绩详情"
          >
            <div className="mobile-question-drawer-header">
              <div>
                <p className="page-kicker">Resultat</p>
                <h2 className="practice-nav-title">本套成绩</h2>
              </div>
              <button
                type="button"
                className="ghost-button mobile-question-drawer-close"
                aria-label="关闭成绩"
                onClick={() => setIsResultDrawerOpen(false)}
              >
                关闭
              </button>
            </div>
            <section className="mobile-score-card" aria-label="移动端复盘结果">
              <div>
                <p className="page-kicker">Score</p>
                <strong className="mobile-score-value">{reviewCorrectCount} / {reviewTotalCount}</strong>
              </div>
              <div className="mobile-score-grid">
                <div>
                  <span>正确率</span>
                  <strong>{reviewRate}%</strong>
                </div>
                <div>
                  <span>总分</span>
                  <strong>{reviewResult?.score ?? 0} 分</strong>
                </div>
                <div>
                  <span>CLB/NCLC</span>
                  <strong>{formatClbLevelLabel(reviewResult?.nclcLevelLabel)}</strong>
                </div>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {isExitDialogOpen && !isReviewMode ? (
        <div className="dialog-scrim" role="presentation">
          <div
            className="page-panel confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-dialog-title"
          >
            <p className="page-kicker">退出练习</p>
            <h2 id="exit-dialog-title" className="confirm-dialog-title">
              是否保存当前进度并退出？
            </h2>
            <p className="confirm-dialog-copy">
              退出后会回到题库列表页。当前浏览器会保留这套题的答案、题号位置和剩余时间，方便你稍后继续作答。
            </p>
            <div className="confirm-dialog-actions">
              <button
                type="button"
                className="ghost-button confirm-dialog-secondary"
                onClick={handleCancelExit}
              >
                留在本页
              </button>
              <button
                type="button"
                className="ghost-button confirm-dialog-danger"
                onClick={handleDiscardAndExit}
              >
                不保存并退出
              </button>
              <button
                type="button"
                className="primary-button confirm-dialog-primary"
                onClick={handleConfirmExit}
              >
                保存当前进度并退出
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
