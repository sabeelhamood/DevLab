import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/learner/Dashboard'
import PracticeSession from './pages/learner/PracticeSession'
import Competition from './pages/learner/Competition'
import TrainerDashboard from './pages/trainer/TrainerDashboard'
import QuestionManagement from './pages/trainer/QuestionManagement'
import Analytics from './pages/trainer/Analytics'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import SystemMonitoring from './pages/admin/SystemMonitoring'
import LoadingSpinner from './components/ui/LoadingSpinner'

function App() {
  const { user, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        {/* Learner Routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/practice" element={<PracticeSession />} />
        <Route path="/competition" element={<Competition />} />
        
        {/* Trainer Routes */}
        {user.role === 'trainer' && (
          <>
            <Route path="/trainer" element={<TrainerDashboard />} />
            <Route path="/trainer/questions" element={<QuestionManagement />} />
            <Route path="/trainer/analytics" element={<Analytics />} />
          </>
        )}
        
        {/* Admin Routes */}
        {user.role === 'admin' && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/monitoring" element={<SystemMonitoring />} />
          </>
        )}
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App

