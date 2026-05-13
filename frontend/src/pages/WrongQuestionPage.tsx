import { Fragment, useEffect, useRef, useState } from 'react'
import BookmarkToggle from '../components/BookmarkToggle'
import StudyTabs from '../components/StudyTabs'
import {
  addBookmark,
  listTodayWrongQuestions,
  listWrongQuestions,
  recordWrongQuestionAttempt,
  removeBookmark,
} from '../services/wrongQuestionService'
import type { WrongQuestionFilters, WrongQuestionListItem } from '../types'

const DIFFICULTY_OPTIONS: WrongQuestionFilters['difficultyLevels'] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const ESTIMATED_SECONDS_PER_REVIEW_QUESTION = 45
const HIGH_WRONG_COUNT_THRESHOLD = 5
type ReviewView = 'today' | 'all'

function todayReviewStorageKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `allotcf:reading:wrong-review:completed:${year}-${month}-${day}`
}

function readTodayCompletedIds() {
  try {
    const rawValue = window.localStorage.getItem(todayReviewStorageKey())
    if (!rawValue) {
      return new Set<number>()
    }

    const parsedValue = JSON.parse(rawValue)
    if (!Array.isArray(parsedValue)) {
      return new Set<number>()
    }

    return new Set(parsedValue.filter((value): value is number => typeof value === 'number'))
  } catch {
    return new Set<number>()
  }
}

