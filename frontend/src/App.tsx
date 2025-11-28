import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProblemsPage from './pages/ProblemsPage';
import DashboardPage from './pages/DashboardPage';
import ProblemPage from './pages/ProblemPage';
import CreateProblemPage from './pages/CreateProblemPage';
import ListsPage from './pages/ListsPage';
import ListDetailPage from './pages/ListDetailPage';
import SettingsPage from './pages/SettingsPage';
import { Toaster } from 'sonner';
import { GlobalErrorBoundary } from '@/components/ui/GlobalErrorBoundary';
import { NetworkStatus } from '@/components/ui/NetworkStatus';
import FloatingTimer from './components/StudyTimer/FloatingTimer';
import ReminderSystem from './components/StudyTimer/ReminderSystem';

function App() {
  return (
    <GlobalErrorBoundary>
      <BrowserRouter>
        <NetworkStatus />
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#1C1C1C', // bg-card
              border: '1px solid #2E2E2E', // border-border
              color: '#EDEDED', // text-foreground
            },
            className: 'font-sans',
          }}
        />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="problems" element={<ProblemsPage />} />
            <Route path="problems/new" element={<CreateProblemPage />} />
            <Route path="problems/edit/:id" element={<CreateProblemPage />} />
            <Route path="problems/:slug" element={<ProblemPage />} />
            <Route path="lists" element={<ListsPage />} />
            <Route path="lists/:id" element={<ListDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
        <FloatingTimer />
        <ReminderSystem />
      </BrowserRouter>
    </GlobalErrorBoundary>
  );
}

export default App;
