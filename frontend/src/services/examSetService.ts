import type { ExamSet, ExamSetDetail } from '../types'
import http from './http'

export async function listExamSets(): Promise<ExamSet[]> {
  const response = await http.get<ExamSet[]>('/exam-sets')
  return response.data
}

export async function getExamSetDetail(id: number): Promise<ExamSetDetail> {
  const response = await http.get<ExamSetDetail>(`/exam-sets/${id}`)
  return response.data
}
