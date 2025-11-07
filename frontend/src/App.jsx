import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/layout/Layout.jsx';
import PracticePage from './pages/learner/PracticePage.jsx';
import InvitationsPage from './pages/competition/InvitationsPage.jsx';
import MatchPage from './pages/competition/MatchPage.jsx';

const seedMockToken = () => {
  if (typeof window === 'undefined') return;
  const fallbackToken =
    import.meta.env.VITE_PUBLIC_LEARNER_TOKEN ||
    window.__ENV__?.VITE_PUBLIC_LEARNER_TOKEN ||
    '';

  if (!fallbackToken) return;

  const currentToken = window.localStorage.getItem('auth-token');
  if (currentToken !== fallbackToken) {
    window.localStorage.setItem('auth-token', fallbackToken);
  }
};

function App() {
  useEffect(() => {
    seedMockToken();
    const intervalId = window.setInterval(seedMockToken, 10_000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/learner/practice" replace />}
          />
          <Route path="/learner/practice" element={<PracticePage />} />
          <Route
            path="/competition/invitations"
            element={<InvitationsPage />}
          />
          <Route path="/competition/match/:matchId" element={<MatchPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
