import { Link } from 'react-router-dom'

export default function SiteFooter() {
  return <footer className="site-footer"><a href="/grammar">语法笔记</a> · <Link to="/manage/grammar">笔记管理</Link> · © 2026 AllôTCF. All rights reserved.</footer>
}
