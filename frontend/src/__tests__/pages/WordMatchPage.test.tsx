import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import WordMatchPage from '../../pages/WordMatchPage'

const renderWordMatch = () => render(
  <MemoryRouter>
    <WordMatchPage />
  </MemoryRouter>,
)

describe('WordMatchPage', () => {
  it('renders a 4 by 4 board with progress stats', () => {
    renderWordMatch()

    expect(screen.getByRole('heading', { name: '单词连连看' })).toBeInTheDocument()
    expect(screen.getByText('0 / 8')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /图片：|单词：/ })).toHaveLength(16)
  })

  it('removes a matched image and word pair', () => {
    renderWordMatch()

    fireEvent.click(screen.getByRole('button', { name: '图片：咖啡' }))
    fireEvent.click(screen.getByRole('button', { name: '单词：café' }))

    expect(screen.getByText('1 / 8')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '已消除：图片：咖啡' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '已消除：单词：café' })).toBeDisabled()
    expect(screen.getByText('配对正确，已消除一对。')).toBeInTheDocument()
  })

  it('tracks wrong attempts without removing cards', () => {
    renderWordMatch()

    fireEvent.click(screen.getByRole('button', { name: '图片：咖啡' }))
    fireEvent.click(screen.getByRole('button', { name: '单词：chat' }))

    expect(screen.getByText('这两个不是一对，再试一次。')).toBeInTheDocument()
    expect(screen.getByText('错误')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '图片：咖啡' })).not.toBeDisabled()
  })
})
