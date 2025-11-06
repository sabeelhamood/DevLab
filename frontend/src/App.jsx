import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import PracticePage from './pages/PracticePage.jsx';
import CompetitionPage from './pages/CompetitionPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import Header from './components/layout/Header.jsx';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-bg-primary" style={{ backgroundColor: '#ff0000', minHeight: '100vh' }}>
          <Header />
          <Routes>
            <Route path="/" element={<PracticePage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/competition" element={<CompetitionPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;





