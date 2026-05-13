import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPracticeResult } from '../services/practiceService'
import type { PracticeResult } from '../types'

export default function ResultPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [result, setResult] = useState<PracticeResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPracticeResult(Number(id)).then((data) => {
      setResult(data)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return <div className="loading-view">加载中...</div>
  }

  if (!result) {
    return null
  }

  const pct = Math.round((result.correctCount / result.totalCount) * 100)

  return (
    <div className="app-shell result-layout">
      <section className="page-panel result-panel">
        <div>
          <p className="page-kicker">Feuille corrigee</p>
          <h1 className="page-title">练习结果</h1>
          <p className="page-subtitle">本次阅读已经完成，下面是你的整体表现和逐题回顾。</p>
        </div>

        <div className="result-hero">
          <div className="result-score">
            {result.correctCount} / {result.totalCount}
          </div>
          <div className="result-rate">正确率 {pct}%</div>
          <div className="result-rate">总分 {result.score} 分</div>
          <div className="result-rate">{result.nclcLevelLabel}</div>
        </div>

        <h2 className="result-heading">答题详情</h2>
        <div className="result-list">
          {result.details.map((detail, index) => (
            <article
              key={detail.questionId}
              className={`result-item${detail.isCorrect ? '' : ' bad'}`}
            >
              <span className="result-index">第 {index + 1} 题</span>
              <span>
                你的答案：<strong>{detail.userAnswer}</strong>
              </span>
              {detail.isCorrect ? (
                <span className="result-good">正确</span>
              ) : (
                <span className="result-bad">
                  错误，正确答案：<strong>{detail.correctAnswer}</strong>
                </span>
              )}
            </article>
          ))}
        </div>

        <button className="primary-button result-back" onClick={() => navigate('/exam-sets')}>
          返回题库
        </button>
      </section>
    </div>
  )
}
