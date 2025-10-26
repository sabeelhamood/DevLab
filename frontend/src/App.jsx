import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import SimpleQuestionPage from './pages/SimpleQuestionPage'
import CompetitionPage from './pages/CompetitionPage'
import CompetitionDetail from './pages/competition/CompetitionDetail'
import CompetitionQuestionEnhanced from './components/CompetitionQuestionEnhanced'
import CompetitionInvitation from './components/CompetitionInvitation'
import CompetitionResultsEnhanced from './components/CompetitionResultsEnhanced'
import MockCompetitionGameplay from './pages/MockCompetitionGameplay'
import './styles/theme-transitions.css'

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Routes>
          <Route path="/" element={<SimpleQuestionPage />} />
          <Route path="/question" element={<SimpleQuestionPage />} />
          <Route path="/competitions" element={<CompetitionPage />} />
          <Route path="/competition/invitation" element={<CompetitionInvitation />} />
          <Route path="/competition/:id" element={<CompetitionDetail />} />
          <Route path="/competition/:id/question/:questionId" element={<CompetitionQuestionEnhanced />} />
          <Route path="/competition/:id/results" element={<CompetitionResultsEnhanced />} />
          <Route path="/mock-competition/:competitionId/question/:questionId" element={<MockCompetitionGameplay />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App