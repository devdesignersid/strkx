
import { render, screen } from '@testing-library/react';
import { TruncatedText } from './truncated-text';
import { TooltipProvider } from '@/components/ui/tooltip';
import { vi } from 'vitest';

// Mock Tooltip components since they rely on Radix UI which might need setup
vi.mock('@/components/ui/tooltip', () => ({
    Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('TruncatedText', () => {
    it('renders full text when not truncated', () => {
        render(
            <TooltipProvider>
                <TruncatedText text="Short text" />
            </TooltipProvider>
        );
        expect(screen.getByText('Short text')).toBeInTheDocument();
    });

    it('truncates text when maxLength is exceeded', () => {
        render(
            <TooltipProvider>
                <TruncatedText text="Long text that should be truncated" maxLength={10} />
            </TooltipProvider>
        );
        expect(screen.getByText('Long text ...')).toBeInTheDocument();
    });
});
