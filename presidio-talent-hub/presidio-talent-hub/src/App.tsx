import React, { useState, useEffect, Component } from 'react';
import { AppProvider, useApp } from './context/AppContext';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#fee', color: '#800' }}>
          <h2>Runtime Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

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
    <ErrorBoundary>
      <AppProvider>
        <TooltipProvider>
          <NavigationRouter />
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
