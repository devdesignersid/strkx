import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProblemsPage from './pages/ProblemsPage';
import DashboardPage from './pages/DashboardPage';
import ProblemPage from './pages/ProblemPage';
import CreateProblemPage from './pages/CreateProblemPage';
import ListsPage from './pages/ListsPage';
import ListDetailPage from './pages/ListDetailPage';
import SettingsPage from './pages/SettingsPage';
import MockInterviewSetup from './pages/MockInterviewSetup';
import MockInterviewSession from './pages/MockInterviewSession';
import MockInterviewSummary from './pages/MockInterviewSummary';
import { Toaster } from 'sonner';
import { GlobalErrorBoundary } from '@/components/ui/GlobalErrorBoundary';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';

function App() {
  useNetworkStatus();
  return (
    <GlobalErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            position="top-right"
            theme="dark"
            expand={false}
            richColors={false}
            closeButton
            toastOptions={{
              classNames: {
                toast: 'bg-card text-foreground border-border shadow-lg',
                description: 'text-muted-foreground',
                actionButton: 'bg-primary text-primary-foreground',
                cancelButton: 'bg-muted text-muted-foreground',
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="problems" element={<ProblemsPage />} />
              <Route path="problems/new" element={<CreateProblemPage />} />
              <Route path="problems/edit/:id" element={<CreateProblemPage />} />
              <Route path="problems/:slug" element={<ProblemPage />} />
              <Route path="lists" element={<ListsPage />} />
              <Route path="lists/:id" element={<ListDetailPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="mock-interview" element={<MockInterviewSetup />} />
              <Route path="mock-interview/session/:sessionId" element={<MockInterviewSession />} />
              <Route path="mock-interview/session/:sessionId/summary" element={<MockInterviewSummary />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  );
}

export default App;
