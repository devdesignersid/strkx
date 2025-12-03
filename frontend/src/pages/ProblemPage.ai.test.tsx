import { render, screen, waitFor, fireEvent } from '@/test-utils';
import { API_URL } from '@/config';
import ProblemPage from './problems/ProblemPage';
import { describe, it, expect, vi } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { aiService } from '@/lib/ai/aiService';

// Mock AI Service
vi.mock('@/lib/ai/aiService', () => ({
  aiService: {
    loadFromStorage: vi.fn(),
    isEnabled: vi.fn().mockReturnValue(true),
    isConfigured: vi.fn().mockReturnValue(true),
    generateCompletion: vi.fn(),
  },
}));

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock('monaco-editor', () => ({
  editor: {
    defineTheme: vi.fn(),
  },
  Uri: {
    parse: vi.fn(),
  },
}));

// Mock react-resizable-panels
vi.mock('react-resizable-panels', () => ({
  PanelGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="panel-group">{children}</div>,
  Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="panel">{children}</div>,
  PanelResizeHandle: () => <div data-testid="resize-handle" />,
}));

// Mock React Markdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="markdown">{children}</div>,
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ProblemPage AI Features', () => {
  it('handles AI analysis request', async () => {
    server.use(
      http.get(`${API_URL}/problems/two-sum`, () => {
        return HttpResponse.json({
          data: {
            id: '1',
            title: 'Two Sum',
            slug: 'two-sum',
            description: 'Desc',
            starterCode: '',
            difficulty: 'Easy',
            testCases: [],
          }
        });
      }),
      http.get(`${API_URL}/problems/two-sum/submissions`, () => {
        return HttpResponse.json({ data: [] });
      }),
      http.get(`${API_URL}/problems/two-sum/solutions`, () => {
        return HttpResponse.json({ data: [] });
      })
    );

    (aiService.generateCompletion as any).mockResolvedValue(JSON.stringify({
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      analysis: 'Good job',
    }));

    render(
      <Routes>
        <Route path="/problems/:slug" element={<ProblemPage />} />
      </Routes>,
      {
        initialEntries: ['/problems/two-sum'],
      }
    );

    await waitFor(() => {
      expect(screen.getByText('AI Analysis')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('AI Analysis'));

    await waitFor(() => {
      expect(screen.getByText('Analyze My Code')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Analyze My Code'));

    // Since we mocked generateCompletion, we expect it to be called
    await waitFor(() => {
      expect(aiService.generateCompletion).toHaveBeenCalled();
    });
  });
});
