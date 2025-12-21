import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import SimpleQuestionPage from './pages/SimpleQuestionPage'
import Dashboard from './pages/learner/Dashboard'
import CompetitionIntro from './pages/competitions/CompetitionIntro.jsx'
import CompetitionPlay from './pages/competitions/CompetitionPlay.jsx'
import AssessmentPreview from './pages/AssessmentPreview.jsx'
import ContentStudioPreview from './pages/ContentStudioPreview.jsx'
import CodeContentStudioPreview from './pages/CodeContentStudioPreview.jsx'
import ValidateQuestionPreview from './pages/ValidateQuestionPreview.jsx'
import { useAuthStore } from './store/authStore.js'
import './styles/theme-transitions.css'

function App() {
  const { user } = useAuthStore()
  
  // Expose user data to window for bot initialization
  useEffect(() => {
    const token = localStorage.getItem('auth-token') || ''
    const userData = {
      id: user?.id || 'anonymous',
      token: token,
      tenantId: user?.tenantId || 'devlab'
    }
    window.APP_USER = userData
    
    // Initialize bot if script is loaded and user data is available
    if (window.initializeEducoreBot && userData.id !== 'anonymous') {
      window.initializeEducoreBot({
        microservice: 'DEVLAB',
        userId: userData.id,
        token: userData.token,
        tenantId: userData.tenantId
      })
    }
  }, [user])

  console.log('VITE_API_URL =', import.meta.env.VITE_API_URL)
  console.log('🚀 Frontend app initializing - Vercel deployment trigger', new Date().toISOString())
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/competitions/:competitionId/intro" element={<CompetitionIntro />} />
          <Route path="/competitions/:competitionId/play" element={<CompetitionPlay />} />
          <Route path="/assessment-preview" element={<AssessmentPreview />} />
          <Route
            path="/code-content-studio-preview"
            element={<CodeContentStudioPreview />}
          />
          <Route
            path="/validate-question-preview"
            element={<ValidateQuestionPreview />}
          />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App