function writeTodayCompletedIds(completedIds: Set<number>) {
  window.localStorage.setItem(todayReviewStorageKey(), JSON.stringify([...completedIds]))
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renderHighlightedText(text: string, keyword: string) {
  const normalizedKeyword = keyword.trim()
  if (!normalizedKeyword) {
    return text
  }

  const matcher = new RegExp(`(${escapeRegExp(normalizedKeyword)})`, 'gi')
  const segments = text.split(matcher)

  if (segments.length === 1) {
    return text
  }

  return segments.map((segment, index) => {
    if (segment.toLowerCase() === normalizedKeyword.toLowerCase()) {
      return (
        <mark key={`${segment}-${index}`} className="wrong-question-highlight">
          {segment}
        </mark>
      )
    }

    return <Fragment key={`${segment}-${index}`}>{segment}</Fragment>
  })
}

function formatReviewDate(value: string) {
  const datePart = value.split('T')[0] ?? value
  const [, month, day] = datePart.split('-')
  if (!month || !day) {
    return value
  }

  return `${Number(month)}月${Number(day)}日`
}

function formatDueStatus(item: WrongQuestionListItem) {
  if (item.dueStatus === 'OVERDUE') {
    return `已逾期 ${item.overdueDays ?? 0} 天`
  }

  if (item.dueStatus === 'DUE_TODAY') {
    return '今天到期'
  }

  if (item.nextReviewAt) {
    return `下次复习：${formatReviewDate(item.nextReviewAt)}`
  }

  return '待安排复习'
}

export default function WrongQuestionPage() {
  const [items, setItems] = useState<WrongQuestionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewView, setReviewView] = useState<ReviewView>('today')
  const [refreshToken, setRefreshToken] = useState(0)
  const [showTodayPreview, setShowTodayPreview] = useState(false)
  const [todayCompletedIds, setTodayCompletedIds] = useState<Set<number>>(() => readTodayCompletedIds())
  const hasLoadedRef = useRef(false)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [checkedAnswers, setCheckedAnswers] = useState<Record<number, boolean>>({})
  const [reviewQueueActive, setReviewQueueActive] = useState(false)
  const [reviewQueueIndex, setReviewQueueIndex] = useState(0)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [filters, setFilters] = useState<WrongQuestionFilters>({
    bookmarkedOnly: false,
    minWrongCount: 0,
    difficultyLevels: [],
    keyword: '',
    masteryStatus: 'ACTIVE',
  })
  const [debouncedKeyword, setDebouncedKeyword] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(filters.keyword)
    }, 180)

    return () => window.clearTimeout(timer)
  }, [filters.keyword])

  useEffect(() => {
    const nextFilters = {
      ...filters,
      keyword: debouncedKeyword,
    }
    if (!hasLoadedRef.current) {
      setLoading(true)
    }
    const request = reviewView === 'today' ? listTodayWrongQuestions(nextFilters) : listWrongQuestions(nextFilters)

    request.then((data) => {
      hasLoadedRef.current = true
      setItems(data)
      setLoading(false)
    })
  }, [
    debouncedKeyword,
    filters.bookmarkedOnly,
    filters.difficultyLevels,
    filters.masteryStatus,
    filters.minWrongCount,
    refreshToken,
    reviewView,
  ])

  useEffect(() => {
    setShowTodayPreview(false)
  }, [debouncedKeyword, filters.bookmarkedOnly, filters.difficultyLevels, filters.masteryStatus, filters.minWrongCount, reviewView])

  useEffect(() => {
    if (items.length === 0) {
      setReviewQueueActive(false)
      setReviewQueueIndex(0)
      return
    }

    setReviewQueueIndex((current) => Math.min(current, items.length - 1))
  }, [items.length])

  const toggleBookmark = async (item: WrongQuestionListItem) => {
    const nextBookmarked = item.isBookmarked
      ? await removeBookmark(item.canonicalQuestionId)
      : await addBookmark(item.canonicalQuestionId)

    setItems((current) =>
      current.map((entry) =>
        entry.canonicalQuestionId === item.canonicalQuestionId
          ? { ...entry, isBookmarked: nextBookmarked }
          : entry,
      ),
    )
  }

  const toggleDifficulty = (level: WrongQuestionFilters['difficultyLevels'][number]) => {
    setFilters((current) => ({
      ...current,
      difficultyLevels: current.difficultyLevels.includes(level)
        ? current.difficultyLevels.filter((item) => item !== level)
        : [...current.difficultyLevels, level],
    }))
  }

  const leaveReviewQueue = () => {
    setReviewQueueActive(false)
    if (reviewView === 'today') {
      setRefreshToken((current) => current + 1)
    }
  }

  const renderQuestionCard = (item: WrongQuestionListItem, options: { checkable?: boolean } = {}) => (
    <article key={item.canonicalQuestionId} className="wrong-question-card">
      <div className="wrong-question-meta">
        <div className="wrong-question-badges">
          <span className="wrong-question-count">错误 {item.wrongCount} 次</span>
          <span className="wrong-question-level">{item.difficultyLevel}</span>
          {item.isMastered ? <span className="wrong-question-mastered-badge">已掌握</span> : null}
          <span className={`wrong-question-due-badge${item.dueStatus === 'OVERDUE' ? ' overdue' : ''}`}>
            {formatDueStatus(item)}
          </span>
        </div>
        <BookmarkToggle
          isBookmarked={item.isBookmarked}
          onToggle={() => void toggleBookmark(item)}
          className="wrong-question-bookmark-toggle"
        />
      </div>
      <h2 className="wrong-question-title">{renderHighlightedText(item.questionText, debouncedKeyword)}</h2>
      {item.passage ? (
        <div className="passage-card wrong-question-passage">
          {renderHighlightedText(item.passage, debouncedKeyword)}
        </div>
      ) : null}
      <div className="option-list">
        {[
          { key: 'A', text: item.optionA },
          { key: 'B', text: item.optionB },
          { key: 'C', text: item.optionC },
          { key: 'D', text: item.optionD },
        ].map((option) => {
          const className = [
            'option-card',
            !options.checkable ? 'wrong-question-option-preview' : '',
            options.checkable && selectedAnswers[item.canonicalQuestionId] === option.key ? 'active' : '',
            options.checkable
              && checkedAnswers[item.canonicalQuestionId] !== undefined
              && item.correctAnswer === option.key
              ? 'review-correct'
              : '',
            options.checkable
              && checkedAnswers[item.canonicalQuestionId] === false
              && selectedAnswers[item.canonicalQuestionId] === option.key
              ? 'review-wrong'
              : '',
          ]
            .filter(Boolean)
            .join(' ')
          const content = (
            <>
              <span className="option-key">{option.key}</span>
              <span>{renderHighlightedText(option.text, debouncedKeyword)}</span>
            </>
          )

          if (!options.checkable) {
            return (
              <div key={option.key} className={className}>
                {content}
              </div>
            )
          }

          return (
            <button
              key={option.key}
              type="button"
              className={className}
              onClick={() => {
                if (checkedAnswers[item.canonicalQuestionId] !== undefined) {
                  return
                }

                const isCorrect = option.key === item.correctAnswer
                setSelectedAnswers((current) => ({
                  ...current,
                  [item.canonicalQuestionId]: option.key,
                }))
                setCheckedAnswers((current) => ({
                  ...current,
                  [item.canonicalQuestionId]: isCorrect,
                }))
                void Promise.resolve(recordWrongQuestionAttempt(item.canonicalQuestionId, option.key)).then((updatedItem) => {
                  if (!updatedItem) {
                    return
                  }

                  if (reviewView === 'today' && isCorrect) {
                    setTodayCompletedIds((current) => {
                      const nextCompletedIds = new Set(current).add(item.canonicalQuestionId)
                      writeTodayCompletedIds(nextCompletedIds)
                      return nextCompletedIds
                    })
                  }

                  setItems((current) =>
                    current.map((entry) =>
                      entry.canonicalQuestionId === updatedItem.canonicalQuestionId ? updatedItem : entry,
                    ),
                  )
                })
              }}
            >
              {content}
            </button>
          )
        })}
      </div>
      {options.checkable ? (
        <div className="wrong-question-check-row">
          {checkedAnswers[item.canonicalQuestionId] !== undefined ? (
            <span
              className={`review-status ${
                checkedAnswers[item.canonicalQuestionId] ? 'review-status-correct' : 'review-status-wrong'
              }`}
            >
              {checkedAnswers[item.canonicalQuestionId] ? '回答正确' : '回答错误'}
            </span>
          ) : null}
        </div>
      ) : null}
      <p className="wrong-question-sources">
        来源套题：{item.sourceExamSets.join(' / ')}
      </p>
    </article>
  )

  const currentReviewItem = items[reviewQueueIndex]
  const overdueCount = items.filter((item) => item.dueStatus === 'OVERDUE').length
  const highWrongCount = items.filter((item) => item.wrongCount >= HIGH_WRONG_COUNT_THRESHOLD).length
  const estimatedMinutes = Math.max(1, Math.ceil((items.length * ESTIMATED_SECONDS_PER_REVIEW_QUESTION) / 60))
  const shouldShowQuestionList = reviewView === 'all' || showTodayPreview
  const isMasteredEmpty = filters.masteryStatus === 'MASTERED'

  return (
    <div className="app-shell">
      <section className="page-panel">
        <StudyTabs subject="reading" task="wrongQuestions" />

        <div className="wrong-question-layout">
          <aside className="page-panel wrong-question-sidebar">
            <div className="wrong-question-filter-section">
              <p className="page-kicker">Filtre</p>
              <h2 className="wrong-question-sidebar-title">错题筛选</h2>
            </div>

            <div className="wrong-question-filter-section">
              <p className="wrong-question-filter-label">错误次数</p>
              <div className="wrong-question-segmented">
                {[
                  { label: '至少错 10 次', value: 10 },
                  { label: '至少错 5 次', value: 5 },
                  { label: '至少错 3 次', value: 3 },
                  { label: '全部', value: 0 },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`wrong-question-chip${filters.minWrongCount === option.value ? ' active' : ''}`}
                    onClick={() => setFilters((current) => ({ ...current, minWrongCount: option.value }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="wrong-question-filter-section">
              <p className="wrong-question-filter-label">难度等级</p>
              <div className="wrong-question-level-grid">
                {DIFFICULTY_OPTIONS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`wrong-question-chip${filters.difficultyLevels.includes(level) ? ' active' : ''}`}
                    onClick={() => toggleDifficulty(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="wrong-question-filter-section">
              <p className="wrong-question-filter-label">掌握状态</p>
              <div className="wrong-question-segmented">
                {[
                  { label: '未掌握', value: 'ACTIVE' },
                  { label: '已掌握', value: 'MASTERED' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`wrong-question-chip${filters.masteryStatus === option.value ? ' active' : ''}`}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        masteryStatus: option.value as WrongQuestionFilters['masteryStatus'],
                      }))
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="wrong-question-filter-section">
              <label className="wrong-question-filter wrong-question-filter-toggle">
                <input
                  type="checkbox"
                  checked={filters.bookmarkedOnly}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, bookmarkedOnly: event.target.checked }))
                  }
                />
                <span>仅看已收藏</span>
              </label>
            </div>

            <div className="wrong-question-filter-section">
              <label className="wrong-question-filter-label" htmlFor="wrong-question-keyword">关键词</label>
              <input
                id="wrong-question-keyword"
                className="wrong-question-search"
                type="search"
                value={filters.keyword}
                placeholder="在正文、题干、选项中搜索"
                onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
              />
            </div>
          </aside>

          <div className="wrong-question-main">
            {loading ? <div className="loading-view">加载中...</div> : null}

            {!loading && items.length === 0 ? (
              <div className="empty-view">
                {isMasteredEmpty ? (
                  <>
                    <strong>暂时还没有已掌握的错题。</strong>
                    <span>
                      连续完成多轮复习并达到第 4 阶段后，题目会进入已掌握。继续完成今日复习，很快就会在这里看到你的成果。
                    </span>
                  </>
                ) : reviewView === 'today'
                  ? '今天没有必须复习的错题。你可以休息一下，也可以进入全部错题主动练习。'
                  : '当前还没有符合条件的错题。你可以调整左侧筛选，或先完成一套阅读练习。'}
                {reviewView === 'today' && !isMasteredEmpty ? (
                  <button
                    type="button"
                    className="ghost-button wrong-question-empty-action"
                    onClick={() => setReviewView('all')}
                  >
                    查看全部错题
                  </button>
                ) : null}
              </div>
            ) : null}

            {!loading && items.length > 0 && !reviewQueueActive ? (
              <>
                <div className="wrong-question-action-bar">
                  <div>
                    <p className="page-kicker">Revision</p>
                    <strong>已筛选出 {items.length} 题</strong>
                  </div>
                  <div className="wrong-question-view-tabs" aria-label="错题复习视图">
                    <button
                      type="button"
                      className={`wrong-question-view-tab${reviewView === 'today' ? ' active' : ''}`}
                      onClick={() => setReviewView('today')}
                    >
                      今日复习
                    </button>
                    <button
                      type="button"
                      className={`wrong-question-view-tab${reviewView === 'all' ? ' active' : ''}`}
                      onClick={() => setReviewView('all')}
                    >
                      全部错题
                    </button>
                  </div>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      setReviewQueueIndex(0)
                      setReviewQueueActive(true)
                    }}
                  >
                    开始复习当前结果
                  </button>
                </div>

                {reviewView === 'today' ? (
                  <section className="wrong-question-today-card">
                    <div>
                      <p className="page-kicker">Aujourd'hui</p>
                      <h2>今日待复习 {items.length} 题</h2>
                      <p>
                        {overdueCount > 0
                          ? '优先处理逾期题，再完成今天到期题。'
                          : '没有逾期题，按今天到期节奏完成即可。'}
                      </p>
                      <dl className="wrong-question-today-stats" aria-label="今日复习数据概览">
                        <div>
                          <dt>逾期题</dt>
                          <dd>{overdueCount}</dd>
                        </div>
                        <div>
                          <dt>预计用时</dt>
                          <dd>{estimatedMinutes} 分钟</dd>
                        </div>
                        <div>
                          <dt>今日已完成</dt>
                          <dd>{todayCompletedIds.size} 题</dd>
                        </div>
                        <div>
                          <dt>高频错题（≥5次）</dt>
                          <dd>{highWrongCount}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="wrong-question-today-actions">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => setShowTodayPreview((current) => !current)}
                      >
                        {showTodayPreview ? '收起题目列表' : '预览题目列表'}
                      </button>
                    </div>
                  </section>
                ) : null}

                {shouldShowQuestionList ? (
                  <div className="wrong-question-list">
                    {items.map((item) => renderQuestionCard(item))}
                  </div>
                ) : null}
              </>
            ) : null}

            {!loading && reviewQueueActive && currentReviewItem ? (
              <div className="wrong-question-review-queue">
                <div className="wrong-question-action-bar wrong-question-queue-bar">
                  <div>
                    <p className="page-kicker">Revision concentree</p>
                    <strong>第 {reviewQueueIndex + 1} / {items.length} 题</strong>
                  </div>
                  <div className="wrong-question-queue-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={leaveReviewQueue}
                    >
                      返回列表
                    </button>
                  </div>
                </div>

                {renderQuestionCard(currentReviewItem, { checkable: true })}
                <div className="wrong-question-bottom-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      if (reviewQueueIndex >= items.length - 1) {
                        leaveReviewQueue()
                        return
                      }
                      setReviewQueueIndex((current) => current + 1)
                    }}
                  >
                    {reviewQueueIndex >= items.length - 1 ? '完成复习' : 'Suivant'}
                  </button>
                </div>
                <nav className="mobile-review-toolbar" aria-label="移动端错题复习工具栏">
                  <button
                    type="button"
                    className="mobile-practice-tool"
                    aria-label="移动端列表"
                    onClick={leaveReviewQueue}
                  >
                    列表
                  </button>
                  <button
                    type="button"
                    className="mobile-practice-tool active"
                    aria-label="移动端筛选"
                    onClick={() => setIsMobileFilterOpen(true)}
                  >
                    筛选
                  </button>
                  <button
                    type="button"
                    className="mobile-practice-tool"
                    aria-label="mobile-review-exit"
                    onClick={leaveReviewQueue}
                  >
                    退出
                  </button>
                </nav>
              </div>
            ) : null}
          </div>
        </div>

        {isMobileFilterOpen ? (
          <div className="mobile-question-drawer-scrim" role="presentation">
            <div
              className="page-panel mobile-question-drawer mobile-filter-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="错题筛选"
            >
              <div className="mobile-question-drawer-header">
                <div>
                  <p className="page-kicker">Filtre</p>
                  <h2 className="wrong-question-sidebar-title">错题筛选</h2>
                </div>
                <button
                  type="button"
                  className="ghost-button mobile-question-drawer-close"
                  onClick={() => setIsMobileFilterOpen(false)}
                >
                  关闭
                </button>
              </div>

              <div className="wrong-question-filter-section">
                <p className="wrong-question-filter-label">错误次数</p>
                <div className="wrong-question-segmented">
                  {[
                    { label: '至少错 10 次', value: 10 },
                    { label: '至少错 5 次', value: 5 },
                    { label: '至少错 3 次', value: 3 },
                    { label: '全部', value: 0 },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`wrong-question-chip${filters.minWrongCount === option.value ? ' active' : ''}`}
                      onClick={() => setFilters((current) => ({ ...current, minWrongCount: option.value }))}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wrong-question-filter-section">
                <p className="wrong-question-filter-label">难度等级</p>
                <div className="wrong-question-level-grid">
                  {DIFFICULTY_OPTIONS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`wrong-question-chip${filters.difficultyLevels.includes(level) ? ' active' : ''}`}
                      onClick={() => toggleDifficulty(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wrong-question-filter-section">
                <label className="wrong-question-filter wrong-question-filter-toggle">
                  <input
                    type="checkbox"
                    checked={filters.bookmarkedOnly}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, bookmarkedOnly: event.target.checked }))
                    }
                  />
                  <span>仅看已收藏</span>
                </label>
              </div>

              <div className="wrong-question-filter-section">
                <label className="wrong-question-filter-label" htmlFor="wrong-question-keyword-mobile">关键词</label>
                <input
                  id="wrong-question-keyword-mobile"
                  className="wrong-question-search"
                  type="search"
                  value={filters.keyword}
                  placeholder="在正文、题干、选项中搜索"
                  onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
                />
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
