import { create } from 'zustand'
import type { Question } from '../types'

interface AnswerEntry {
  answer: string
  timeSpent: number
}

interface PracticeState {
  sessionId: number | null
  questions: Question[]
  currentIndex: number
  answers: Record<number, AnswerEntry>
  startSession: (
    sessionId: number,
    questions: Question[],
    initialAnswers?: Record<number, AnswerEntry>,
    initialIndex?: number,
  ) => void
  recordAnswer: (questionId: number, answer: string, timeSpent: number) => void
  goToQuestion: (index: number) => void
  nextQuestion: () => void
  isComplete: () => boolean
  reset: () => void
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  sessionId: null,
  questions: [],
  currentIndex: 0,
  answers: {},

  startSession: (sessionId, questions, initialAnswers = {}, initialIndex = 0) => {
    set({
      sessionId,
      questions,
      currentIndex: Math.min(Math.max(initialIndex, 0), Math.max(questions.length - 1, 0)),
      answers: initialAnswers,
    })
  },

  recordAnswer: (questionId, answer, timeSpent) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: { answer, timeSpent },
      },
    }))
  },

  goToQuestion: (index) => {
    set((state) => ({
      currentIndex: Math.min(Math.max(index, 0), Math.max(state.questions.length - 1, 0)),
    }))
  },

  nextQuestion: () => {
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, Math.max(state.questions.length - 1, 0)),
    }))
  },

  isComplete: () => {
    const { questions, answers } = get()
    return questions.length > 0 && questions.every((question) => answers[question.id] !== undefined)
  },

  reset: () => {
    set({ sessionId: null, questions: [], currentIndex: 0, answers: {} })
  },
}))
