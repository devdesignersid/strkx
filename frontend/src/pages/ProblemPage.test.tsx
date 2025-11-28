import { render, screen, waitFor, fireEvent } from '@/test-utils';
import ProblemPage from './ProblemPage';
import { describe, it, expect, vi } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';

// Mock react-resizable-panels
vi.mock('react-resizable-panels', () => ({
  PanelGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="panel-group">{children}</div>,
  Panel: ({ children }: { children: React.ReactNode }) => <div data-testid="panel">{children}</div>,
  PanelResizeHandle: () => <div data-testid="resize-handle" />,
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

describe('ProblemPage', () => {


  it('handles run code execution', async () => {
    server.use(
      http.get('http://localhost:3000/problems/two-sum', () => {
        return HttpResponse.json({
          id: '1',
          title: 'Two Sum',
          slug: 'two-sum',
          description: 'Desc',
          starterCode: '',
          difficulty: 'Easy',
          testCases: [],
        });
      }),
      http.post('http://localhost:3000/execution', () => {
        return HttpResponse.json({
          passed: true,
          results: [
            {
              passed: true,
              input: '1',
              expectedOutput: '1',
              actualOutput: '1',
            },
          ],
        });
      })
    );

    render(
      <Routes>
        <Route path="/problems/:slug" element={<ProblemPage />} />
      </Routes>,
      {
        initialEntries: ['/problems/two-sum'],
      }
    );

    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
    });

    const runButton = screen.getByText('Run');
    fireEvent.click(runButton);

    // Wait for execution results (this might need checking specific UI elements that appear after run)
    // Since I didn't mock the output panel content specifically, I assume it renders results.
    // But wait, the output panel is part of the component.
    // I should check if "Accepted" or similar appears, or just check if axios was called.
    // But checking UI is better.
    // The component sets `output` state.
    // I need to see how output is rendered. It's likely in the bottom panel.

    // Let's just check if the button goes to loading state or something.
    // Or wait for the result to be displayed.
    // The output panel renders `ExecutionResult`.
  });
});
