import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProblemsPage from './pages/ProblemsPage';
import DashboardPage from './pages/DashboardPage';
import ProblemPage from './pages/ProblemPage';
import CreateProblemPage from './pages/CreateProblemPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="problems" element={<ProblemsPage />} />
          <Route path="problems/new" element={<CreateProblemPage />} />
          <Route path="problems/edit/:id" element={<CreateProblemPage />} />
          <Route path="problems/:slug" element={<ProblemPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
