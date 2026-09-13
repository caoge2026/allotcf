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
  ].map((detail) => ({...detail,canonicalQuestionId:detail.questionId,sequenceOrder:detail.questionId,questionNo:String(detail.questionId),passage:'',questionText:'Question',optionA:'A',optionB:'B',optionC:'C',optionD:'D',isBookmarked:false})),
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
  it('shows a recoverable message when a record is forbidden or unavailable', async () => {
    vi.spyOn(practiceService, 'getPracticeResult').mockRejectedValue({ response: { status: 404 } })
    renderResult()
    expect(await screen.findByRole('alert')).toHaveTextContent('无法查看这条记录')
    expect(screen.queryByText('加载中...')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '返回我的练习' })).toBeInTheDocument()
  })

})
