import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CreateSystemDesignPage from './CreateSystemDesignPage';
import { systemDesignApi } from '@/services/api/system-design.service';
import { aiService } from '@/lib/ai/aiService';

// Mock API and AI Service
vi.mock('@/features/system-design/api/systemDesignApi', () => ({
    systemDesignApi: {
        getProblem: vi.fn(),
        createProblem: vi.fn(),
        updateProblem: vi.fn(),
    }
}));

vi.mock('@/lib/ai/aiService', () => ({
    aiService: {
        loadFromStorage: vi.fn(),
        isEnabled: vi.fn(),
        isConfigured: vi.fn(),
        generateCompletion: vi.fn(),
    }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('CreateSystemDesignPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (aiService.isEnabled as any).mockReturnValue(false);
    });

    it('renders the create form', () => {
        render(
            <MemoryRouter>
                <CreateSystemDesignPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Create System Design Problem')).toBeInTheDocument();
        expect(screen.getByLabelText('Title')).toBeInTheDocument();
        expect(screen.getByLabelText('Slug')).toBeInTheDocument();
        expect(screen.getByText('Save Problem')).toBeInTheDocument();
    });

    it('updates form data on input change', () => {
        render(
            <MemoryRouter>
                <CreateSystemDesignPage />
            </MemoryRouter>
        );

        const titleInput = screen.getByLabelText('Title');
        fireEvent.change(titleInput, { target: { value: 'Design Facebook' } });

        expect(titleInput).toHaveValue('Design Facebook');
        expect(screen.getByLabelText('Slug')).toHaveValue('design-facebook');
    });

    it('submits the form successfully', async () => {
        (systemDesignApi.createProblem as any).mockResolvedValue({});

        render(
            <MemoryRouter>
                <CreateSystemDesignPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Design Facebook' } });
        fireEvent.click(screen.getByText('Save Problem'));

        await waitFor(() => {
            expect(systemDesignApi.createProblem).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Design Facebook',
                slug: 'design-facebook',
                difficulty: 'Medium',
                defaultDuration: 45
            }));
            expect(mockNavigate).toHaveBeenCalledWith('/system-design');
        });
    });

    it('fetches problem data in edit mode', async () => {
        const mockProblem = {
            id: '123',
            title: 'Existing Problem',
            slug: 'existing-problem',
            difficulty: 'Hard',
            tags: ['Distributed Systems'],
            description: 'Existing description',
            defaultDuration: 60
        };
        (systemDesignApi.getProblem as any).mockResolvedValue(mockProblem);

        render(
            <MemoryRouter initialEntries={['/system-design/edit/123']}>
                <Routes>
                    <Route path="/system-design/edit/:id" element={<CreateSystemDesignPage />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByLabelText('Title')).toHaveValue('Existing Problem');
            expect(screen.getByText('Hard')).toBeInTheDocument();
        });
    });

    it('shows AI generation button when enabled', () => {
        (aiService.isEnabled as any).mockReturnValue(true);

        render(
            <MemoryRouter>
                <CreateSystemDesignPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Auto-Complete with AI')).toBeInTheDocument();
    });
});
