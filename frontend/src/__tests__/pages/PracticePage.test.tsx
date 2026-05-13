import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PracticePage from '../../pages/PracticePage'
import * as examSetService from '../../services/examSetService'
import * as practiceService from '../../services/practiceService'
import * as wrongQuestionService from '../../services/wrongQuestionService'
import { usePracticeStore } from '../../stores/practiceStore'

vi.mock('../../services/examSetService')
vi.mock('../../services/practiceService')
vi.mock('../../services/wrongQuestionService')

const mockDetail = {
  id: 10,
  title: 'TCF 阅读真题 01',
  type: 'READING',
  questions: [
    {
      id: 1,
      sequenceOrder: 1,
      questionNo: '1-1',
      passage: '第一题材料',
      questionText: '第一题题干',
      optionA: '第一题 A',
      optionB: '第一题 B',
      optionC: '第一题 C',
      optionD: '第一题 D',
      canonicalQuestionId: 101,
      isBookmarked: false,
    },
    {
      id: 2,
      sequenceOrder: 2,
      questionNo: '1-2',
      passage: '第二题材料',
      questionText: '第二题题干',
      optionA: '第二题 A',
      optionB: '第二题 B',
      optionC: '第二题 C',
      optionD: '第二题 D',
      canonicalQuestionId: 102,
      isBookmarked: true,
    },
  ],
}

const mockReviewResult = {
  sessionId: 7,
  totalCount: 2,
  correctCount: 1,
  score: 3,
  nclcLevelLabel: 'CLB/NCLC 4 以下',
  details: [
    {
      questionId: 1,
      canonicalQuestionId: 101,
      sequenceOrder: 1,
      questionNo: '1-1',
      passage: '第一题材料',
      questionText: '第一题题干',
      optionA: '第一题 A',
      optionB: '第一题 B',
      optionC: '第一题 C',
      optionD: '第一题 D',
      userAnswer: 'A',
      correctAnswer: 'A',
      isCorrect: true,
      isBookmarked: false,
    },
    {
      questionId: 2,
      canonicalQuestionId: 102,
      sequenceOrder: 2,
      questionNo: '1-2',
      passage: '第二题材料',
      questionText: '第二题题干',
      optionA: '第二题 A',
      optionB: '第二题 B',
      optionC: '第二题 C',
      optionD: '第二题 D',
      userAnswer: 'C',
      correctAnswer: 'B',
      isCorrect: false,
      isBookmarked: false,
    },
  ],
}

const renderPractice = (sessionId = 7, examSetId = 10) => render(
  <MemoryRouter initialEntries={[{ pathname: `/practice/${sessionId}`, state: { examSetId } }]}>
    <Routes>
      <Route path="/practice/:id" element={<PracticePage />} />
      <Route path="/result/:id" element={<div>结果页</div>} />
      <Route path="/exam-sets" element={<div>题库页</div>} />
    </Routes>
  </MemoryRouter>,
)

const renderPracticeReview = (sessionId = 7, examSetId = 10) => render(
  <MemoryRouter initialEntries={[{ pathname: `/practice/${sessionId}`, state: { examSetId, reviewMode: true } }]}>
    <Routes>
      <Route path="/practice/:id" element={<PracticePage />} />
      <Route path="/result/:id" element={<div>结果页</div>} />
      <Route path="/exam-sets" element={<div>题库页</div>} />
    </Routes>
  </MemoryRouter>,
)

const renderPracticeWithoutState = () => render(
  <MemoryRouter initialEntries={['/practice/7']}>
    <Routes>
      <Route path="/practice/:id" element={<PracticePage />} />
      <Route path="/result/:id" element={<div>结果页</div>} />
      <Route path="/exam-sets" element={<div>题库页</div>} />
    </Routes>
  </MemoryRouter>,
)

