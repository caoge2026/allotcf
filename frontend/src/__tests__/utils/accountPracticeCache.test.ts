import { beforeEach, expect, it } from 'vitest'
import { examSetDraftStorageKey, readSavedDraft, readCompletedPractice, markExamSetCompleted } from '../../utils/practicePersistence'
beforeEach(() => localStorage.clear())
it('keeps another account’s drafts and results out of the current account', () => {
  localStorage.setItem('userEmail', 'first@example.test')
  localStorage.setItem(examSetDraftStorageKey(10), JSON.stringify({ startedAt: 1, currentIndex: 2, answers: {} }))
  markExamSetCompleted(10, { sessionId: 7, score: 100, nclcLevelLabel: 'A1' })
  localStorage.setItem('userEmail', 'second@example.test')
  expect(readSavedDraft(10)).toBeUndefined()
  expect(readCompletedPractice(10)).toBeUndefined()
  localStorage.setItem('userEmail', 'first@example.test')
  expect(readSavedDraft(10)?.currentIndex).toBe(2)
  expect(readCompletedPractice(10)?.sessionId).toBe(7)
})
it('does not adopt historical caches whose owner was never recorded', () => {
  localStorage.setItem('practice-exam-set-10-draft', JSON.stringify({ currentIndex: 2, answers: {} }))
  localStorage.setItem('userEmail', 'second@example.test')
  expect(readSavedDraft(10)).toBeUndefined()
})
