import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import GrammarManager from './GrammarManager'
import { grammarApi, type Note } from './api'
vi.mock('./api', () => ({
  grammarApi: {
    me: vi.fn(),
    topics: vi.fn(),
    list: vi.fn(),
    get: vi.fn(),
    save: vi.fn(),
    action: vi.fn(),
  },
}))
const note: Note = {
  id: 1,
  slug: 'passe-compose',
  title: '过去时',
  summary: '学习摘要',
  body: '原来的正文',
  level: 'A2',
  topics: [],
  version: 1,
  revisionId: 10,
  publishedRevisionId: null,
  visibility: 'PRIVATE',
  html: '<p>原来的正文</p>',
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(grammarApi.me).mockResolvedValue({ role: 'AUTHOR' })
  vi.mocked(grammarApi.topics).mockResolvedValue([])
  vi.mocked(grammarApi.get).mockResolvedValue(note)
})
afterEach(cleanup)
function open() {
  render(
    <MemoryRouter initialEntries={['/manage/grammar/1']}>
      <Routes>
        <Route path="/manage/grammar/:id" element={<GrammarManager />} />
      </Routes>
    </MemoryRouter>,
  )
}
it('blocks ordinary accounts without loading private notes', async () => {
  vi.mocked(grammarApi.me).mockResolvedValue({ role: 'LEARNER' })
  open()
  expect(
    await screen.findByText('当前账户尚未开通笔记编辑权限。'),
  ).toBeInTheDocument()
  expect(grammarApi.get).not.toHaveBeenCalled()
})
it('requires saved current preview before publishing and invalidates preview on edit', async () => {
  open()
  await screen.findByDisplayValue('过去时')
  const publish = screen.getByRole('button', { name: '发布此版本' })
  expect(publish).toBeDisabled()
  vi.mocked(grammarApi.action).mockResolvedValue(note)
  fireEvent.click(screen.getByRole('button', { name: '预览草稿' }))
  await waitFor(() => expect(publish).toBeEnabled())
  fireEvent.change(screen.getByLabelText('正文（Markdown）'), {
    target: { value: '修改中的私人正文' },
  })
  expect(publish).toBeDisabled()
  expect(screen.getByRole('button', { name: '预览草稿' })).toBeDisabled()
  const saved = {
    ...note,
    body: '修改中的私人正文',
    version: 2,
    revisionId: 11,
  }
  vi.mocked(grammarApi.save).mockResolvedValue(saved)
  fireEvent.click(screen.getByRole('button', { name: '保存草稿' }))
  await screen.findByText('草稿已保存。')
  expect(publish).toBeDisabled()
  expect(grammarApi.save).toHaveBeenCalledWith(
    1,
    expect.objectContaining({ body: saved.body, expectedVersion: 1 }),
  )
  vi.mocked(grammarApi.action).mockResolvedValue(saved)
  fireEvent.click(screen.getByRole('button', { name: '预览草稿' }))
  await waitFor(() => expect(publish).toBeEnabled())
  vi.mocked(grammarApi.action).mockResolvedValue({
    ...saved,
    visibility: 'PUBLIC',
    publishedRevisionId: 11,
    version: 3,
  })
  fireEvent.click(publish)
  await screen.findByText('已发布，可打开公开页面查看。')
  expect(grammarApi.action).toHaveBeenLastCalledWith(saved, 'publish')
  expect(screen.getByRole('link', { name: '查看公开版本 ↗' })).toHaveAttribute(
    'href',
    '/grammar/passe-compose',
  )
})
it('retains unsaved text when optimistic concurrency rejects a save', async () => {
  open()
  await screen.findByDisplayValue('过去时')
  fireEvent.change(screen.getByLabelText('正文（Markdown）'), {
    target: { value: '我的未保存内容' },
  })
  vi.mocked(grammarApi.save).mockRejectedValue({
    response: {
      status: 409,
      data: { error: '笔记已更新，请重新加载后再编辑' },
    },
  })
  fireEvent.click(screen.getByRole('button', { name: '保存草稿' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('笔记已更新')
  expect(screen.getByLabelText('正文（Markdown）')).toHaveValue(
    '我的未保存内容',
  )
  expect(screen.getByRole('button', { name: '发布此版本' })).toBeDisabled()
})
