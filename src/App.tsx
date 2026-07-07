import React, { Component } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

// Admin Pages
import { Dashboard } from './pages/admin/Dashboard';
import { OnlineAssessment } from './pages/admin/OnlineAssessment';
import { QuestionBank } from './pages/admin/QuestionBank';
import { Settings } from './pages/admin/Settings';
import { TestDetail } from './pages/admin/TestDetail';

// Candidate Pages
import { CandidatePortal } from './pages/candidate/CandidatePortal';
import { CandidateLogin } from './pages/candidate/CandidateLogin';
import { TakeTest } from './pages/candidate/TakeTest';

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

const ProtectedRoute: React.FC<{ allowedRole: 'admin' | 'candidate' }> = ({ allowedRole }) => {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/" replace />;
  if (currentUser.role !== allowedRole)
    return <Navigate to={currentUser.role === 'admin' ? '/admin/dashboard' : '/portal'} replace />;
  return <Outlet />;
};

const AppRoutes: React.FC = () => {
  const { currentUser } = useApp();
  return (
    <Routes>
      {/* Public auth routes */}
      <Route
        path="/"
        element={currentUser?.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Login />}
      />
      <Route
        path="/candidate"
        element={
          currentUser
            ? <Navigate to={currentUser.role === 'admin' ? '/admin/dashboard' : '/portal'} replace />
            : <CandidateLogin />
        }
      />

      {/* Protected: candidate */}
      <Route element={<ProtectedRoute allowedRole="candidate" />}>
        <Route path="/portal" element={<CandidatePortal />} />
      </Route>

      {/* Protected: admin */}
      <Route element={<ProtectedRoute allowedRole="admin" />}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route element={<Layout><Outlet /></Layout>}>
          <Route path="/admin/dashboard"         element={<Dashboard />} />
          <Route path="/admin/online-assessment" element={<OnlineAssessment />} />
          <Route path="/admin/online-assessment/:id" element={<TestDetail />} />
          <Route path="/admin/question-bank"     element={<QuestionBank />} />
          <Route path="/admin/settings"          element={<Settings />} />
        </Route>
      </Route>

      {/* Public: candidate test-access via slug */}
      <Route path="/take/:slug" element={<TakeTest />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <TooltipProvider>
          <AppRoutes />
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
