import { describe, expect, it, vi } from 'vitest'
import { getPracticeResult } from '../../services/practiceService'
import http from '../../services/http'

vi.mock('../../services/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('practiceService', () => {
  it('normalizes backend correct flags for result details', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: {
        sessionId: 7,
        totalCount: 2,
        correctCount: 2,
        score: 15,
        nclcLevelLabel: 'CLB/NCLC 4 以下',
        details: [
          {
            questionId: 1,
            canonicalQuestionId: 11,
            sequenceOrder: 1,
            questionNo: '1-1',
            questionText: '第一题题干',
            passage: '第一题材料',
            optionA: 'A1',
            optionB: 'B1',
            optionC: 'C1',
            optionD: 'D1',
            userAnswer: 'A',
            correctAnswer: 'A',
            correct: true,
            bookmarked: true,
          },
          {
            questionId: 2,
            canonicalQuestionId: 12,
            sequenceOrder: 2,
            questionNo: '1-2',
            questionText: '第二题题干',
            passage: '第二题材料',
            optionA: 'A2',
            optionB: 'B2',
            optionC: 'C2',
            optionD: 'D2',
            userAnswer: 'B',
            correctAnswer: 'B',
            correct: true,
          },
        ],
      },
    })

    const result = await getPracticeResult(7)

    expect(result.details).toEqual([
      {
        questionId: 1,
        canonicalQuestionId: 11,
        sequenceOrder: 1,
        questionNo: '1-1',
        questionText: '第一题题干',
        passage: '第一题材料',
        optionA: 'A1',
        optionB: 'B1',
        optionC: 'C1',
        optionD: 'D1',
        userAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        isBookmarked: true,
      },
      {
        questionId: 2,
        canonicalQuestionId: 12,
        sequenceOrder: 2,
        questionNo: '1-2',
        questionText: '第二题题干',
        passage: '第二题材料',
        optionA: 'A2',
        optionB: 'B2',
        optionC: 'C2',
        optionD: 'D2',
        userAnswer: 'B',
        correctAnswer: 'B',
        isCorrect: true,
        isBookmarked: false,
      },
    ])
  })
})
