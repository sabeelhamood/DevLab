import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import SimpleQuestionPage from './pages/SimpleQuestionPage'
import CompetitionPage from './pages/CompetitionPage'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<SimpleQuestionPage />} />
          <Route path="/question" element={<SimpleQuestionPage />} />
          <Route path="/competitions" element={<CompetitionPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App