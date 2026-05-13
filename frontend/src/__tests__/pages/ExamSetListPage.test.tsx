import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ExamSetListPage from '../../pages/ExamSetListPage'
import * as examSetService from '../../services/examSetService'
import * as practiceService from '../../services/practiceService'

vi.mock('../../services/examSetService')
vi.mock('../../services/practiceService')

describe('ExamSetListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows exam sets after loading', async () => {
    vi.spyOn(examSetService, 'listExamSets').mockResolvedValue([
      {
        id: 1,
        title: '阅读练习第一套',
        type: 'READING',
        createdAt: '2026-01-01',
        questionCount: 10,
      },
    ])

    render(
      <MemoryRouter>
        <ExamSetListPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('阅读练习第一套')).toBeInTheDocument()
    })
    expect(screen.getByText('阅读')).toBeInTheDocument()
    expect(screen.getByText('套题练习')).toBeInTheDocument()
    expect(screen.getByText('Serie 01')).toBeInTheDocument()
  })

  it('paginates exam sets in groups of ten', async () => {
    vi.spyOn(examSetService, 'listExamSets').mockResolvedValue(
      Array.from({ length: 12 }, (_, index) => ({
        id: index + 1,
        title: `阅读练习第 ${index + 1} 套`,
        type: 'READING',
        createdAt: '2026-01-01',
        questionCount: 39,
      })),
    )

    render(
      <MemoryRouter>
        <ExamSetListPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('阅读练习第 1 套')).toBeInTheDocument()
    expect(screen.getByText('阅读练习第 10 套')).toBeInTheDocument()
    expect(screen.queryByText('阅读练习第 11 套')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1' })).toHaveClass('active')
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    expect(await screen.findByText('阅读练习第 11 套')).toBeInTheDocument()
    expect(screen.getByText('阅读练习第 12 套')).toBeInTheDocument()
    expect(screen.queryByText('阅读练习第 1 套')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toHaveClass('active')
  })

  it('shows loading state initially', () => {
    vi.spyOn(examSetService, 'listExamSets').mockReturnValue(new Promise(() => {}))

    render(
      <MemoryRouter>
        <ExamSetListPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/加载中/i)).toBeInTheDocument()
  })

  it('shows a visible error and stops loading when exam sets fail to load', async () => {
    vi.spyOn(examSetService, 'listExamSets').mockRejectedValue(new Error('Request failed with status code 403'))

    render(
      <MemoryRouter>
        <ExamSetListPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('题库加载失败，请重新登录或稍后重试。')).toBeInTheDocument()
    expect(screen.queryByText(/加载中/i)).not.toBeInTheDocument()
  })

  it('marks exam sets with saved draft as continue practice', async () => {
    localStorage.setItem(
      'practice-exam-set-1-draft',
      JSON.stringify({
        startedAt: Date.now(),
        currentIndex: 3,
        answers: { 1: { answer: 'B', timeSpent: 11 } },
      }),
    )

    vi.spyOn(examSetService, 'listExamSets').mockResolvedValue([
      {
        id: 1,
        title: '阅读练习第一套',
        type: 'READING',
        createdAt: '2026-01-01',
        questionCount: 10,
      },
      {
        id: 2,
        title: '阅读练习第二套',
        type: 'READING',
        createdAt: '2026-01-02',
        questionCount: 12,
      },
    ])

    render(
      <MemoryRouter>
        <ExamSetListPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('阅读练习第一套')).toBeInTheDocument()
    expect(screen.getByText('上次进度 4/10')).toBeInTheDocument()
    expect(screen.queryByText('已保存进度，可继续作答。')).not.toBeInTheDocument()
    expect(screen.queryByText('未开始')).not.toBeInTheDocument()
    expect(screen.queryByText('共 10 题，适合一次完整练习。')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '继续作答' })).toHaveClass('chapter-button-resume')
    expect(screen.getByRole('button', { name: '放弃进度' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '开始练习' })).toHaveLength(1)
  })

  it('uses server account progress to show continue practice across devices', async () => {
    vi.spyOn(examSetService, 'listExamSets').mockResolvedValue([
      {
        id: 1,
        title: '阅读练习第一套',
        type: 'READING',
        createdAt: '2026-01-01',
        questionCount: 39,
        practiceStatus: 'IN_PROGRESS',
        latestSessionId: 88,
        currentIndex: 10,
        answeredCount: 10,
        totalCount: 39,
        pausedRemainingSeconds: 2400,
        answersJson: JSON.stringify([{ questionId: 101, userAnswer: 'B', timeSpentSeconds: 12 }]),
      },
    ])

    render(
      <MemoryRouter initialEntries={['/exam-sets']}>
        <Routes>
          <Route path="/exam-sets" element={<ExamSetListPage />} />
          <Route path="/practice/:id" element={<div>练习页</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('上次进度 11/39')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '继续作答' }))

    expect(await screen.findByText('练习页')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('practice-exam-set-1-draft') ?? 'null')).toMatchObject({
      currentIndex: 10,
      pausedRemainingSeconds: 2400,
      answers: { 101: { answer: 'B', timeSpent: 12 } },
    })
  })

  it('opens a discard-progress dialog for resumed exam sets', async () => {
    localStorage.setItem(
      'practice-exam-set-1-draft',
      JSON.stringify({
        startedAt: Date.now(),
        currentIndex: 3,
        answers: { 1: { answer: 'B', timeSpent: 11 } },
      }),
    )

    vi.spyOn(examSetService, 'listExamSets').mockResolvedValue([
      {
        id: 1,
        title: '阅读练习第一套',
        type: 'READING',
        createdAt: '2026-01-01',
        questionCount: 10,
      },
    ])

    render(
      <MemoryRouter>
        <ExamSetListPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('阅读练习第一套')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '放弃进度' }))

    expect(screen.getByRole('dialog', { name: '是否清空当前进度并重新开始？' })).toBeInTheDocument()
    expect(screen.getByText('当前这套题的本地草稿将被删除，并从第 1 题重新开始计时。')).toBeInTheDocument()
  })

  it('clears the saved draft and starts a new practice after discard confirmation', async () => {
    localStorage.setItem(
      'practice-exam-set-1-draft',
      JSON.stringify({
        startedAt: Date.now(),
        currentIndex: 3,
        answers: { 1: { answer: 'B', timeSpent: 11 } },
      }),
    )

    vi.spyOn(examSetService, 'listExamSets').mockResolvedValue([
      {
        id: 1,
        title: '阅读练习第一套',
        type: 'READING',
        createdAt: '2026-01-01',
        questionCount: 10,
      },
    ])
    const startSpy = vi.spyOn(practiceService, 'startPractice').mockResolvedValue({ sessionId: 66 })

    render(
      <MemoryRouter initialEntries={['/exam-sets']}>
        <Routes>
          <Route path="/exam-sets" element={<ExamSetListPage />} />
          <Route path="/practice/:id" element={<div>新练习页</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('阅读练习第一套')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '放弃进度' }))
    fireEvent.click(screen.getByRole('button', { name: '清空进度并开始' }))

    await waitFor(() => {
      expect(startSpy).toHaveBeenCalledWith(1)
    })
    expect(localStorage.getItem('practice-exam-set-1-draft')).toBeNull()
    expect(await screen.findByText('新练习页')).toBeInTheDocument()
  })

  it('shows a visible error when starting practice fails', async () => {
    vi.spyOn(examSetService, 'listExamSets').mockResolvedValue([
      {
        id: 1,
        title: '阅读练习第一套',
        type: 'READING',
        createdAt: '2026-01-01',
        questionCount: 10,
      },
    ])
    vi.spyOn(practiceService, 'startPractice').mockRejectedValue(new Error('network down'))

    render(
      <MemoryRouter initialEntries={['/exam-sets']}>
        <Routes>
          <Route path="/exam-sets" element={<ExamSetListPage />} />
          <Route path="/practice/:id" element={<div>练习页</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('阅读练习第一套')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '开始练习' }))

    expect(await screen.findByText('进入练习失败，请确认网络和后端服务正常后重试。')).toBeInTheDocument()
    expect(screen.queryByText('练习页')).not.toBeInTheDocument()
  })

  it('marks completed exam sets as available for another attempt', async () => {
    localStorage.setItem(
      'practice-exam-set-1-completed',
      JSON.stringify({
        completedAt: Date.now(),
        sessionId: 88,
        score: 453,
        nclcLevelLabel: 'CLB/NCLC 7',
      }),
    )

    vi.spyOn(examSetService, 'listExamSets').mockResolvedValue([
      {
        id: 1,
        title: '阅读练习第一套',
        type: 'READING',
        createdAt: '2026-01-01',
        questionCount: 10,
      },
    ])

    render(
      <MemoryRouter>
        <ExamSetListPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('阅读练习第一套')).toBeInTheDocument()
    expect(screen.getByText('已完成，可查看最近一次复盘')).toBeInTheDocument()
    expect(screen.queryByText('共 10 题，适合一次完整练习。')).not.toBeInTheDocument()
    expect(screen.getByText('上次得分 453 分，CLB/NCLC 7')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '查看复盘' })).toHaveClass('chapter-button-completed')
  })

  it('opens the saved review session instead of starting a new practice', async () => {
    localStorage.setItem(
      'practice-exam-set-1-completed',
      JSON.stringify({
        completedAt: Date.now(),
        sessionId: 88,
        score: 453,
        nclcLevelLabel: 'CLB/NCLC 7',
      }),
    )

    vi.spyOn(examSetService, 'listExamSets').mockResolvedValue([
      {
        id: 1,
        title: '阅读练习第一套',
        type: 'READING',
        createdAt: '2026-01-01',
        questionCount: 10,
      },
    ])

    const startSpy = vi.spyOn(practiceService, 'startPractice')

    render(
      <MemoryRouter initialEntries={['/exam-sets']}>
        <Routes>
          <Route path="/exam-sets" element={<ExamSetListPage />} />
          <Route path="/practice/:id" element={<div>复盘页</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('阅读练习第一套')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '查看复盘' }))

    expect(await screen.findByText('复盘页')).toBeInTheDocument()
    expect(startSpy).not.toHaveBeenCalled()
  })

  it('keeps completed state as view review even if a stale draft exists', async () => {
    localStorage.setItem(
      'practice-exam-set-1-completed',
      JSON.stringify({
        completedAt: Date.now(),
        sessionId: 88,
        score: 453,
        nclcLevelLabel: 'CLB/NCLC 7',
      }),
    )
    localStorage.setItem(
      'practice-exam-set-1-draft',
      JSON.stringify({
        startedAt: Date.now(),
        currentIndex: 2,
        answers: { 1: { answer: 'B', timeSpent: 10 } },
      }),
    )

    vi.spyOn(examSetService, 'listExamSets').mockResolvedValue([
      {
        id: 1,
        title: '阅读练习第一套',
        type: 'READING',
        createdAt: '2026-01-01',
        questionCount: 10,
      },
    ])

    render(
      <MemoryRouter>
        <ExamSetListPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('阅读练习第一套')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '查看复盘' })).toBeInTheDocument()
    expect(screen.queryByText('上次进度 3/10')).not.toBeInTheDocument()
  })

  it('prefers continue practice when a newer draft exists after completion', async () => {
    const completedAt = Date.now() - 10 * 60 * 1000
    localStorage.setItem(
      'practice-exam-set-1-completed',
      JSON.stringify({
        completedAt,
        sessionId: 88,
        score: 453,
        nclcLevelLabel: 'CLB/NCLC 7',
      }),
    )
    localStorage.setItem(
      'practice-exam-set-1-draft',
      JSON.stringify({
        startedAt: completedAt + 5 * 60 * 1000,
        currentIndex: 4,
        answers: { 1: { answer: 'B', timeSpent: 10 } },
        pausedRemainingSeconds: 3120,
      }),
    )

    vi.spyOn(examSetService, 'listExamSets').mockResolvedValue([
      {
        id: 1,
        title: '阅读练习第一套',
        type: 'READING',
        createdAt: '2026-01-01',
        questionCount: 10,
      },
    ])

    render(
      <MemoryRouter>
        <ExamSetListPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('阅读练习第一套')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '继续作答' })).toHaveClass('chapter-button-resume')
    expect(screen.getByText('上次进度 5/10')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '查看复盘' })).not.toBeInTheDocument()
  })
})
