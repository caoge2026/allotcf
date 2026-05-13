import { useMemo, useState } from 'react'
import StudyTabs from '../components/StudyTabs'

interface WordPair {
  id: string
  image: string
  imageLabel: string
  word: string
}

interface MatchCard {
  id: string
  pairId: string
  type: 'image' | 'word'
  label: string
  display: string
}

const WORD_PAIRS: WordPair[] = [
  { id: 'cafe', image: '☕', imageLabel: '咖啡', word: 'café' },
  { id: 'chat', image: '🐱', imageLabel: '猫', word: 'chat' },
  { id: 'livre', image: '📘', imageLabel: '书', word: 'livre' },
  { id: 'pomme', image: '🍎', imageLabel: '苹果', word: 'pomme' },
  { id: 'train', image: '🚆', imageLabel: '火车', word: 'train' },
  { id: 'maison', image: '🏠', imageLabel: '房子', word: 'maison' },
  { id: 'chien', image: '🐶', imageLabel: '狗', word: 'chien' },
  { id: 'soleil', image: '☀️', imageLabel: '太阳', word: 'soleil' },
]

function seededShuffle(cards: MatchCard[], seed: number) {
  const shuffled = [...cards]
  let value = seed || 1

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    value = (value * 9301 + 49297) % 233280
    const randomIndex = Math.floor((value / 233280) * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }

  return shuffled
}

function createCards(seed: number): MatchCard[] {
  const cards = WORD_PAIRS.flatMap((pair) => [
    {
      id: `${pair.id}-image`,
      pairId: pair.id,
      type: 'image' as const,
      label: pair.imageLabel,
      display: pair.image,
    },
    {
      id: `${pair.id}-word`,
      pairId: pair.id,
      type: 'word' as const,
      label: pair.word,
      display: pair.word,
    },
  ])

  return seededShuffle(cards, seed)
}

export default function WordMatchPage() {
  const [seed, setSeed] = useState(7)
  const [selectedCards, setSelectedCards] = useState<MatchCard[]>([])
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([])
  const [wrongCount, setWrongCount] = useState(0)
  const [feedback, setFeedback] = useState('请选择一张图片和一个单词进行配对。')

  const cards = useMemo(() => createCards(seed), [seed])
  const matchedCount = matchedPairIds.length
  const isComplete = matchedCount === WORD_PAIRS.length

  const resetGame = () => {
    setSeed((current) => current + 17)
    setSelectedCards([])
    setMatchedPairIds([])
    setWrongCount(0)
    setFeedback('新一局已开始。请选择一张图片和一个单词进行配对。')
  }

  const handleCardClick = (card: MatchCard) => {
    if (matchedPairIds.includes(card.pairId)) {
      return
    }

    if (selectedCards.some((selected) => selected.id === card.id)) {
      setSelectedCards((current) => current.filter((selected) => selected.id !== card.id))
      setFeedback('已取消选择。')
      return
    }

    if (selectedCards.length === 0) {
      setSelectedCards([card])
      setFeedback(card.type === 'image' ? '现在请选择对应的法语单词。' : '现在请选择对应的图片。')
      return
    }

    const [firstCard] = selectedCards
    const isPair = firstCard.pairId === card.pairId && firstCard.type !== card.type

    if (isPair) {
      const nextMatchedPairIds = [...matchedPairIds, card.pairId]
      setMatchedPairIds(nextMatchedPairIds)
      setSelectedCards([])
      setFeedback(nextMatchedPairIds.length === WORD_PAIRS.length ? '全部配对完成。做得漂亮！' : '配对正确，已消除一对。')
      return
    }

    setWrongCount((current) => current + 1)
    setSelectedCards([])
    setFeedback('这两个不是一对，再试一次。')
  }

  return (
    <div className="app-shell">
      <section className="page-panel">
        <StudyTabs subject="reading" task="wordMatch" />

        <div className="word-match-shell">
          <div className="word-match-hero">
            <div>
              <p className="page-kicker">Jeu de vocabulaire</p>
              <h2 className="result-heading">单词连连看</h2>
              <p className="word-match-copy">
                在 4×4 方块中找到图片和法语单词的对应关系。点对一组就会消除一组。
              </p>
            </div>
            <div className="word-match-stats" aria-label="游戏进度">
              <div>
                <span>已配对</span>
                <strong>{matchedCount} / {WORD_PAIRS.length}</strong>
              </div>
              <div>
                <span>错误</span>
                <strong>{wrongCount}</strong>
              </div>
            </div>
          </div>

          <div className="word-match-board" aria-label="单词连连看棋盘">
            {cards.map((card) => {
              const isSelected = selectedCards.some((selected) => selected.id === card.id)
              const isMatched = matchedPairIds.includes(card.pairId)
              const cardName = card.type === 'image' ? `图片：${card.label}` : `单词：${card.label}`

              return (
                <button
                  key={card.id}
                  type="button"
                  className={[
                    'word-match-card',
                    card.type,
                    isSelected ? 'is-selected' : '',
                    isMatched ? 'is-matched' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleCardClick(card)}
                  disabled={isMatched}
                  aria-label={isMatched ? `已消除：${cardName}` : cardName}
                >
                  <span>{isMatched ? '✓' : card.display}</span>
                </button>
              )
            })}
          </div>

          <div className="word-match-footer">
            <p className={isComplete ? 'word-match-feedback success' : 'word-match-feedback'}>
              {feedback}
            </p>
            <button className="ghost-button word-match-reset" type="button" onClick={resetGame}>
              重新开始
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
