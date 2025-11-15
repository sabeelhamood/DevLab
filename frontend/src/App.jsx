import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import SimpleQuestionPage from './pages/SimpleQuestionPage'
import Dashboard from './pages/learner/Dashboard'
import './styles/theme-transitions.css'

function App() {
  console.log('VITE_API_URL =', import.meta.env.VITE_API_URL)
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Routes>
          <Route path="/" element={<SimpleQuestionPage />} />
          <Route path="/question" element={<SimpleQuestionPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App