import { render, screen, waitFor } from '@/test-utils';
import MockInterviewSession from './MockInterviewSession';
import { describe, it, expect, vi } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';

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

describe('MockInterviewSession', () => {
  it('renders session and loads question', async () => {
    server.use(
      http.get('http://localhost:3000/interview-sessions/session-123', () => {
        return HttpResponse.json({
          id: 'session-123',
          status: 'IN_PROGRESS',
          questionCount: 2,
          questions: [
            {
              id: 'q1',
              status: 'IN_PROGRESS',
              problem: {
                id: 'p1',
                title: 'Problem 1',
                description: 'Desc 1',
                starterCode: 'code 1',
                difficulty: 'Easy',
              },
              startTime: new Date().toISOString(),
            },
          ],
        });
      })
    );

    render(
      <Routes>
        <Route path="/mock-interview/session/:sessionId" element={<MockInterviewSession />} />
      </Routes>,
      {
        initialEntries: ['/mock-interview/session/session-123'],
      }
    );

    await waitFor(() => {
      expect(screen.getByText('Problem 1')).toBeInTheDocument();
      expect(screen.getByText('MOCK INTERVIEW')).toBeInTheDocument();
    });
  });
});
