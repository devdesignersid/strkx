import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@/design-system/ThemeProvider';
import { Suspense, lazy } from 'react';
import { Toaster } from 'sonner';
import { GlobalErrorBoundary } from '@/components/ui/GlobalErrorBoundary';
import { AuthProvider } from '../context/AuthContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { LoadingThunder } from '@/design-system/components';

// Eager imports for critical routes
import Layout from './Layout';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import AuthCallbackPage from '../pages/auth/AuthCallbackPage';
import DashboardPage from '../pages/dashboard/DashboardPage';

// Lazy imports for heavy pages
const ProblemsPage = lazy(() => import('../pages/problems/ProblemsPage'));
const ProblemPage = lazy(() => import('../pages/problems/ProblemPage'));
const CreateProblemPage = lazy(() => import('../pages/problems/CreateProblemPage'));
const ListsPage = lazy(() => import('../pages/lists/ListsPage'));
const ListDetailPage = lazy(() => import('../pages/lists/ListDetailPage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
const MockInterviewSetup = lazy(() => import('../pages/interview/MockInterviewSetup'));
const MockInterviewSession = lazy(() => import('../pages/interview/MockInterviewSession'));
const MockInterviewSummary = lazy(() => import('../pages/interview/MockInterviewSummary'));
const SystemDesignListPage = lazy(() => import('../pages/system-design/SystemDesignListPage'));
const SystemDesignProblemView = lazy(() => import('../pages/system-design/SystemDesignProblemView'));
const CreateSystemDesignPage = lazy(() => import('../pages/system-design/CreateSystemDesignPage'));
const ExcalidrawCanvasPage = lazy(() => import('../pages/system-design/ExcalidrawCanvasPage'));
const ResumeBuilderPage = lazy(() => import('../pages/resume-builder/ResumeBuilderPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 1000, // 10 seconds - data is fresh for 10s, then refetch on access
      gcTime: 15 * 60 * 1000, // 15 minutes - keep data in cache for background reuse
      refetchOnWindowFocus: false,
      refetchOnMount: 'always', // Always refetch when component mounts (navigating to page)
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingThunder size="xl" />
  </div>
);

function App() {
  useNetworkStatus();
  return (
    <GlobalErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
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
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
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
                    <Route path="resume" element={<ResumeBuilderPage />} />
                  </Route>
                </Routes>
              </Suspense>
            </AuthProvider>
          </ThemeProvider>
          {/* React Query DevTools - only in development */}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </BrowserRouter>
    </GlobalErrorBoundary>
  );
}

export default App;
