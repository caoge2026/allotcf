import type { PracticeResult } from '../types'
import http from './http'

interface PracticeResultApiItem {
  questionId: number
  canonicalQuestionId?: number
  sequenceOrder?: number
  questionNo?: string
  passage?: string
  questionText?: string
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  userAnswer: string
  correctAnswer: string
  correct?: boolean
  isCorrect?: boolean
  bookmarked?: boolean
  isBookmarked?: boolean
}

interface PracticeResultApi {
  sessionId: number
  totalCount: number
  correctCount: number
  score: number
  nclcLevelLabel: string
  details: PracticeResultApiItem[]
}

function normalizePracticeResult(data: PracticeResultApi): PracticeResult {
  return {
    ...data,
    details: data.details.map((detail) => ({
      questionId: detail.questionId,
      canonicalQuestionId: detail.canonicalQuestionId ?? detail.questionId,
      sequenceOrder: detail.sequenceOrder ?? 0,
      questionNo: detail.questionNo ?? '',
      passage: detail.passage ?? '',
      questionText: detail.questionText ?? '',
      optionA: detail.optionA ?? '',
      optionB: detail.optionB ?? '',
      optionC: detail.optionC ?? '',
      optionD: detail.optionD ?? '',
      userAnswer: detail.userAnswer,
      correctAnswer: detail.correctAnswer,
      isCorrect: detail.isCorrect ?? detail.correct ?? false,
      isBookmarked: detail.isBookmarked ?? detail.bookmarked ?? false,
    })),
  }
}

export async function startPractice(examSetId: number): Promise<{ sessionId: number }> {
  const response = await http.post<{ sessionId: number }>(
    `/practice-sessions?examSetId=${examSetId}`,
  )
  return response.data
}

export interface AnswerItem {
  questionId: number
  userAnswer: string
  timeSpentSeconds: number
}

export async function submitPractice(
  sessionId: number,
  answers: AnswerItem[],
): Promise<PracticeResult> {
  const response = await http.post<PracticeResultApi>(`/practice-sessions/${sessionId}/submit`, {
    answers,
  })
  return normalizePracticeResult(response.data)
}

export async function getPracticeResult(sessionId: number): Promise<PracticeResult> {
  const response = await http.get<PracticeResultApi>(`/practice-sessions/${sessionId}/result`)
  return normalizePracticeResult(response.data)
}

export async function savePracticeProgress(
  sessionId: number,
  currentIndex: number,
  pausedRemainingSeconds: number,
  answers: AnswerItem[],
): Promise<void> {
  await http.post(`/practice-sessions/${sessionId}/progress`, {
    currentIndex,
    pausedRemainingSeconds,
    answers,
  })
}
