import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import App from './App.tsx'
import { StudyTimerProvider } from '../context/StudyTimerContext.tsx';

import ErrorBoundary from '../components/ErrorBoundary.tsx';

import { ThemeProvider } from '../design-system/ThemeProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <StudyTimerProvider>
          <App />
        </StudyTimerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
