import { beforeEach, describe, expect, it } from 'vitest'
import type { Question } from '../../types'
import { usePracticeStore } from '../../stores/practiceStore'

const mockQuestion = (id: number): Question => ({
  id,
  sequenceOrder: id,
  questionNo: `${id}`,
  passage: 'passage',
  questionText: 'question?',
  optionA: 'A opt',
  optionB: 'B opt',
  optionC: 'C opt',
  optionD: 'D opt',
})

describe('practiceStore', () => {
  beforeEach(() => {
    usePracticeStore.setState({
      sessionId: null,
      questions: [],
      currentIndex: 0,
      answers: {},
    })
  })

  it('startSession sets questions and sessionId', () => {
    usePracticeStore.getState().startSession(42, [mockQuestion(1), mockQuestion(2)])
    const state = usePracticeStore.getState()

    expect(state.sessionId).toBe(42)
    expect(state.questions).toHaveLength(2)
    expect(state.currentIndex).toBe(0)
  })

  it('startSession can restore initial answers', () => {
    usePracticeStore.getState().startSession(
      42,
      [mockQuestion(1), mockQuestion(2)],
      { 1: { answer: 'C', timeSpent: 9 } },
    )

    expect(usePracticeStore.getState().answers[1]).toEqual({ answer: 'C', timeSpent: 9 })
  })

  it('startSession can restore the current question index', () => {
    usePracticeStore.getState().startSession(
      42,
      [mockQuestion(1), mockQuestion(2), mockQuestion(3)],
      {},
      2,
    )

    expect(usePracticeStore.getState().currentIndex).toBe(2)
  })

  it('recordAnswer stores answer for question', () => {
    usePracticeStore.getState().startSession(1, [mockQuestion(1)])
    usePracticeStore.getState().recordAnswer(1, 'B', 15)

    expect(usePracticeStore.getState().answers[1]).toEqual({ answer: 'B', timeSpent: 15 })
  })

  it('nextQuestion increments index', () => {
    usePracticeStore.getState().startSession(1, [mockQuestion(1), mockQuestion(2)])
    usePracticeStore.getState().nextQuestion()

    expect(usePracticeStore.getState().currentIndex).toBe(1)
  })

  it('goToQuestion jumps to the requested index', () => {
    usePracticeStore.getState().startSession(1, [mockQuestion(1), mockQuestion(2), mockQuestion(3)])
    usePracticeStore.getState().recordAnswer(1, 'A', 10)
    usePracticeStore.getState().goToQuestion(2)

    const state = usePracticeStore.getState()
    expect(state.currentIndex).toBe(2)
    expect(state.answers[1]).toEqual({ answer: 'A', timeSpent: 10 })
  })

  it('isComplete returns true when all answered', () => {
    usePracticeStore.getState().startSession(1, [mockQuestion(1)])
    usePracticeStore.getState().recordAnswer(1, 'A', 10)

    expect(usePracticeStore.getState().isComplete()).toBe(true)
  })
})
