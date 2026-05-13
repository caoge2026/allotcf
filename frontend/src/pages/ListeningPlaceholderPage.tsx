import StudyTabs from '../components/StudyTabs'

export default function ListeningPlaceholderPage() {
  return (
    <div className="app-shell">
      <section className="page-panel">
        <StudyTabs subject="listening" />
        <div className="empty-view listening-placeholder">
          <p className="page-kicker">Bientot</p>
          <h2 className="result-heading">听力即将开放</h2>
          <p>当前阶段先完成阅读套题与错题复习。听力题库、听力复盘与听力错题会在后续版本接入。</p>
        </div>
      </section>
    </div>
  )
}
