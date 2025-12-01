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
import SystemDesignListPage from './pages/system-design/SystemDesignListPage';
import SystemDesignProblemView from './pages/system-design/SystemDesignProblemView';
import CreateSystemDesignPage from './pages/system-design/CreateSystemDesignPage';
import { Toaster } from 'sonner';
import { GlobalErrorBoundary } from '@/components/ui/GlobalErrorBoundary';
import { Suspense, lazy } from 'react';

const ExcalidrawCanvasPage = lazy(() => import('./pages/system-design/ExcalidrawCanvasPage'));

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
            <Route path="/excalidraw-canvas" element={
              <Suspense fallback={<div className="h-screen w-screen bg-[#151515]" />}>
                <ExcalidrawCanvasPage />
              </Suspense>
            } />
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
              <Route path="system-design" element={<SystemDesignListPage />} />
              <Route path="system-design/new" element={<CreateSystemDesignPage />} />
              <Route path="system-design/edit/:id" element={<CreateSystemDesignPage />} />
              <Route path="system-design/:id" element={<SystemDesignProblemView />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  );
}

export default App;