describe('PracticePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    localStorage.clear()
    usePracticeStore.getState().reset()
    vi.spyOn(examSetService, 'getExamSetDetail').mockResolvedValue(mockDetail)
    vi.spyOn(practiceService, 'submitPractice').mockResolvedValue({
      ...mockReviewResult,
    })
    vi.spyOn(practiceService, 'getPracticeResult').mockResolvedValue(mockReviewResult)
    vi.spyOn(practiceService, 'savePracticeProgress').mockResolvedValue()
  })

  it('auto-saves the current selection before jumping to another question', async () => {
    renderPractice()

    await screen.findByText('第一题题干')

    expect(screen.getByRole('button', { name: /^提交$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /退出/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /A第一题 A/i }))
    fireEvent.click(screen.getByRole('button', { name: '02' }))

    await screen.findByText('第二题题干')

    expect(usePracticeStore.getState().answers[1]?.answer).toBe('A')
  })

  it('restores a saved answer when navigating back to a previous question', async () => {
    renderPractice()

    await screen.findByText('第一题题干')

    fireEvent.click(screen.getByRole('button', { name: /B第一题 B/i }))
    fireEvent.click(screen.getByRole('button', { name: '02' }))
    await screen.findByText('第二题题干')

    fireEvent.click(screen.getByRole('button', { name: '01' }))
    await screen.findByText('第一题题干')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /B第一题 B/i })).toHaveClass('active')
    })
  })

  it('allows moving to the next question even when the current question is unanswered', async () => {
    renderPractice()

    await screen.findByText('第一题题干')
    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }))

    expect(await screen.findByText('第二题题干')).toBeInTheDocument()
    expect(usePracticeStore.getState().answers[1]).toBeUndefined()
  })

  it('opens the mobile question drawer and jumps to any question', async () => {
    renderPractice()

    await screen.findByText('第一题题干')
    fireEvent.click(screen.getByRole('button', { name: '移动端目录' }))

    const drawer = screen.getByRole('dialog', { name: '题目目录' })
    fireEvent.click(within(drawer).getByRole('button', { name: '02' }))

    expect(await screen.findByText('第二题题干')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: '题目目录' })).not.toBeInTheDocument()
  })

  it('keeps the mobile timer as display-only instead of opening the question drawer', async () => {
    renderPractice()

    await screen.findByText('第一题题干')

    expect(screen.getByText(/剩余 60：00/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '移动端计时' })).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: '题目目录' })).not.toBeInTheDocument()
  })

  it('saves the last answer before submitting', async () => {
    const submitSpy = vi.spyOn(practiceService, 'submitPractice')

    renderPractice()

    await screen.findByText('第一题题干')
    fireEvent.click(screen.getByRole('button', { name: /A第一题 A/i }))
    fireEvent.click(screen.getByRole('button', { name: '02' }))
    await screen.findByText('第二题题干')

    fireEvent.click(screen.getByRole('button', { name: /C第二题 C/i }))
    fireEvent.click(screen.getByRole('button', { name: /^提交$/i }))

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith(
        7,
        expect.arrayContaining([
          expect.objectContaining({ questionId: 1, userAnswer: 'A' }),
          expect.objectContaining({ questionId: 2, userAnswer: 'C' }),
        ]),
      )
    })
  })

  it('allows submitting from the mobile practice toolbar', async () => {
    const submitSpy = vi.spyOn(practiceService, 'submitPractice')

    renderPractice()

    await screen.findByText('第一题题干')
    fireEvent.click(screen.getByRole('button', { name: /A第一题 A/i }))
    fireEvent.click(screen.getByRole('button', { name: '移动端提交' }))

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith(
        7,
        expect.arrayContaining([
          expect.objectContaining({ questionId: 1, userAnswer: 'A' }),
        ]),
      )
    })
    expect(await screen.findByText('复盘第 1 题 / 共 2 题')).toBeInTheDocument()
  })

  it('stays on the practice page and enters review mode after submit', async () => {
    renderPractice()

    await screen.findByText('第一题题干')
    fireEvent.click(screen.getByRole('button', { name: /A第一题 A/i }))
    fireEvent.click(screen.getByRole('button', { name: /^提交$/i }))

    expect(await screen.findByText('复盘第 1 题 / 共 2 题')).toBeInTheDocument()
    expect(screen.getByText('讲解功能即将开放。后续这里会显示正文中的关键句、关键词提示、选项排除思路与翻译内容。')).toBeInTheDocument()
    expect(screen.queryByText('结果页')).not.toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    expect(screen.getByText('CLB/NCLC')).toBeInTheDocument()
    expect(screen.getByText('4 以下')).toBeInTheDocument()
  })

  it('restores review mode when opening a completed session from the exam set list', async () => {
    renderPracticeReview(88, 10)

    expect(await screen.findByText('复盘第 1 题 / 共 2 题')).toBeInTheDocument()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '返回题库' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新练习' })).toBeInTheDocument()
    expect(practiceService.getPracticeResult).toHaveBeenCalledWith(88)
  })

  it('shows review status colors in the mobile question drawer', async () => {
    renderPracticeReview(88, 10)

    expect(await screen.findByText('复盘第 1 题 / 共 2 题')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '移动端目录' }))

    const drawer = screen.getByRole('dialog', { name: '题目目录' })
    expect(within(drawer).getByRole('button', { name: '01' })).toHaveClass('review-correct')
    expect(within(drawer).getByRole('button', { name: '02' })).toHaveClass('review-wrong')
    expect(screen.getByRole('button', { name: '移动端成绩' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '移动端返回题库' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '移动端重新练习' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '移动端收藏' })).not.toBeInTheDocument()
  })

  it('offers mobile review actions to return to the catalog or restart practice', async () => {
    vi.spyOn(practiceService, 'startPractice').mockResolvedValue({ sessionId: 99 })

    renderPracticeReview(88, 10)

    expect(await screen.findByText('复盘第 1 题 / 共 2 题')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '移动端返回题库' }))
    expect(screen.getByText('题库页')).toBeInTheDocument()

    renderPracticeReview(88, 10)

    expect(await screen.findByText('复盘第 1 题 / 共 2 题')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '移动端重新练习' }))

    await waitFor(() => {
      expect(practiceService.startPractice).toHaveBeenCalledWith(10)
    })
    expect(screen.queryByText('复盘第 1 题 / 共 2 题')).not.toBeInTheDocument()
  })

  it('opens score and level from the mobile review toolbar without keeping the result card inline', async () => {
    const { container } = renderPracticeReview(88, 10)

    expect(await screen.findByText('复盘第 1 题 / 共 2 题')).toBeInTheDocument()
    expect(container.querySelector('.mobile-review-result-card')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '移动端成绩' }))

    const resultDialog = screen.getByRole('dialog', { name: '成绩详情' })
    expect(resultDialog).toHaveTextContent('1 / 2')
    expect(resultDialog).toHaveTextContent('总分')
    expect(resultDialog).toHaveTextContent('3 分')
    expect(resultDialog).toHaveTextContent('CLB/NCLC')
    expect(resultDialog).toHaveTextContent('4 以下')

    fireEvent.click(within(resultDialog).getByRole('button', { name: '关闭成绩' }))
    expect(screen.queryByRole('dialog', { name: '成绩详情' })).not.toBeInTheDocument()
  })

  it('does not recreate a draft when opening review mode from a completed session', async () => {
    renderPracticeReview(88, 10)

    expect(await screen.findByText('复盘第 1 题 / 共 2 题')).toBeInTheDocument()
    expect(localStorage.getItem('practice-exam-set-10-draft')).toBeNull()
  })

  it('leaves review mode after clicking restart practice', async () => {
    vi.spyOn(practiceService, 'startPractice').mockResolvedValue({ sessionId: 99 })

    renderPracticeReview(88, 10)

    expect(await screen.findByText('复盘第 1 题 / 共 2 题')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '重新练习' }))

    await waitFor(() => {
      expect(practiceService.startPractice).toHaveBeenCalledWith(10)
    })
    expect(screen.queryByText('复盘第 1 题 / 共 2 题')).not.toBeInTheDocument()
    expect(await screen.findByText('60:00')).toBeInTheDocument()
  })

  it('clears previous answers immediately after clicking restart practice', async () => {
    vi.spyOn(practiceService, 'startPractice').mockResolvedValue({ sessionId: 99 })

    renderPracticeReview(88, 10)

    expect(await screen.findByText('复盘第 1 题 / 共 2 题')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /A第一题 A/i })).toHaveClass('review-correct')

    fireEvent.click(screen.getByRole('button', { name: '重新练习' }))

    await waitFor(() => {
      expect(practiceService.startPractice).toHaveBeenCalledWith(10)
    })

    expect(screen.queryByText('复盘第 1 题 / 共 2 题')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /A第一题 A/i })).not.toHaveClass('active')
  })

  it('toggles bookmark state through the question-corner bookmark in review mode', async () => {
    const bookmarkAddSpy = vi.spyOn(wrongQuestionService, 'addBookmark').mockResolvedValue(true)
    const bookmarkRemoveSpy = vi.spyOn(wrongQuestionService, 'removeBookmark').mockResolvedValue(false)

    renderPracticeReview(88, 10)

    expect(await screen.findByText('复盘第 1 题 / 共 2 题')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '收藏本题' }))

    await waitFor(() => {
      expect(bookmarkAddSpy).toHaveBeenCalledWith(101)
      expect(screen.getByRole('button', { name: '取消收藏本题' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: '取消收藏本题' }))

    await waitFor(() => {
      expect(bookmarkRemoveSpy).toHaveBeenCalledWith(101)
      expect(screen.getByRole('button', { name: '收藏本题' })).toBeInTheDocument()
    })
  })

  it('allows bookmarking the current question before submitting the practice', async () => {
    const bookmarkAddSpy = vi.spyOn(wrongQuestionService, 'addBookmark').mockResolvedValue(true)

    renderPractice()

    expect(await screen.findByText('第一题题干')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '收藏本题' }))

    await waitFor(() => {
      expect(bookmarkAddSpy).toHaveBeenCalledWith(101)
      expect(screen.getByRole('button', { name: '取消收藏本题' })).toBeInTheDocument()
    })
  })

  it('shows a bookmark dot on bookmarked questions in the review navigation', async () => {
    vi.spyOn(practiceService, 'getPracticeResult').mockResolvedValue({
      ...mockReviewResult,
      details: [
        { ...mockReviewResult.details[0], isBookmarked: false },
        { ...mockReviewResult.details[1], isBookmarked: true },
      ],
    })

    const { container } = renderPracticeReview(88, 10)

    expect(await screen.findByText('复盘第 1 题 / 共 2 题')).toBeInTheDocument()

    const navButtons = container.querySelectorAll('.practice-nav-button')
    expect(navButtons[0]?.querySelector('.practice-nav-bookmark-dot')).toBeNull()
    expect(navButtons[1]?.querySelector('.practice-nav-bookmark-dot')).not.toBeNull()
  })

  it('restores examSetId from localStorage when page reloads without route state', async () => {
    localStorage.setItem('practice-session-7-exam-set-id', '10')
    localStorage.setItem('practice-session-7-started-at', String(Date.now()))

    renderPracticeWithoutState()

    await waitFor(() => {
      expect(examSetService.getExamSetDetail).toHaveBeenCalledWith(10)
    })

    expect(await screen.findByText('第一题题干')).toBeInTheDocument()
  })

  it('restores saved draft answers from localStorage after reload', async () => {
    localStorage.setItem('practice-session-7-exam-set-id', '10')
    localStorage.setItem('practice-session-7-started-at', String(Date.now()))
    localStorage.setItem(
      'practice-session-7-answers',
      JSON.stringify({ 1: { answer: 'B', timeSpent: 12 } }),
    )

    renderPracticeWithoutState()

    await screen.findByText('第一题题干')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /B第一题 B/i })).toHaveClass('active')
    })
  })

  it('restores saved progress when re-entering the same exam set with a new session id', async () => {
    localStorage.setItem(
      'practice-exam-set-10-draft',
      JSON.stringify({
        startedAt: Date.now() - 3 * 60 * 1000,
        currentIndex: 1,
        answers: { 1: { answer: 'B', timeSpent: 12 } },
      }),
    )

    renderPractice(99, 10)

    expect(await screen.findByText('第二题题干')).toBeInTheDocument()
    expect(await screen.findByText(/57:0\d/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '01' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /B第一题 B/i })).toHaveClass('active')
    })
  })

  it('shows remaining time based on persisted start time', async () => {
    const now = Date.now()
    localStorage.setItem('practice-session-7-exam-set-id', '10')
    localStorage.setItem('practice-session-7-started-at', String(now - 5 * 60 * 1000))

    renderPracticeWithoutState()

    expect(await screen.findByText(/55:0\d/)).toBeInTheDocument()
  })

  it('pauses the timer after exiting and resumes from the saved remaining time', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-04T10:00:00Z'))

    renderPractice(7, 10)

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByText('第一题题干')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(10 * 1000)
    })

    expect(screen.getByText('59:50')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /退出/i }))
    fireEvent.click(screen.getByRole('button', { name: '保存当前进度并退出' }))

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByText('题库页')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000)
    })

    renderPractice(8, 10)

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getAllByText('第一题题干')[0]).toBeInTheDocument()
    expect(screen.getAllByText('59:50')[0]).toBeInTheDocument()
  })

  it('restores the previously saved draft when discarding a resumed attempt', async () => {
    const originalDraft = {
      startedAt: Date.now() - 5 * 60 * 1000,
      currentIndex: 0,
      answers: { 1: { answer: 'B', timeSpent: 12 } },
      pausedRemainingSeconds: 3300,
    }
    localStorage.setItem('practice-exam-set-10-draft', JSON.stringify(originalDraft))

    renderPractice(7, 10)

    await screen.findByText('第一题题干')
    fireEvent.click(screen.getByRole('button', { name: '02' }))
    await screen.findByText('第二题题干')

    fireEvent.click(screen.getByRole('button', { name: /退出/i }))
    fireEvent.click(screen.getByRole('button', { name: '不保存并退出' }))

    expect(screen.getByText('题库页')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('practice-exam-set-10-draft') ?? 'null')).toEqual(originalDraft)
  })

  it('auto-submits when time runs out', async () => {
    const submitSpy = vi.spyOn(practiceService, 'submitPractice')
    const now = Date.now()
    localStorage.setItem('practice-session-7-exam-set-id', '10')
    localStorage.setItem('practice-session-7-started-at', String(now - 59 * 60 * 1000 - 59 * 1000))

    renderPracticeWithoutState()

    expect(await screen.findByText(/00:0[01]/)).toBeInTheDocument()

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalled()
    }, { timeout: 2500 })
  })

  it('shows a custom exit dialog and returns to exam sets after confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm')
    renderPractice()

    await screen.findByText('第一题题干')
    fireEvent.click(screen.getByRole('button', { name: /退出/i }))

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(screen.getByText('是否保存当前进度并退出？')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '保存当前进度并退出' }))
    expect(await screen.findByText('题库页')).toBeInTheDocument()
  })

  it('allows exiting without saving the current draft', async () => {
    renderPractice()

    await screen.findByText('第一题题干')
    fireEvent.click(screen.getByRole('button', { name: /A第一题 A/i }))
    fireEvent.click(screen.getByRole('button', { name: /退出/i }))

    expect(screen.getByText('是否保存当前进度并退出？')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '不保存并退出' }))

    expect(await screen.findByText('题库页')).toBeInTheDocument()
    expect(localStorage.getItem('practice-exam-set-10-draft')).toBeNull()
  })

  it('keeps the user on the page when closing the custom exit dialog', async () => {
    renderPractice()

    await screen.findByText('第一题题干')
    fireEvent.click(screen.getByRole('button', { name: /退出/i }))

    expect(screen.getByText('是否保存当前进度并退出？')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '留在本页' }))

    expect(screen.queryByText('是否保存当前进度并退出？')).not.toBeInTheDocument()
    expect(screen.getByText('第一题题干')).toBeInTheDocument()
  })

  it('hides the bottom next button on the last question', async () => {
    renderPractice()

    await screen.findByText('第一题题干')
    fireEvent.click(screen.getByRole('button', { name: '02' }))
    await screen.findByText('第二题题干')

    expect(screen.queryByRole('button', { name: /Suivant/i })).not.toBeInTheDocument()
  })
})
