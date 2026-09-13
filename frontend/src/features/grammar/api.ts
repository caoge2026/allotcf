import http from '../../services/http'
export interface Draft {
  slug: string
  title: string
  summary: string
  body: string
  level: string
  topics: number[]
  expectedVersion: number
}
export interface Note extends Omit<Draft, 'expectedVersion'> {
  id: number
  visibility: string
  version: number
  revisionId: number
  publishedRevisionId: number | null
  html: string
}
export interface Topic {
  id: number
  name: string
  slug: string
}
export interface Page {
  items: Pick<Note, 'id' | 'title' | 'visibility'>[]
  page: number
  hasMore: boolean
}
const base = '/manage/grammar-notes'
export const grammarApi = {
  me: async () => (await http.get<{ role: string }>('/me')).data,
  topics: async () => (await http.get<Topic[]>('/public/grammar-topics')).data,
  list: async (page: number) =>
    (await http.get<Page>(base, { params: { page } })).data,
  get: async (id: string) => (await http.get<Note>(`${base}/${id}`)).data,
  save: async (id: number | undefined, draft: Draft) =>
    (id
      ? await http.put<Note>(`${base}/${id}/draft`, draft)
      : await http.post<Note>(base, draft)
    ).data,
  action: async (note: Note, action: string) =>
    (
      await http.post<Note>(`${base}/${note.id}/${action}`, {
        expectedVersion: note.version,
        revisionId: note.revisionId,
      })
    ).data,
}
