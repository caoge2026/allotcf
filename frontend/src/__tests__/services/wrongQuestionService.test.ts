import { beforeEach, describe, expect, it, vi } from 'vitest'
import http from '../../services/http'
import {
  addBookmark,
  listBookmarkedQuestions,
  listTodayWrongQuestions,
  listWrongQuestions,
  recordWrongQuestionAttempt,
  removeBookmark,
} from '../../services/wrongQuestionService'

vi.mock('../../services/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('wrongQuestionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requests reading wrong questions with filters', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: [] })

    await listWrongQuestions({
      bookmarkedOnly: true,
      minWrongCount: 5,
      difficultyLevels: ['B2', 'C1'],
      keyword: 'travaille',
    })

    expect(http.get).toHaveBeenCalledWith(
      '/review/wrong-questions?type=READING&bookmarkedOnly=true&minWrongCount=5&difficultyLevels=B2%2CC1&keyword=travaille&masteryStatus=ACTIVE',
    )
  })

  it('adds bookmark through the review endpoint', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: { bookmarked: true } })

    const bookmarked = await addBookmark(12)

    expect(http.post).toHaveBeenCalledWith('/review/bookmarks/12')
    expect(bookmarked).toBe(true)
  })

  it('removes bookmark through the review endpoint', async () => {
    vi.mocked(http.delete).mockResolvedValue({ data: { bookmarked: false } })

    const bookmarked = await removeBookmark(12)

    expect(http.delete).toHaveBeenCalledWith('/review/bookmarks/12')
    expect(bookmarked).toBe(false)
  })

  it('requests reading bookmarked questions with filters', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: [] })

    await listBookmarkedQuestions({
      wrongOnly: true,
      difficultyLevels: ['A1', 'C2'],
      keyword: 'librairie',
    })

    expect(http.get).toHaveBeenCalledWith(
      '/review/bookmarked-questions?type=READING&wrongOnly=true&difficultyLevels=A1%2CC2&keyword=librairie',
    )
  })

  it('requests today wrong questions with filters', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: [] })

    await listTodayWrongQuestions({
      bookmarkedOnly: true,
      minWrongCount: 5,
      difficultyLevels: ['B2'],
      keyword: 'travaille',
    })

    expect(http.get).toHaveBeenCalledWith(
      '/review/today-wrong-questions?type=READING&bookmarkedOnly=true&minWrongCount=5&difficultyLevels=B2&keyword=travaille&masteryStatus=ACTIVE',
    )
  })

  it('records a wrong-question review attempt', async () => {
    const item = {
      canonicalQuestionId: 10,
      questionText: '错题',
      passage: '正文',
      optionA: 'A',
      optionB: 'B',
      optionC: 'C',
      optionD: 'D',
      correctAnswer: 'B',
      difficultyLevel: 'B2' as const,
      wrongCount: 3,
      lastWrongAt: '2026-05-04T12:00:00',
      lastUserAnswer: 'A',
      reviewStage: 1,
      nextReviewAt: '2026-05-10T00:00:00',
      dueStatus: 'UPCOMING' as const,
      overdueDays: 0,
      isBookmarked: false,
      sourceExamSets: ['TCF 阅读真题 01 第 4 题'],
    }
    vi.mocked(http.post).mockResolvedValue({ data: item })

    const result = await recordWrongQuestionAttempt(10, 'B')

    expect(http.post).toHaveBeenCalledWith('/review/wrong-questions/10/attempt', { selectedAnswer: 'B' })
    expect(result).toEqual(item)
  })
})
