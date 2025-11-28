import { render, fireEvent } from '@/test-utils';
import { NetworkStatus } from './NetworkStatus';
import { describe, it, expect, vi } from 'vitest';
import { toast } from 'sonner';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

describe('NetworkStatus', () => {
  it('shows error toast when offline', () => {
    render(<NetworkStatus />);

    fireEvent(window, new Event('offline'));

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('You are offline'),
      expect.any(Object)
    );
  });

  it('shows success toast when online', () => {
    render(<NetworkStatus />);

    fireEvent(window, new Event('online'));

    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('You are back online'),
      expect.any(Object)
    );
  });
});
