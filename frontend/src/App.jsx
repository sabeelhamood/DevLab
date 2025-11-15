import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import SimpleQuestionPage from './pages/SimpleQuestionPage'
import './styles/theme-transitions.css'

function App() {
  console.log('VITE_API_URL =', import.meta.env.VITE_API_URL)
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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