import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';

// Admin Pages
import { Dashboard } from './pages/admin/Dashboard';
import { CampusDrives } from './pages/admin/CampusDrives';
import { Candidates } from './pages/admin/Candidates';
import { Assessments } from './pages/admin/Assessments';
import { QuestionBank } from './pages/admin/QuestionBank';
import { InviteCandidates } from './pages/admin/InviteCandidates';
import { Interviews } from './pages/admin/Interviews';
import { Offers } from './pages/admin/Offers';
import { Reports } from './pages/admin/Reports';
import { Settings } from './pages/admin/Settings';

// Candidate Pages
import { CandidatePortal } from './pages/candidate/CandidatePortal';
import { CandidateLogin } from './pages/candidate/CandidateLogin';

const NavigationRouter: React.FC = () => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!currentUser) {
    if (hash === '#candidate') {
      return <CandidateLogin />;
    }
    return <Login />;
  }

  if (currentUser.role === 'candidate') {
    return <CandidatePortal />;
  }

  // Admin Views routing
  const renderAdminView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'campus-drives':
        return <CampusDrives />;
      case 'candidates':
        return <Candidates setActiveTab={setActiveTab} />;
      case 'assessments':
        return <Assessments />;
      case 'question-bank':
        return <QuestionBank />;
      case 'invite-candidates':
        return <InviteCandidates />;
      case 'interviews':
        return <Interviews />;
      case 'offers':
        return <Offers />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderAdminView()}
    </Layout>
  );
};

function App() {
  return (
    <AppProvider>
      <NavigationRouter />
    </AppProvider>
  );
}

export default App;
