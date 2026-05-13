import http from './http'
import type { SpeakingFeedback, SpeakingScenario } from '../types'

export async function listSpeakingScenarios(): Promise<SpeakingScenario[]> {
  const response = await http.get<SpeakingScenario[]>('/speaking/scenarios')
  return response.data
}

export async function generateStandardAnswer(scenarioId: number): Promise<string> {
  const response = await http.post<{ standardAnswer: string }>(`/speaking/scenarios/${scenarioId}/standard-answer`)
  return response.data.standardAnswer
}

export async function submitSpeakingAttempt(scenarioId: number, answer: string): Promise<SpeakingFeedback> {
  const response = await http.post<SpeakingFeedback>(`/speaking/scenarios/${scenarioId}/attempts`, { answer })
  return response.data
}
