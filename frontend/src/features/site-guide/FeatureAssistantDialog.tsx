import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { quickQuestions, getFeatureStatusLabel } from './catalog'
import { searchFeatures, type SearchAnswer } from './search'
export default function FeatureAssistantDialog({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState<SearchAnswer | null>(null)
  const navigate = useNavigate()
  if (!open) return null
  const ask = (value: string) => {
    setQuery(value)
    setAnswer(searchFeatures(value))
  }
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setAnswer(searchFeatures(query))
  }
  const go = (path: string) => {
    onClose()
    navigate(path)
  }
  return (
    <div className="feature-assistant-backdrop" role="presentation">
      <section
        className="feature-assistant-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="问询台"
      >
        <div className="feature-assistant-header">
          <div>
            <p className="page-kicker">Assistant</p>
            <h2>问询台</h2>
            <p>你可以问我：错题本在哪里、收藏练习怎么用、网站有哪些功能。</p>
          </div>
          <button
            type="button"
            className="feature-assistant-close"
            onClick={onClose}
            aria-label="关闭问询台"
          >
            x
          </button>
        </div>
        <div
          className="feature-assistant-quick-questions"
          aria-label="常见问题"
        >
          {quickQuestions.map((question) => (
            <button key={question} type="button" onClick={() => ask(question)}>
              {question}
            </button>
          ))}
        </div>
        <form className="feature-assistant-form" onSubmit={submit}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="问我功能在哪里，例如：错题本在哪里？"
          />
          <button type="submit">查询功能</button>
        </form>
        {answer ? (
          <div className="feature-assistant-answer" role="status">
            <p>{answer.message}</p>
            {answer.results.length > 0 ? (
              <div className="feature-assistant-results">
                {answer.results.map((feature) => (
                  <article
                    key={feature.id}
                    className="feature-assistant-result-card"
                  >
                    <div className="feature-assistant-result-heading">
                      <h3>{feature.title}</h3>
                      <span className={`feature-status ${feature.status}`}>
                        {getFeatureStatusLabel(feature.status)}
                      </span>
                    </div>
                    <p>{feature.summary}</p>
                    {feature.actions.length > 0 ? (
                      <div className="feature-assistant-actions">
                        {feature.actions.map((action) => (
                          <button
                            key={action.path}
                            type="button"
                            onClick={() => go(action.path)}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  )
}
