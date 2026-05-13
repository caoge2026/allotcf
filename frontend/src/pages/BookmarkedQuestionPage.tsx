import { Fragment, useEffect, useState } from 'react'
import BookmarkToggle from '../components/BookmarkToggle'
import StudyTabs from '../components/StudyTabs'
import { addBookmark, listBookmarkedQuestions, removeBookmark } from '../services/wrongQuestionService'
import type { BookmarkedQuestionFilters, WrongQuestionListItem } from '../types'

const DIFFICULTY_OPTIONS: BookmarkedQuestionFilters['difficultyLevels'] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

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

export default function BookmarkedQuestionPage() {
  const [items, setItems] = useState<WrongQuestionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [checkedAnswers, setCheckedAnswers] = useState<Record<number, boolean>>({})
  const [reviewQueueActive, setReviewQueueActive] = useState(false)
  const [reviewQueueIndex, setReviewQueueIndex] = useState(0)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [filters, setFilters] = useState<BookmarkedQuestionFilters>({
    wrongOnly: false,
    difficultyLevels: [],
    keyword: '',
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
    const shouldShowInitialLoading = items.length === 0
    if (shouldShowInitialLoading) {
      setLoading(true)
    }
    listBookmarkedQuestions(nextFilters).then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [debouncedKeyword, filters.difficultyLevels, filters.wrongOnly, items.length])

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
      current
        .map((entry) =>
          entry.canonicalQuestionId === item.canonicalQuestionId
            ? { ...entry, isBookmarked: nextBookmarked }
            : entry,
        )
        .filter((entry) => entry.isBookmarked),
    )
  }

  const toggleDifficulty = (level: BookmarkedQuestionFilters['difficultyLevels'][number]) => {
    setFilters((current) => ({
      ...current,
      difficultyLevels: current.difficultyLevels.includes(level)
        ? current.difficultyLevels.filter((item) => item !== level)
        : [...current.difficultyLevels, level],
    }))
  }

  const renderQuestionCard = (item: WrongQuestionListItem, options: { checkable?: boolean } = {}) => (
    <article key={item.canonicalQuestionId} className="wrong-question-card">
      <div className="wrong-question-meta">
        <div className="wrong-question-badges">
          <span className="wrong-question-count">
            {item.wrongCount > 0 ? `错误 ${item.wrongCount} 次` : '未记录错误'}
          </span>
          <span className="wrong-question-level">{item.difficultyLevel}</span>
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
                setSelectedAnswers((current) => ({
                  ...current,
                  [item.canonicalQuestionId]: option.key,
                }))
                setCheckedAnswers((current) => ({
                  ...current,
                  [item.canonicalQuestionId]: option.key === item.correctAnswer,
                }))
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

  return (
    <div className="app-shell">
      <section className="page-panel">
        <StudyTabs subject="reading" task="bookmarkedQuestions" />

        <div className="wrong-question-layout">
          <aside className="page-panel wrong-question-sidebar">
            <div className="wrong-question-filter-section">
              <p className="page-kicker">Favoris</p>
              <h2 className="wrong-question-sidebar-title">收藏筛选</h2>
            </div>

            <div className="wrong-question-filter-section">
              <label className="wrong-question-filter wrong-question-filter-toggle">
                <input
                  type="checkbox"
                  checked={filters.wrongOnly}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, wrongOnly: event.target.checked }))
                  }
                />
                <span>只看做错过的收藏题</span>
              </label>
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
              <label className="wrong-question-filter-label" htmlFor="bookmarked-question-keyword">关键词</label>
              <input
                id="bookmarked-question-keyword"
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
              <div className="empty-view">当前还没有符合条件的收藏题。你可以调整左侧筛选，或在复盘时先收藏题目。</div>
            ) : null}

            {!loading && items.length > 0 && !reviewQueueActive ? (
              <>
                <div className="wrong-question-action-bar">
                  <div>
                    <p className="page-kicker">Favoris</p>
                    <strong>已筛选出 {items.length} 题</strong>
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

                <div className="wrong-question-list">
                  {items.map((item) => renderQuestionCard(item))}
                </div>
              </>
            ) : null}

            {!loading && reviewQueueActive && currentReviewItem ? (
              <div className="wrong-question-review-queue">
                <div className="wrong-question-action-bar wrong-question-queue-bar">
                  <div>
                    <p className="page-kicker">Revision favoris</p>
                    <strong>第 {reviewQueueIndex + 1} / {items.length} 题</strong>
                  </div>
                  <div className="wrong-question-queue-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => setReviewQueueActive(false)}
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
                        setReviewQueueActive(false)
                        return
                      }
                      setReviewQueueIndex((current) => current + 1)
                    }}
                  >
                    {reviewQueueIndex >= items.length - 1 ? '完成复习' : 'Suivant'}
                  </button>
                </div>
                <nav className="mobile-review-toolbar" aria-label="移动端收藏练习工具栏">
                  <button
                    type="button"
                    className="mobile-practice-tool"
                    aria-label="移动端列表"
                    onClick={() => setReviewQueueActive(false)}
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
                    onClick={() => setReviewQueueActive(false)}
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
              aria-label="收藏筛选"
            >
              <div className="mobile-question-drawer-header">
                <div>
                  <p className="page-kicker">Favoris</p>
                  <h2 className="wrong-question-sidebar-title">收藏筛选</h2>
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
                <label className="wrong-question-filter wrong-question-filter-toggle">
                  <input
                    type="checkbox"
                    checked={filters.wrongOnly}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, wrongOnly: event.target.checked }))
                    }
                  />
                  <span>只看做错过的收藏题</span>
                </label>
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
                <label className="wrong-question-filter-label" htmlFor="bookmarked-question-keyword-mobile">关键词</label>
                <input
                  id="bookmarked-question-keyword-mobile"
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
