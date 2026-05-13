import type { BookmarkedQuestionFilters, WrongQuestionFilters, WrongQuestionListItem } from '../types'
import http from './http'

export async function listWrongQuestions(filters?: Partial<WrongQuestionFilters>): Promise<WrongQuestionListItem[]> {
  const bookmarkedOnly = filters?.bookmarkedOnly ?? false
  const minWrongCount = filters?.minWrongCount ?? 0
  const difficultyLevels = filters?.difficultyLevels ?? []
  const keyword = filters?.keyword ?? ''
  const masteryStatus = filters?.masteryStatus ?? 'ACTIVE'
  const params = new URLSearchParams({
    type: 'READING',
    bookmarkedOnly: String(bookmarkedOnly),
    minWrongCount: String(minWrongCount),
    difficultyLevels: difficultyLevels.join(','),
    keyword,
    masteryStatus,
  })
  const response = await http.get<WrongQuestionListItem[]>(
    `/review/wrong-questions?${params.toString()}`,
  )
  return response.data
}

export async function listTodayWrongQuestions(
  filters?: Partial<WrongQuestionFilters>,
): Promise<WrongQuestionListItem[]> {
  const bookmarkedOnly = filters?.bookmarkedOnly ?? false
  const minWrongCount = filters?.minWrongCount ?? 0
  const difficultyLevels = filters?.difficultyLevels ?? []
  const keyword = filters?.keyword ?? ''
  const masteryStatus = filters?.masteryStatus ?? 'ACTIVE'
  const params = new URLSearchParams({
    type: 'READING',
    bookmarkedOnly: String(bookmarkedOnly),
    minWrongCount: String(minWrongCount),
    difficultyLevels: difficultyLevels.join(','),
    keyword,
    masteryStatus,
  })
  const response = await http.get<WrongQuestionListItem[]>(
    `/review/today-wrong-questions?${params.toString()}`,
  )
  return response.data
}

export async function listBookmarkedQuestions(
  filters?: Partial<BookmarkedQuestionFilters>,
): Promise<WrongQuestionListItem[]> {
  const wrongOnly = filters?.wrongOnly ?? false
  const difficultyLevels = filters?.difficultyLevels ?? []
  const keyword = filters?.keyword ?? ''
  const params = new URLSearchParams({
    type: 'READING',
    wrongOnly: String(wrongOnly),
    difficultyLevels: difficultyLevels.join(','),
    keyword,
  })
  const response = await http.get<WrongQuestionListItem[]>(
    `/review/bookmarked-questions?${params.toString()}`,
  )
  return response.data
}

export async function addBookmark(canonicalQuestionId: number): Promise<boolean> {
  const response = await http.post<{ bookmarked: boolean }>(`/review/bookmarks/${canonicalQuestionId}`)
  return response.data.bookmarked
}

export async function removeBookmark(canonicalQuestionId: number): Promise<boolean> {
  const response = await http.delete<{ bookmarked: boolean }>(`/review/bookmarks/${canonicalQuestionId}`)
  return response.data.bookmarked
}

export async function recordWrongQuestionAttempt(
  canonicalQuestionId: number,
  selectedAnswer: string,
): Promise<WrongQuestionListItem> {
  const response = await http.post<WrongQuestionListItem>(
    `/review/wrong-questions/${canonicalQuestionId}/attempt`,
    { selectedAnswer },
  )
  return response.data
}
