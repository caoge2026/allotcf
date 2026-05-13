import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import PictureSpeakingPage from '../../pages/PictureSpeakingPage'
import * as speakingService from '../../services/speakingService'

vi.mock('../../services/speakingService')

const scenarios = [
  {
    id: 1,
    title: '机场 Check-in',
    category: '旅行',
    imageUrl: 'https://example.com/airport.jpg',
    prompt: '描述机场 check-in 场景。',
    hasStandardAnswer: false,
  },
]

const renderPage = () => render(
  <MemoryRouter>
    <PictureSpeakingPage />
  </MemoryRouter>,
)

describe('PictureSpeakingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(speakingService, 'listSpeakingScenarios').mockResolvedValue(scenarios)
  })

  it('loads speaking scenarios and submits an answer for feedback', async () => {
    vi.spyOn(speakingService, 'submitSpeakingAttempt').mockResolvedValue({
      attemptId: 10,
      score: 82,
      summary: '表达清楚，场景相关。',
      strengths: ['描述了地点'],
      improvements: ['可以补充人物动作'],
      referenceAnswer: 'Je suis à l’aéroport.',
    })

    renderPage()

    expect(await screen.findByRole('img', { name: '机场 Check-in' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('你的法语答案'), {
      target: { value: 'Je suis à l’aéroport. Il y a beaucoup de voyageurs.' },
    })
    fireEvent.click(screen.getByRole('button', { name: '提交并对比' }))

    await waitFor(() => {
      expect(speakingService.submitSpeakingAttempt).toHaveBeenCalledWith(
        1,
        'Je suis à l’aéroport. Il y a beaucoup de voyageurs.',
      )
    })
    expect(await screen.findByText('AI 对比反馈：82 分')).toBeInTheDocument()
    expect(screen.getByText('Je suis à l’aéroport.')).toBeInTheDocument()
  })

  it('shows a clear message when AI key is not configured', async () => {
    vi.spyOn(speakingService, 'generateStandardAnswer').mockRejectedValue({
      response: { data: { message: '暂未配置 AI Key' } },
    })

    renderPage()

    expect(await screen.findByRole('img', { name: '机场 Check-in' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '生成参考答案' }))

    expect(await screen.findByText('暂未配置 AI Key')).toBeInTheDocument()
  })
})
