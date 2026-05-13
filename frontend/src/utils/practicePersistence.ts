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

interface StoredPracticeCompletion {
  completedAt: number
  sessionId?: number
  score?: number
  nclcLevelLabel?: string
}

export function examSetDraftStorageKey(examSetId: number) {
  return `practice-exam-set-${examSetId}-draft`
}

export function examSetCompletedStorageKey(examSetId: number) {
  return `practice-exam-set-${examSetId}-completed`
}

export function hasSavedDraft(examSetId: number) {
  return readSavedDraft(examSetId) !== undefined
}

export function readSavedDraft(examSetId: number): StoredPracticeDraft | undefined {
  const raw = localStorage.getItem(examSetDraftStorageKey(examSetId))
  if (!raw) {
    return undefined
  }

  try {
    const parsed = JSON.parse(raw) as StoredPracticeDraft
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      Number.isFinite(parsed.currentIndex) &&
      typeof parsed.answers === 'object' &&
      parsed.answers !== null
    ) {
      return parsed
    }
    return undefined
  } catch {
    return undefined
  }
}

export function hasCompletedPractice(examSetId: number) {
  return readCompletedPractice(examSetId) !== undefined
}

export function readCompletedPractice(examSetId: number): StoredPracticeCompletion | undefined {
  const raw = localStorage.getItem(examSetCompletedStorageKey(examSetId))
  if (!raw) {
    return undefined
  }

  try {
    const parsed = JSON.parse(raw) as StoredPracticeCompletion
    if (typeof parsed === 'object' && parsed !== null && Number.isFinite(parsed.completedAt)) {
      return parsed
    }
    return undefined
  } catch {
    return undefined
  }
}

export function markExamSetCompleted(
  examSetId: number,
  summary?: { sessionId: number; score: number; nclcLevelLabel: string },
) {
  localStorage.setItem(
    examSetCompletedStorageKey(examSetId),
    JSON.stringify({
      completedAt: Date.now(),
      sessionId: summary?.sessionId,
      score: summary?.score,
      nclcLevelLabel: summary?.nclcLevelLabel,
    }),
  )
}

export function clearExamSetDraft(examSetId: number) {
  localStorage.removeItem(examSetDraftStorageKey(examSetId))
}
