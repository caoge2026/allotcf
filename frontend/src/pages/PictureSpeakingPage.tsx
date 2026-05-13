import { useEffect, useState } from 'react'
import StudyTabs from '../components/StudyTabs'
import { generateStandardAnswer, listSpeakingScenarios, submitSpeakingAttempt } from '../services/speakingService'
import type { SpeakingFeedback, SpeakingScenario } from '../types'

function getServiceErrorMessage(error: unknown) {
  const maybeError = error as { response?: { data?: { message?: string, error?: string } } }
  return maybeError.response?.data?.message
    || maybeError.response?.data?.error
    || '服务暂时不可用，请稍后重试。'
}

export default function PictureSpeakingPage() {
  const [scenarios, setScenarios] = useState<SpeakingScenario[]>([])
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null)
  const [standardAnswer, setStandardAnswer] = useState('')
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let ignore = false
    listSpeakingScenarios()
      .then((items) => {
        if (ignore) {
          return
        }
        setScenarios(items)
        setSelectedScenarioId(items[0]?.id ?? null)
      })
      .catch((error) => setError(getServiceErrorMessage(error)))
      .finally(() => {
        if (!ignore) {
          setIsLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null

  const handleSelectScenario = (scenarioId: number) => {
    setSelectedScenarioId(scenarioId)
    setStandardAnswer('')
    setAnswer('')
    setFeedback(null)
    setError('')
  }

  const handleGenerateStandardAnswer = async () => {
    if (!selectedScenario) {
      return
    }

    setError('')
    setIsGenerating(true)
    try {
      const generatedAnswer = await generateStandardAnswer(selectedScenario.id)
      setStandardAnswer(generatedAnswer)
    } catch (error) {
      setError(getServiceErrorMessage(error))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedScenario) {
      return
    }

    setError('')
    setFeedback(null)
    setIsSubmitting(true)
    try {
      const result = await submitSpeakingAttempt(selectedScenario.id, answer)
      setFeedback(result)
      setStandardAnswer(result.referenceAnswer)
    } catch (error) {
      setError(getServiceErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-shell">
      <section className="page-panel">
        <StudyTabs subject="speaking" />

        <div className="picture-speaking-shell">
          <div className="picture-speaking-hero">
            <p className="page-kicker">Image & expression</p>
            <h2 className="result-heading">看图说话</h2>
            <p>
              选择一个真实场景，先观察图片并写下你的法语表达。系统会生成参考答案，并把你的答案与参考答案进行对比。
            </p>
          </div>

          {isLoading ? (
            <div className="empty-view">正在加载口语场景...</div>
          ) : selectedScenario ? (
            <div className="picture-speaking-grid">
              <aside className="picture-speaking-sidebar">
                <h3>场景</h3>
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    className={`speaking-scenario-button${scenario.id === selectedScenario.id ? ' active' : ''}`}
                    onClick={() => handleSelectScenario(scenario.id)}
                  >
                    <span>{scenario.category}</span>
                    <strong>{scenario.title}</strong>
                  </button>
                ))}
              </aside>

              <main className="picture-speaking-workspace">
                <div className="speaking-image-card">
                  <img src={selectedScenario.imageUrl} alt={selectedScenario.title} />
                  <div>
                    <span>{selectedScenario.category}</span>
                    <h3>{selectedScenario.title}</h3>
                    <p>{selectedScenario.prompt}</p>
                  </div>
                </div>

                <label className="speaking-answer-label" htmlFor="speaking-answer">
                  你的法语答案
                </label>
                <textarea
                  id="speaking-answer"
                  className="speaking-answer-input"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="例如：Je suis à l'aéroport. Il y a beaucoup de voyageurs..."
                  rows={7}
                />

                {error ? <p className="status-message error">{error}</p> : null}

                <div className="picture-speaking-actions">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={handleGenerateStandardAnswer}
                    disabled={isGenerating}
                  >
                    {isGenerating ? '正在生成参考答案' : '生成参考答案'}
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !answer.trim()}
                  >
                    {isSubmitting ? '正在对比' : '提交并对比'}
                  </button>
                </div>

                {standardAnswer ? (
                  <section className="speaking-feedback-card">
                    <p className="page-kicker">Réponse modèle</p>
                    <h3>参考答案</h3>
                    <p>{standardAnswer}</p>
                  </section>
                ) : null}

                {feedback ? (
                  <section className="speaking-feedback-card">
                    <p className="page-kicker">Feedback</p>
                    <h3>AI 对比反馈：{feedback.score} 分</h3>
                    <p>{feedback.summary}</p>
                    <div className="speaking-feedback-columns">
                      <div>
                        <h4>优点</h4>
                        <ul>{feedback.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                      <div>
                        <h4>建议</h4>
                        <ul>{feedback.improvements.map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                    </div>
                  </section>
                ) : null}
              </main>
            </div>
          ) : (
            <div className="empty-view">暂时还没有可练习的口语场景。</div>
          )}
        </div>
      </section>
    </div>
  )
}
