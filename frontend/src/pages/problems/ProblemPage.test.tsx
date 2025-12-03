import { render, screen, waitFor, fireEvent } from '@/test-utils';
import { API_URL } from '@/config';
import { Route, Routes } from 'react-router-dom';
import ProblemPage from './ProblemPage';
import { describe, it, expect, vi } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

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
        div: ({ children, initial, animate, exit, variants, transition, ...props }: any) => <div {...props}>{children}</div>,
        button: ({ children, whileHover, whileTap, ...props }: any) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ProblemPage', () => {
    it('renders problem details', async () => {
        server.use(
            http.get(`${API_URL}/problems/two-sum`, () => {
                return HttpResponse.json({
                    data: {
                        id: '1',
                        title: 'Two Sum',
                        slug: 'two-sum',
                        description: 'Given an array of integers...',
                        difficulty: 'Easy',
                        starterCode: 'function twoSum(nums, target) {}',
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

        render(
            <Routes>
                <Route path="/problems/:slug" element={<ProblemPage />} />
            </Routes>,
            {
                initialEntries: ['/problems/two-sum'],
            }
        );

        await waitFor(() => {
            const headings = screen.getAllByRole('heading');
            const titleHeading = headings.find(h => h.textContent?.includes('Two Sum'));
            expect(titleHeading).toBeInTheDocument();
        });
    });

    it('handles run code execution', async () => {
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
            }),
            http.post(`${API_URL}/execution`, () => {
                return HttpResponse.json({
                    data: {
                        passed: true,
                        results: [],
                        output: 'Success',
                    }
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
            const headings = screen.getAllByRole('heading');
            const titleHeading = headings.find(h => h.textContent?.includes('Two Sum'));
            expect(titleHeading).toBeInTheDocument();
        });

        const runButton = screen.getByText('Run');
        fireEvent.click(runButton);

        await waitFor(() => {
            expect(screen.getByText('All Test Cases Passed')).toBeInTheDocument();
        });
    });
});

