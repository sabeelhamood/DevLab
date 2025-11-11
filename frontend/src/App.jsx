import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import SimpleQuestionPage from './pages/SimpleQuestionPage'
import CompetitionPage from './pages/CompetitionPage'
import CompetitionInvitation from './components/CompetitionInvitation'
import CompetitionOutcome from './pages/CompetitionOutcome'
import './styles/theme-transitions.css'

function App() {
  console.log('VITE_API_URL =', import.meta.env.VITE_API_URL)
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Routes>
          <Route path="/" element={<SimpleQuestionPage />} />
          <Route path="/question" element={<SimpleQuestionPage />} />
          <Route path="/competitions" element={<CompetitionPage />} />
          <Route path="/competition/invitation" element={<CompetitionInvitation />} />
          <Route
            path="/dev/competition-outcome/:competitionId/:learnerId"
            element={<CompetitionOutcome />}
          />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App