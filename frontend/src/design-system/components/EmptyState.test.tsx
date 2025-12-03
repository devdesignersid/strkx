import { render, screen, fireEvent } from '@/test-utils';
import EmptyState from './EmptyState';
import { describe, it, expect, vi } from 'vitest';
import { AlertCircle } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        icon={AlertCircle}
        title="No items found"
        description="Try adjusting your filters"
      />
    );

    expect(screen.getByText('No items found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
  });

  it('renders action button and handles click', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        icon={AlertCircle}
        title="No items"
        description="Create one now"
        action={{ label: 'Create', onClick: handleClick }}
      />
    );

    const button = screen.getByRole('button', { name: /create/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
