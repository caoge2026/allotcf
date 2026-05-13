import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ResultPage from '../../pages/ResultPage'
import * as practiceService from '../../services/practiceService'

vi.mock('../../services/practiceService')

const mockResult = {
  sessionId: 1,
  totalCount: 3,
  correctCount: 2,
  score: 453,
  nclcLevelLabel: 'CLB/NCLC 7',
  details: [
    { questionId: 1, userAnswer: 'A', correctAnswer: 'A', isCorrect: true },
    { questionId: 2, userAnswer: 'B', correctAnswer: 'C', isCorrect: false },
    { questionId: 3, userAnswer: 'D', correctAnswer: 'D', isCorrect: true },
  ],
}

const renderResult = () => render(
  <MemoryRouter initialEntries={['/result/1']}>
    <Routes>
      <Route path="/result/:id" element={<ResultPage />} />
    </Routes>
  </MemoryRouter>,
)

describe('ResultPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows score after loading', async () => {
    vi.spyOn(practiceService, 'getPracticeResult').mockResolvedValue(mockResult)

    renderResult()

    await waitFor(() => {
      expect(screen.getByText(/2 \/ 3/)).toBeInTheDocument()
    })
  })

  it('shows wrong answer details', async () => {
    vi.spyOn(practiceService, 'getPracticeResult').mockResolvedValue(mockResult)

    renderResult()

    await waitFor(() => {
      expect(screen.getByText(/错误/i)).toBeInTheDocument()
    })
  })

  it('shows score and nclc level', async () => {
    vi.spyOn(practiceService, 'getPracticeResult').mockResolvedValue(mockResult)

    renderResult()

    await waitFor(() => {
      expect(screen.getByText(/453 分/)).toBeInTheDocument()
      expect(screen.getByText(/CLB\/NCLC 7/)).toBeInTheDocument()
    })
  })
})
