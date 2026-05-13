import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import WrongQuestionPage from '../../pages/WrongQuestionPage'
import BookmarkedQuestionPage from '../../pages/BookmarkedQuestionPage'
import * as wrongQuestionService from '../../services/wrongQuestionService'

vi.mock('../../services/wrongQuestionService')

describe('WrongQuestionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('renders wrong questions and left-side filters', async () => {
    vi.spyOn(wrongQuestionService, 'listTodayWrongQuestions').mockResolvedValue([
      {
        canonicalQuestionId: 10,
        questionText: '第一道错题',
        passage: '材料一',
        optionA: 'A1',
        optionB: 'B1',
        optionC: 'C1',
        optionD: 'D1',
        correctAnswer: 'B',
        difficultyLevel: 'B2',
        wrongCount: 3,
        lastWrongAt: '2026-05-04T12:00:00',
        lastUserAnswer: 'A',
        isBookmarked: true,
        sourceExamSets: ['TCF 阅读真题 01 第 4 题', 'TCF 阅读真题 03 第 9 题'],
      },
    ])

    render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('今日待复习 1 题')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '预览题目列表' }))
    expect(screen.getByText('第一道错题')).toBeInTheDocument()
    expect(screen.getByText('错误 3 次')).toBeInTheDocument()
    expect(screen.getAllByText('B2')).toHaveLength(2)
    expect(screen.getByText('来源套题：TCF 阅读真题 01 第 4 题 / TCF 阅读真题 03 第 9 题')).toBeInTheDocument()
    expect(screen.getByLabelText('关键词')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '至少错 10 次' })).toBeInTheDocument()
  })

  it('uses today review as the default view and can switch to all wrong questions', async () => {
    const todaySpy = vi.spyOn(wrongQuestionService, 'listTodayWrongQuestions').mockResolvedValue([
      {
        canonicalQuestionId: 10,
        questionText: '今日复习题',
        passage: '材料一',
        optionA: 'A1',
        optionB: 'B1',
        optionC: 'C1',
        optionD: 'D1',
        correctAnswer: 'B',
        difficultyLevel: 'B2',
        wrongCount: 3,
        lastWrongAt: '2026-05-04T12:00:00',
        lastUserAnswer: 'A',
        dueStatus: 'DUE_TODAY',
        overdueDays: 0,
        isBookmarked: true,
        sourceExamSets: ['TCF 阅读真题 01 第 4 题'],
      },
    ])
    const allSpy = vi.spyOn(wrongQuestionService, 'listWrongQuestions').mockResolvedValue([
      {
        canonicalQuestionId: 11,
        questionText: '全部错题',
        passage: '材料二',
        optionA: 'A2',
        optionB: 'B2',
        optionC: 'C2',
        optionD: 'D2',
        correctAnswer: 'A',
        difficultyLevel: 'C1',
        wrongCount: 5,
        lastWrongAt: '2026-05-05T12:00:00',
        lastUserAnswer: 'C',
        dueStatus: 'UPCOMING',
        overdueDays: 0,
        isBookmarked: false,
        sourceExamSets: ['TCF 阅读真题 02 第 12 题'],
      },
    ])

    render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('今日待复习 1 题')).toBeInTheDocument()
    expect(screen.queryByText('今日复习题')).not.toBeInTheDocument()
    expect(todaySpy).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '今日复习' })).toHaveClass('active')

    fireEvent.click(screen.getByRole('button', { name: '全部错题' }))

    expect(await screen.findByText('全部错题')).toBeInTheDocument()
    expect(allSpy).toHaveBeenCalled()
  })

  it('shows today review as a compact task before expanding the question list', async () => {
    vi.spyOn(wrongQuestionService, 'listTodayWrongQuestions').mockResolvedValue([
      {
        canonicalQuestionId: 10,
        questionText: '今日第一题',
        passage: '材料一',
        optionA: 'A1',
        optionB: 'B1',
        optionC: 'C1',
        optionD: 'D1',
        correctAnswer: 'B',
        difficultyLevel: 'B2',
        wrongCount: 3,
        lastWrongAt: '2026-05-04T12:00:00',
        lastUserAnswer: 'A',
        dueStatus: 'OVERDUE',
        overdueDays: 2,
        isBookmarked: false,
        sourceExamSets: ['TCF 阅读真题 01 第 4 题'],
      },
      {
        canonicalQuestionId: 11,
        questionText: '今日第二题',
        passage: '材料二',
        optionA: 'A2',
        optionB: 'B2',
        optionC: 'C2',
        optionD: 'D2',
        correctAnswer: 'A',
        difficultyLevel: 'C1',
        wrongCount: 5,
        lastWrongAt: '2026-05-05T12:00:00',
        lastUserAnswer: 'C',
        dueStatus: 'DUE_TODAY',
        overdueDays: 0,
        isBookmarked: true,
        sourceExamSets: ['TCF 阅读真题 02 第 12 题'],
      },
    ])

    render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('今日待复习 2 题')).toBeInTheDocument()
    expect(screen.queryByText('其中逾期 1 题')).not.toBeInTheDocument()
    expect(screen.getByText('优先处理逾期题，再完成今天到期题。')).toBeInTheDocument()
    expect(screen.getByText('逾期题')).toBeInTheDocument()
    expect(screen.getByText('预计用时')).toBeInTheDocument()
    expect(screen.getByText('2 分钟')).toBeInTheDocument()
    expect(screen.getByText('高频错题（≥5次）')).toBeInTheDocument()
    expect(screen.getAllByText('1')).toHaveLength(2)
    expect(screen.queryByText('今日第一题')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '预览题目列表' }))

    expect(screen.getByText('今日第一题')).toBeInTheDocument()
    expect(screen.getByText('今日第二题')).toBeInTheDocument()
  })

  it('reloads with bookmarked filter enabled', async () => {
    const listSpy = vi.spyOn(wrongQuestionService, 'listTodayWrongQuestions')
      .mockResolvedValue([])

    render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith({
        bookmarkedOnly: false,
        minWrongCount: 0,
        difficultyLevels: [],
        keyword: '',
        masteryStatus: 'ACTIVE',
      })
    })

    fireEvent.click(screen.getByRole('checkbox'))

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith({
        bookmarkedOnly: true,
        minWrongCount: 0,
        difficultyLevels: [],
        keyword: '',
        masteryStatus: 'ACTIVE',
      })
    })
  })

  it('reloads with wrong-count, difficulty and keyword filters', async () => {
    const listSpy = vi.spyOn(wrongQuestionService, 'listTodayWrongQuestions')
      .mockResolvedValue([])

    render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByRole('button', { name: '至少错 10 次' }))
    fireEvent.click(screen.getByRole('button', { name: 'C2' }))
    fireEvent.change(screen.getByLabelText('关键词'), { target: { value: 'travaille' } })

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith({
        bookmarkedOnly: false,
        minWrongCount: 10,
        difficultyLevels: ['C2'],
        keyword: 'travaille',
        masteryStatus: 'ACTIVE',
      })
    })
  })

  it('filters all wrong questions by mastery status', async () => {
    const allSpy = vi.spyOn(wrongQuestionService, 'listWrongQuestions').mockResolvedValue([
      {
        canonicalQuestionId: 20,
        questionText: '已掌握错题',
        passage: '材料',
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        correctAnswer: 'A',
        difficultyLevel: 'B1',
        wrongCount: 4,
        lastWrongAt: '2026-05-04T12:00:00',
        lastUserAnswer: 'B',
        reviewStage: 4,
        isMastered: true,
        isBookmarked: false,
        sourceExamSets: ['TCF 阅读真题 01 第 4 题'],
      },
    ])
    vi.spyOn(wrongQuestionService, 'listTodayWrongQuestions').mockResolvedValue([])

    render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    await screen.findByText('今天没有必须复习的错题。你可以休息一下，也可以进入全部错题主动练习。')
    fireEvent.click(screen.getByRole('button', { name: '查看全部错题' }))
    fireEvent.click(screen.getByRole('button', { name: '已掌握' }))

    await waitFor(() => {
      expect(allSpy).toHaveBeenLastCalledWith({
        bookmarkedOnly: false,
        minWrongCount: 0,
        difficultyLevels: [],
        keyword: '',
        masteryStatus: 'MASTERED',
      })
    })
    expect(await screen.findByText('已掌握错题')).toBeInTheDocument()
    expect(screen.getAllByText('已掌握').length).toBeGreaterThan(0)
  })

  it('does not show a second all-wrong-questions entry inside mastery filters', async () => {
    vi.spyOn(wrongQuestionService, 'listTodayWrongQuestions').mockResolvedValue([])

    render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    await screen.findByText('今天没有必须复习的错题。你可以休息一下，也可以进入全部错题主动练习。')

    expect(screen.getByRole('button', { name: '未掌握' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '已掌握' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '全部' })).toHaveLength(1)
  })

  it('explains the mastered definition when mastered filter has no results', async () => {
    const todaySpy = vi.spyOn(wrongQuestionService, 'listTodayWrongQuestions').mockResolvedValue([])

    render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    await screen.findByText('今天没有必须复习的错题。你可以休息一下，也可以进入全部错题主动练习。')
    fireEvent.click(screen.getByRole('button', { name: '已掌握' }))

    await waitFor(() => {
      expect(todaySpy).toHaveBeenLastCalledWith({
        bookmarkedOnly: false,
        minWrongCount: 0,
        difficultyLevels: [],
        keyword: '',
        masteryStatus: 'MASTERED',
      })
    })
    expect(screen.getByText('暂时还没有已掌握的错题。')).toBeInTheDocument()
    expect(screen.getByText('连续完成多轮复习并达到第 4 阶段后，题目会进入已掌握。继续完成今日复习，很快就会在这里看到你的成果。')).toBeInTheDocument()
  })

  it('keeps the current list visible while keyword filtering refreshes in background', async () => {
    let resolveNext: ((value: typeof initialItems) => void) | undefined
    const initialItems = [
      {
        canonicalQuestionId: 10,
        questionText: '第一道错题',
        passage: '材料一',
        optionA: 'A1',
        optionB: 'B1',
        optionC: 'C1',
        optionD: 'D1',
        correctAnswer: 'B',
        difficultyLevel: 'B2' as const,
        wrongCount: 3,
        lastWrongAt: '2026-05-04T12:00:00',
        lastUserAnswer: 'A',
        isBookmarked: true,
        sourceExamSets: ['TCF 阅读真题 01 第 4 题'],
      },
    ]

    vi.spyOn(wrongQuestionService, 'listTodayWrongQuestions')
      .mockResolvedValueOnce(initialItems)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveNext = resolve
          }),
      )

    render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('今日待复习 1 题')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '预览题目列表' }))
    expect(screen.getByText('第一道错题')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('关键词'), { target: { value: 'travaille' } })

    expect(screen.getByText('第一道错题')).toBeInTheDocument()
    expect(screen.queryByText('加载中...')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(resolveNext).toBeDefined()
    })
    resolveNext?.([])

    await waitFor(() => {
      expect(screen.getByText('今天没有必须复习的错题。你可以休息一下，也可以进入全部错题主动练习。')).toBeInTheDocument()
    })
  })

  it('highlights keyword matches in question text, passage and options', async () => {
    vi.spyOn(wrongQuestionService, 'listTodayWrongQuestions').mockResolvedValue([
      {
        canonicalQuestionId: 10,
        questionText: '谁在 travaille？',
        passage: 'Paul travaille dans une librairie.',
        optionA: 'Il dort.',
        optionB: 'Il travaille.',
        optionC: 'Il voyage.',
        optionD: 'Il etudie.',
        correctAnswer: 'B',
        difficultyLevel: 'B2',
        wrongCount: 3,
        lastWrongAt: '2026-05-04T12:00:00',
        lastUserAnswer: 'A',
        isBookmarked: false,
        sourceExamSets: ['TCF 阅读真题 01 第 4 题'],
      },
    ])

    const { container } = render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('今日待复习 1 题')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '预览题目列表' }))
    expect(screen.getByText('谁在 travaille？')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('关键词'), { target: { value: 'travaille' } })

    await waitFor(() => {
      const highlights = container.querySelectorAll('.wrong-question-highlight')
      expect(highlights).toHaveLength(3)
      expect(Array.from(highlights).every((element) => element.textContent?.toLowerCase() === 'travaille')).toBe(true)
    })
  })

  it('toggles bookmark state through the card-corner bookmark', async () => {
    vi.spyOn(wrongQuestionService, 'listTodayWrongQuestions').mockResolvedValue([
      {
        canonicalQuestionId: 10,
        questionText: '第一道错题',
        passage: '材料一',
        optionA: 'A1',
        optionB: 'B1',
        optionC: 'C1',
        optionD: 'D1',
        correctAnswer: 'B',
        difficultyLevel: 'B2',
        wrongCount: 3,
        lastWrongAt: '2026-05-04T12:00:00',
        lastUserAnswer: 'A',
        isBookmarked: false,
        sourceExamSets: ['TCF 阅读真题 01 第 4 题'],
      },
    ])
    const addSpy = vi.spyOn(wrongQuestionService, 'addBookmark').mockResolvedValue(true)
    const removeSpy = vi.spyOn(wrongQuestionService, 'removeBookmark').mockResolvedValue(false)

    render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('今日待复习 1 题')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '预览题目列表' }))
    expect(screen.getByText('第一道错题')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '收藏本题' }))

    await waitFor(() => {
      expect(addSpy).toHaveBeenCalledWith(10)
      expect(screen.getByRole('button', { name: '取消收藏本题' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: '取消收藏本题' }))

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith(10)
      expect(screen.getByRole('button', { name: '收藏本题' })).toBeInTheDocument()
    })
  })

  it('checks a selected answer without calculating score or level', async () => {
    const updatedWrongQuestion = {
      canonicalQuestionId: 10,
      questionText: '第一道错题',
      passage: '材料一',
      optionA: 'A1',
      optionB: 'B1',
      optionC: 'C1',
      optionD: 'D1',
      correctAnswer: 'B',
      difficultyLevel: 'B2' as const,
      wrongCount: 4,
      lastWrongAt: '2026-05-04T12:00:00',
      lastUserAnswer: 'A',
      dueStatus: 'DUE_TODAY' as const,
      overdueDays: 0,
      isBookmarked: false,
      sourceExamSets: ['TCF 阅读真题 01 第 4 题'],
    }
    vi.spyOn(wrongQuestionService, 'listTodayWrongQuestions').mockResolvedValue([
      {
        canonicalQuestionId: 10,
        questionText: '第一道错题',
        passage: '材料一',
        optionA: 'A1',
        optionB: 'B1',
        optionC: 'C1',
        optionD: 'D1',
        correctAnswer: 'B',
        difficultyLevel: 'B2',
        wrongCount: 3,
        lastWrongAt: '2026-05-04T12:00:00',
        lastUserAnswer: 'A',
        isBookmarked: false,
        sourceExamSets: ['TCF 阅读真题 01 第 4 题'],
      },
    ])
    const attemptSpy = vi.spyOn(wrongQuestionService, 'recordWrongQuestionAttempt')
      .mockResolvedValue(updatedWrongQuestion)

    render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('今日待复习 1 题')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '提交' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '开始复习当前结果' }))

    fireEvent.click(screen.getByRole('button', { name: /AA1/ }))

    expect(screen.getByText('回答错误')).toBeInTheDocument()
    expect(attemptSpy).toHaveBeenCalledWith(10, 'A')
    expect(screen.queryByText('总分')).not.toBeInTheDocument()
    expect(screen.queryByText('CLB/NCLC')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /BB1/ }))

    expect(screen.getByText('回答错误')).toBeInTheDocument()
  })

  it('starts a focused review queue from the current filtered results', async () => {
    vi.spyOn(wrongQuestionService, 'listTodayWrongQuestions').mockResolvedValue([
      {
        canonicalQuestionId: 10,
        questionText: '第一道错题',
        passage: '材料一',
        optionA: 'A1',
        optionB: 'B1',
        optionC: 'C1',
        optionD: 'D1',
        correctAnswer: 'B',
        difficultyLevel: 'B2',
        wrongCount: 3,
        lastWrongAt: '2026-05-04T12:00:00',
        lastUserAnswer: 'A',
        isBookmarked: false,
        sourceExamSets: ['TCF 阅读真题 01 第 4 题'],
      },
      {
        canonicalQuestionId: 11,
        questionText: '第二道错题',
        passage: '材料二',
        optionA: 'A2',
        optionB: 'B2',
        optionC: 'C2',
        optionD: 'D2',
        correctAnswer: 'A',
        difficultyLevel: 'C1',
        wrongCount: 5,
        lastWrongAt: '2026-05-05T12:00:00',
        lastUserAnswer: 'C',
        isBookmarked: true,
        sourceExamSets: ['TCF 阅读真题 02 第 12 题'],
      },
    ])

    render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('今日待复习 2 题')).toBeInTheDocument()
    expect(screen.queryByText('第一道错题')).not.toBeInTheDocument()
    expect(screen.queryByText('第二道错题')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '提交' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /AA1/ })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '开始复习当前结果' }))

    expect(screen.getByText('第 1 / 2 题')).toBeInTheDocument()
    expect(screen.getByText('第一道错题')).toBeInTheDocument()
    expect(screen.queryByText('第二道错题')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '提交' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /AA1/ }))

    expect(screen.getByText('回答错误')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }))

    expect(screen.getByText('第 2 / 2 题')).toBeInTheDocument()
    expect(screen.getByText('第二道错题')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '返回列表' }))

    expect(screen.getByText('今日待复习 2 题')).toBeInTheDocument()
  })

  it('refreshes today review count after returning from answered queue items', async () => {
    const initialItems = [
      {
        canonicalQuestionId: 10,
        questionText: '第一道错题',
        passage: '材料一',
        optionA: 'A1',
        optionB: 'B1',
        optionC: 'C1',
        optionD: 'D1',
        correctAnswer: 'B',
        difficultyLevel: 'B2' as const,
        wrongCount: 3,
        lastWrongAt: '2026-05-04T12:00:00',
        lastUserAnswer: 'A',
        dueStatus: 'DUE_TODAY' as const,
        overdueDays: 0,
        isBookmarked: false,
        sourceExamSets: ['TCF 阅读真题 01 第 4 题'],
      },
      {
        canonicalQuestionId: 11,
        questionText: '第二道错题',
        passage: '材料二',
        optionA: 'A2',
        optionB: 'B2',
        optionC: 'C2',
        optionD: 'D2',
        correctAnswer: 'A',
        difficultyLevel: 'C1' as const,
        wrongCount: 5,
        lastWrongAt: '2026-05-05T12:00:00',
        lastUserAnswer: 'C',
        dueStatus: 'DUE_TODAY' as const,
        overdueDays: 0,
        isBookmarked: true,
        sourceExamSets: ['TCF 阅读真题 02 第 12 题'],
      },
    ]
    const listSpy = vi.spyOn(wrongQuestionService, 'listTodayWrongQuestions')
      .mockResolvedValueOnce(initialItems)
      .mockResolvedValueOnce([initialItems[1]])
    vi.spyOn(wrongQuestionService, 'recordWrongQuestionAttempt').mockResolvedValue({
      ...initialItems[0],
      reviewStage: 1,
      nextReviewAt: '2026-05-11T00:00:00',
      dueStatus: 'UPCOMING',
      overdueDays: 0,
    })

    render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('已筛选出 2 题')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '开始复习当前结果' }))
    fireEvent.click(screen.getByRole('button', { name: /BB1/ }))
    fireEvent.click(screen.getByRole('button', { name: '返回列表' }))

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledTimes(2)
      expect(screen.getByText('今日待复习 1 题')).toBeInTheDocument()
      expect(screen.getByText('今日已完成')).toBeInTheDocument()
      expect(screen.getByText('1 题')).toBeInTheDocument()
      expect(screen.queryByText('第一道错题')).not.toBeInTheDocument()
      expect(screen.queryByText('第二道错题')).not.toBeInTheDocument()
    })
  })

  it('persists today completed correct answers after remounting the page', async () => {
    const initialItems = [
      {
        canonicalQuestionId: 10,
        questionText: '第一道错题',
        passage: '材料一',
        optionA: 'A1',
        optionB: 'B1',
        optionC: 'C1',
        optionD: 'D1',
        correctAnswer: 'B',
        difficultyLevel: 'B2' as const,
        wrongCount: 3,
        lastWrongAt: '2026-05-04T12:00:00',
        lastUserAnswer: 'A',
        dueStatus: 'DUE_TODAY' as const,
        overdueDays: 0,
        isBookmarked: false,
        sourceExamSets: ['TCF 阅读真题 01 第 4 题'],
      },
      {
        canonicalQuestionId: 11,
        questionText: '第二道错题',
        passage: '材料二',
        optionA: 'A2',
        optionB: 'B2',
        optionC: 'C2',
        optionD: 'D2',
        correctAnswer: 'A',
        difficultyLevel: 'C1' as const,
        wrongCount: 5,
        lastWrongAt: '2026-05-05T12:00:00',
        lastUserAnswer: 'C',
        dueStatus: 'DUE_TODAY' as const,
        overdueDays: 0,
        isBookmarked: true,
        sourceExamSets: ['TCF 阅读真题 02 第 12 题'],
      },
    ]
    vi.spyOn(wrongQuestionService, 'listTodayWrongQuestions')
      .mockResolvedValueOnce(initialItems)
      .mockResolvedValueOnce([initialItems[1]])
    vi.spyOn(wrongQuestionService, 'recordWrongQuestionAttempt').mockResolvedValue({
      ...initialItems[0],
      reviewStage: 1,
      nextReviewAt: '2026-05-11T00:00:00',
      dueStatus: 'UPCOMING',
      overdueDays: 0,
    })

    const { unmount } = render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('今日待复习 2 题')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '开始复习当前结果' }))
    fireEvent.click(screen.getByRole('button', { name: /BB1/ }))

    await waitFor(() => {
      expect(screen.getByText('回答正确')).toBeInTheDocument()
    })

    unmount()

    render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('今日待复习 1 题')).toBeInTheDocument()
    expect(screen.getByText('今日已完成')).toBeInTheDocument()
    expect(screen.getByText('1 题')).toBeInTheDocument()
  })

  it('shows mobile queue tools and opens the wrong-question filter drawer', async () => {
    vi.spyOn(wrongQuestionService, 'listTodayWrongQuestions').mockResolvedValue([
      {
        canonicalQuestionId: 10,
        questionText: '第一道错题',
        passage: '材料一',
        optionA: 'A1',
        optionB: 'B1',
        optionC: 'C1',
        optionD: 'D1',
        correctAnswer: 'B',
        difficultyLevel: 'B2',
        wrongCount: 3,
        lastWrongAt: '2026-05-04T12:00:00',
        lastUserAnswer: 'A',
        isBookmarked: false,
        sourceExamSets: ['TCF 阅读真题 01 第 4 题'],
      },
    ])

    render(
      <MemoryRouter>
        <WrongQuestionPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('今日待复习 1 题')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '开始复习当前结果' }))

    expect(screen.getByRole('button', { name: '移动端列表' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '移动端筛选' }))
    expect(screen.getByRole('dialog', { name: '错题筛选' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '移动端列表' }))
    expect(screen.getByText('已筛选出 1 题')).toBeInTheDocument()
  })
})

