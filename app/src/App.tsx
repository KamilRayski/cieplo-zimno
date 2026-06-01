import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import MainLayout from './components/layout/MainLayout'
import AuthScreen from './pages/AuthScreen'
import ChangePasswordScreen from './pages/ChangePasswordScreen'
import ContactScreen from './pages/ContactScreen'
import HomeScreen from './pages/HomeScreen'
import GameScreen from './pages/GameScreen'
import RankingScreen from './pages/RankingScreen'
import ArchiveScreen from './pages/ArchiveScreen'
import CalendarScreen from './pages/CalendarScreen'
import InfoScreen from './pages/InfoScreen'
import SettingsScreen from './pages/SettingsScreen'
import FriendsScreen from './pages/FriendsScreen'
import ResultScreen from './pages/ResultScreen'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <div className="app-shell">
      <div className="glow glow--hot" aria-hidden="true" />
      <div className="glow glow--cold" aria-hidden="true" />
      <div className="glow glow--ember" aria-hidden="true" />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthScreen mode="login" />} />
        <Route path="/register" element={<AuthScreen mode="register" />} />
        <Route
          path="/change-password"
          element={
            <RequireAuth>
              <ChangePasswordScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/contact"
          element={
            <RequireAuth>
              <ContactScreen />
            </RequireAuth>
          }
        />
        <Route
          path="/home"
          element={
            <RequireAuth>
              <MainLayout>
                <HomeScreen />
              </MainLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/game"
          element={
            <RequireAuth>
              <MainLayout>
                <GameScreen />
              </MainLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/ranking"
          element={
            <RequireAuth>
              <MainLayout>
                <RankingScreen />
              </MainLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/archive"
          element={
            <RequireAuth>
              <MainLayout>
                <ArchiveScreen />
              </MainLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/calendar"
          element={
            <RequireAuth>
              <MainLayout>
                <CalendarScreen />
              </MainLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/info"
          element={
            <RequireAuth>
              <MainLayout>
                <InfoScreen />
              </MainLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <MainLayout>
                <SettingsScreen />
              </MainLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/friends"
          element={
            <RequireAuth>
              <MainLayout>
                <FriendsScreen />
              </MainLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/result"
          element={
            <RequireAuth>
              <MainLayout showHeader={false}>
                <ResultScreen />
              </MainLayout>
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}
