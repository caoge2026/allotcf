import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import GuestLimitDialog from './components/GuestLimitDialog'
import SiteFooter from './components/SiteFooter'
const BookmarkedQuestionPage = lazy(
  () => import('./pages/BookmarkedQuestionPage'),
)
const ExamSetListPage = lazy(() => import('./pages/ExamSetListPage'))
const ListeningPlaceholderPage = lazy(
  () => import('./pages/ListeningPlaceholderPage'),
)
const LoginPage = lazy(() => import('./pages/LoginPage'))
const PictureSpeakingPage = lazy(() => import('./pages/PictureSpeakingPage'))
const PracticePage = lazy(() => import('./pages/PracticePage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ResultPage = lazy(() => import('./pages/ResultPage'))
const WordMatchPage = lazy(() => import('./pages/WordMatchPage'))
const WrongQuestionPage = lazy(() => import('./pages/WrongQuestionPage'))
import { useUserStore } from './stores/userStore'

const GrammarManager = lazy(() => import('./features/grammar/GrammarManager'))

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isLoggedIn = useUserStore((state) => state.isLoggedIn())
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace state={{ from: location.pathname }} />
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-frame">
        <div className="app-content">
          <Suspense fallback={<div className="loading-view">加载中...</div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/exam-sets" replace />} />
              <Route path="/manage/grammar" element={<PrivateRoute><GrammarManager /></PrivateRoute>} />
              <Route path="/manage/grammar/:id" element={<PrivateRoute><GrammarManager /></PrivateRoute>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/exam-sets"
                element={
                  <PrivateRoute>
                    <ExamSetListPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/wrong-questions"
                element={
                  <PrivateRoute>
                    <WrongQuestionPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/bookmarked-questions"
                element={
                  <PrivateRoute>
                    <BookmarkedQuestionPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/word-match"
                element={
                  <PrivateRoute>
                    <WordMatchPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/picture-speaking"
                element={
                  <PrivateRoute>
                    <PictureSpeakingPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/listening"
                element={
                  <PrivateRoute>
                    <ListeningPlaceholderPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/practice/:id"
                element={
                  <PrivateRoute>
                    <PracticePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/result/:id"
                element={
                  <PrivateRoute>
                    <ResultPage />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Suspense>
        </div>
        <SiteFooter />
        <GuestLimitDialog />
      </div>
    </BrowserRouter>
  )
}