describe('BookmarkedQuestionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders bookmarked questions and the wrong-only filter', async () => {
    vi.spyOn(wrongQuestionService, 'listBookmarkedQuestions').mockResolvedValue([
      {
        canonicalQuestionId: 20,
        questionText: '只收藏的题',
        passage: '材料二',
        optionA: 'A2',
        optionB: 'B2',
        optionC: 'C2',
        optionD: 'D2',
        correctAnswer: 'A',
        difficultyLevel: 'A1',
        wrongCount: 0,
        lastWrongAt: null,
        lastUserAnswer: null,
        isBookmarked: true,
        sourceExamSets: ['TCF 阅读真题 02 第 12 题'],
      },
    ])

    render(
      <MemoryRouter>
        <BookmarkedQuestionPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('只收藏的题')).toBeInTheDocument()
    expect(screen.getByText('未记录错误')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '只看做错过的收藏题' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '开始复习当前结果' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /AA2/ })).not.toBeInTheDocument()
  })

  it('reloads bookmarked questions with wrong-only and keyword filters', async () => {
    const listSpy = vi.spyOn(wrongQuestionService, 'listBookmarkedQuestions').mockResolvedValue([])

    render(
      <MemoryRouter>
        <BookmarkedQuestionPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith({
        wrongOnly: false,
        difficultyLevels: [],
        keyword: '',
      })
    })

    fireEvent.click(screen.getByRole('checkbox', { name: '只看做错过的收藏题' }))
    fireEvent.click(screen.getByRole('button', { name: 'C2' }))
    fireEvent.change(screen.getByLabelText('关键词'), { target: { value: 'travaille' } })

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith({
        wrongOnly: true,
        difficultyLevels: ['C2'],
        keyword: 'travaille',
      })
    })
  })

  it('starts a focused bookmarked-question review queue with instant checking', async () => {
    vi.spyOn(wrongQuestionService, 'listBookmarkedQuestions').mockResolvedValue([
      {
        canonicalQuestionId: 20,
        questionText: '只收藏的题',
        passage: '材料二',
        optionA: 'A2',
        optionB: 'B2',
        optionC: 'C2',
        optionD: 'D2',
        correctAnswer: 'A',
        difficultyLevel: 'A1',
        wrongCount: 0,
        lastWrongAt: null,
        lastUserAnswer: null,
        isBookmarked: true,
        sourceExamSets: ['TCF 阅读真题 02 第 12 题'],
      },
      {
        canonicalQuestionId: 21,
        questionText: '第二道收藏题',
        passage: '材料三',
        optionA: 'A3',
        optionB: 'B3',
        optionC: 'C3',
        optionD: 'D3',
        correctAnswer: 'C',
        difficultyLevel: 'B1',
        wrongCount: 2,
        lastWrongAt: '2026-05-05T12:00:00',
        lastUserAnswer: 'D',
        isBookmarked: true,
        sourceExamSets: ['TCF 阅读真题 03 第 8 题'],
      },
    ])

    render(
      <MemoryRouter>
        <BookmarkedQuestionPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('只收藏的题')).toBeInTheDocument()
    expect(screen.getByText('第二道收藏题')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '提交' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '开始复习当前结果' }))

    expect(screen.getByText('第 1 / 2 题')).toBeInTheDocument()
    expect(screen.getByText('只收藏的题')).toBeInTheDocument()
    expect(screen.queryByText('第二道收藏题')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /BB2/ }))
    expect(screen.getByText('回答错误')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /AA2/ }))
    expect(screen.getByText('回答正确')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }))
    expect(screen.getByText('第 2 / 2 题')).toBeInTheDocument()
    expect(screen.getByText('第二道收藏题')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '返回列表' }))
    expect(screen.getByText('只收藏的题')).toBeInTheDocument()
    expect(screen.getByText('第二道收藏题')).toBeInTheDocument()
  })

  it('shows mobile queue tools and opens the bookmarked-question filter drawer', async () => {
    vi.spyOn(wrongQuestionService, 'listBookmarkedQuestions').mockResolvedValue([
      {
        canonicalQuestionId: 20,
        questionText: '只收藏的题',
        passage: '材料二',
        optionA: 'A2',
        optionB: 'B2',
        optionC: 'C2',
        optionD: 'D2',
        correctAnswer: 'A',
        difficultyLevel: 'A1',
        wrongCount: 0,
        lastWrongAt: null,
        lastUserAnswer: null,
        isBookmarked: true,
        sourceExamSets: ['TCF 阅读真题 02 第 12 题'],
      },
    ])

    render(
      <MemoryRouter>
        <BookmarkedQuestionPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('只收藏的题')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '开始复习当前结果' }))

    expect(screen.getByRole('button', { name: '移动端列表' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '移动端收藏' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消收藏本题' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '移动端筛选' }))
    expect(screen.getByRole('dialog', { name: '收藏筛选' })).toBeInTheDocument()
  })
})
