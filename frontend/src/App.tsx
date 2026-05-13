import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import GuestLimitDialog from './components/GuestLimitDialog'
import SiteFooter from './components/SiteFooter'
import BookmarkedQuestionPage from './pages/BookmarkedQuestionPage'
import ExamSetListPage from './pages/ExamSetListPage'
import ListeningPlaceholderPage from './pages/ListeningPlaceholderPage'
import LoginPage from './pages/LoginPage'
import PictureSpeakingPage from './pages/PictureSpeakingPage'
import PracticePage from './pages/PracticePage'
import RegisterPage from './pages/RegisterPage'
import ResultPage from './pages/ResultPage'
import WordMatchPage from './pages/WordMatchPage'
import WrongQuestionPage from './pages/WrongQuestionPage'
import { useUserStore } from './stores/userStore'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn())
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-frame">
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Navigate to="/exam-sets" replace />} />
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
        </div>
        <SiteFooter />
        <GuestLimitDialog />
      </div>
    </BrowserRouter>
  )
}
