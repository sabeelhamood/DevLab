import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import SimpleQuestionPage from './pages/SimpleQuestionPage'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<SimpleQuestionPage />} />
          <Route path="/question" element={<SimpleQuestionPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App