import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import PracticePage from './pages/learner/PracticePage.jsx';
import InvitationsPage from './pages/competition/InvitationsPage.jsx';
import MatchPage from './pages/competition/MatchPage.jsx';

function App() {
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
