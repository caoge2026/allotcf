export interface User {
  email: string
  nickname: string | null
}

export interface ExamSet {
  id: number
  title: string
  type: string
  createdAt: string
  questionCount: number
  practiceStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  latestSessionId?: number | null
  currentIndex?: number | null
  answeredCount?: number | null
  totalCount?: number | null
  pausedRemainingSeconds?: number | null
  score?: number | null
  nclcLevelLabel?: string | null
  answersJson?: string | null
}

export interface Question {
  id: number
  sequenceOrder: number
  questionNo: string
  passage: string
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  canonicalQuestionId: number
  isBookmarked: boolean
}

export interface ExamSetDetail {
  id: number
  title: string
  type: string
  questions: Question[]
}

export interface QuestionResult {
  questionId: number
  canonicalQuestionId: number
  sequenceOrder: number
  questionNo: string
  passage: string
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  isBookmarked: boolean
}

export interface PracticeResult {
  sessionId: number
  totalCount: number
  correctCount: number
  score: number
  nclcLevelLabel: string
  details: QuestionResult[]
}

export interface WrongQuestionListItem {
  canonicalQuestionId: number
  questionText: string
  passage: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: string
  difficultyLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  wrongCount: number
  lastWrongAt: string
  lastUserAnswer: string
  reviewStage?: number
  nextReviewAt?: string | null
  dueStatus?: 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' | 'UNSCHEDULED'
  overdueDays?: number
  isMastered?: boolean
  isBookmarked: boolean
  sourceExamSets: string[]
}

export interface WrongQuestionFilters {
  bookmarkedOnly: boolean
  minWrongCount: number
  difficultyLevels: Array<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>
  keyword: string
  masteryStatus: 'ACTIVE' | 'MASTERED' | 'ALL'
}

export interface BookmarkedQuestionFilters {
  wrongOnly: boolean
  difficultyLevels: Array<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>
  keyword: string
}

export interface SpeakingScenario {
  id: number
  title: string
  category: string
  imageUrl: string
  prompt: string
  hasStandardAnswer: boolean
}

export interface SpeakingFeedback {
  attemptId: number | null
  score: number
  summary: string
  strengths: string[]
  improvements: string[]
  referenceAnswer: string
}
