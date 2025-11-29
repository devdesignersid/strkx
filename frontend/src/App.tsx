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
import { NetworkStatus } from '@/components/ui/NetworkStatus';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <GlobalErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <NetworkStatus />
          <Toaster
            position="top-right"
            theme="dark"
            expand={false}
            richColors={false}
            closeButton
            toastOptions={{
              style: {
                background: '#121212', // Darker background
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#EDEDED',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.875rem',
                padding: '1rem',
                borderRadius: '0.75rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              },
              className: 'font-sans antialiased group',
              descriptionClassName: 'text-muted-foreground text-xs mt-1 font-medium',
              actionButtonStyle: {
                background: '#40cf8f',
                color: '#000',
                fontSize: '0.75rem',
                fontWeight: 600,
              },
              cancelButtonStyle: {
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '0.75rem',
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
