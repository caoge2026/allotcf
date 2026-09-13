import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { grammarApi, type Draft, type Note, type Page, type Topic } from './api'
import './grammar.css'
const empty: Draft = {
  slug: '',
  title: '',
  summary: '',
  body: '',
  level: '',
  topics: [],
  expectedVersion: 0,
}
const formOf = (n: Note): Draft => ({
  slug: n.slug,
  title: n.title,
  summary: n.summary,
  body: n.body,
  level: n.level,
  topics: n.topics,
  expectedVersion: n.version,
})
const labels: Record<string, string> = {
  PUBLIC: '已公开',
  PRIVATE: '私人草稿',
  ARCHIVED: '已归档',
}
export default function GrammarManager() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [role, setRole] = useState('')
  const [topics, setTopics] = useState<Topic[]>([])
  const [reload, setReload] = useState(0)
  const [page, setPage] = useState(0)
  const [listing, setListing] = useState<Page>()
  const [note, setNote] = useState<Note>()
  const [form, setForm] = useState<Draft>(empty)
  const [dirty, setDirty] = useState(false)
  const [preview, setPreview] = useState<Note>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loaded, setLoaded] = useState(false)
  const fail = (e: unknown) =>
    setError(
      (e as { response?: { data?: { error?: string } } }).response?.data
        ?.error || '操作失败，请重试；未保存的内容仍保留在编辑器中。',
    )
  useEffect(() => {
    let live = true
    grammarApi
      .me()
      .then((x) => {
        if (live) setRole(x.role)
      })
      .catch((e) => {
        if (live) fail(e)
      })
    return () => {
      live = false
    }
  }, [])
  useEffect(() => {
    if (role !== 'AUTHOR') return
    let live = true
    setLoaded(false)
    setError('')
    setMessage('')
    setPreview(undefined)
    Promise.all([
      grammarApi.topics(),
      id && id !== 'new' ? grammarApi.get(id) : Promise.resolve(undefined),
      !id ? grammarApi.list(page) : Promise.resolve(undefined),
    ])
      .then(([t, n, l]) => {
        if (!live) return
        setTopics(t)
        setNote(n)
        setForm(n ? formOf(n) : empty)
        setDirty(false)
        setListing(l)
        setLoaded(true)
      })
      .catch((e) => {
        if (live) fail(e)
      })
    return () => {
      live = false
    }
  }, [id, page, role, reload])
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  function go(path: string) {
    if (!dirty || window.confirm('尚有未保存的修改，确定离开？')) navigate(path)
  }
  function edit<K extends keyof Draft>(key: K, value: Draft[K]) {
    setForm({ ...form, [key]: value })
    setDirty(true)
    setPreview(undefined)
    setMessage('')
  }
  async function run(action: string) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (action === 'preview' && note) {
        setPreview(await grammarApi.action(note, action))
        setMessage('正在预览已保存的草稿。')
      } else {
        const next =
          action === 'save'
            ? await grammarApi.save(note?.id, form)
            : await grammarApi.action(note!, action)
        setNote(next)
        setForm(formOf(next))
        setDirty(false)
        setPreview(undefined)
        setMessage(
          action === 'save'
            ? '草稿已保存。'
            : action === 'publish'
              ? '已发布，可打开公开页面查看。'
              : '状态已更新。',
        )
        if (id === 'new')
          navigate(`/manage/grammar/${next.id}`, { replace: true })
      }
    } catch (e) {
      fail(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="grammar-manager">
      <header>
        <a
          href="/grammar"
          onClick={(e) => {
            if (dirty && !window.confirm('尚有未保存的修改，确定离开？'))
              e.preventDefault()
          }}
        >
          ← 公开笔记
        </a>
        <span>AllôTCF · 写作空间</span>
      </header>
      <h1>{id ? '编辑语法笔记' : '我的语法笔记'}</h1>
      {error && (
        <div role="alert">
          {error}
          {role === 'AUTHOR' && (
            <button
              disabled={busy}
              onClick={() => {
                if (
                  !dirty ||
                  window.confirm('重新加载会放弃未保存的文字，确定继续？')
                )
                  setReload(reload + 1)
              }}
            >
              重新加载
            </button>
          )}
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {!role ? (
        <p>正在确认编辑权限…</p>
      ) : role !== 'AUTHOR' ? (
        <p>当前账户尚未开通笔记编辑权限。</p>
      ) : !loaded ? (
        <p>正在加载…</p>
      ) : !id ? (
        <>
          <button onClick={() => go('/manage/grammar/new')}>新建笔记</button>
          <div className="note-list">
            {listing?.items.map((n) => (
              <button key={n.id} onClick={() => go(`/manage/grammar/${n.id}`)}>
                <strong>{n.title}</strong>
                <span>{labels[n.visibility]}</span>
              </button>
            ))}
            {!listing?.items.length && (
              <p>还没有笔记。从今天学到的一条语法开始。</p>
            )}
          </div>
          <nav>
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>
              上一页
            </button>
            <button
              disabled={!listing?.hasMore}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </button>
          </nav>
        </>
      ) : (
        <>
          <div className="note-toolbar">
            <button disabled={busy} onClick={() => go('/manage/grammar')}>
              返回列表
            </button>
            <span>
              {note ? labels[note.visibility] : '新草稿'}
              {dirty ? ' · 未保存' : ''}
            </span>
            {note?.visibility === 'PUBLIC' && (
              <a
                href={`/grammar/${note.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                查看公开版本 ↗
              </a>
            )}
          </div>
          <fieldset disabled={busy || note?.visibility === 'ARCHIVED'}>
            <label>
              标题
              <input
                value={form.title}
                maxLength={200}
                onChange={(e) => edit('title', e.target.value)}
              />
            </label>
            <label>
              页面地址
              <input
                value={form.slug}
                disabled={note?.publishedRevisionId != null}
                placeholder="例如 passe-compose"
                maxLength={120}
                onChange={(e) => edit('slug', e.target.value)}
              />
              <small>
                使用小写英文字母、数字和连字符。第一次发布后地址固定。
              </small>
            </label>
            <label>
              摘要
              <textarea
                value={form.summary}
                maxLength={400}
                rows={2}
                onChange={(e) => edit('summary', e.target.value)}
              />
            </label>
            <label>
              级别
              <select
                value={form.level}
                onChange={(e) => edit('level', e.target.value)}
              >
                {['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((x) => (
                  <option key={x} value={x}>
                    {x || '不指定'}
                  </option>
                ))}
              </select>
            </label>
            <div className="note-topics">
              主题（最多 5 个）
              {topics.map((t) => (
                <label key={t.id}>
                  <input
                    type="checkbox"
                    checked={form.topics.includes(t.id)}
                    onChange={(e) =>
                      edit(
                        'topics',
                        e.target.checked
                          ? [...form.topics, t.id]
                          : form.topics.filter((x) => x !== t.id),
                      )
                    }
                  />
                  {t.name}
                </label>
              ))}
            </div>
            <label>
              正文（Markdown）
              <textarea
                className="note-body"
                rows={18}
                value={form.body}
                maxLength={100000}
                placeholder={
                  '## 今天学到的规则\n\n规则解释、法语例句、易错点与参考来源…'
                }
                onChange={(e) => edit('body', e.target.value)}
              />
            </label>
            <small>
              支持标题、列表、引用和链接。保存草稿后可预览；修改草稿不会改变线上版本。
            </small>
          </fieldset>
          <div className="note-actions">
            <button
              disabled={
                busy || note?.visibility === 'ARCHIVED' || (!dirty && !!note)
              }
              onClick={() => run('save')}
            >
              保存草稿
            </button>
            <button
              disabled={busy || dirty || !note}
              onClick={() => run('preview')}
            >
              预览草稿
            </button>
            <button
              disabled={
                busy ||
                dirty ||
                !note ||
                note.visibility === 'ARCHIVED' ||
                preview?.revisionId !== note.revisionId
              }
              onClick={() => run('publish')}
            >
              发布此版本
            </button>
            {note?.visibility === 'PUBLIC' && (
              <button disabled={busy || dirty} onClick={() => run('unpublish')}>
                取消公开
              </button>
            )}
            {note && note.visibility !== 'ARCHIVED' && (
              <button
                disabled={busy || dirty}
                onClick={() => {
                  if (
                    window.confirm(
                      '归档后将停止公开，并保留笔记内容。确定归档？',
                    )
                  )
                    run('archive')
                }}
              >
                归档
              </button>
            )}
            {note?.visibility === 'ARCHIVED' && (
              <button disabled={busy} onClick={() => run('unpublish')}>
                恢复为私人草稿
              </button>
            )}
          </div>
          {preview && (
            <section className="note-preview" aria-label="草稿预览">
              <p>草稿预览 · 尚未发布</p>
              <h2>{preview.title}</h2>
              <p>{preview.summary}</p>
              <div dangerouslySetInnerHTML={{ __html: preview.html }} />
            </section>
          )}
        </>
      )}
    </main>
  )
}
