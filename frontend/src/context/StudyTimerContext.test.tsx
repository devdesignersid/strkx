import { renderHook, act, waitFor } from '@testing-library/react';
import { useStudyTimer, StudyTimerProvider } from './StudyTimerContext';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

// Wrapper for the hook
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <StudyTimerProvider>{children}</StudyTimerProvider>
);

describe('StudyTimerContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('initializes with time from backend', async () => {
    // Mock backend response
    server.use(
      http.get('http://localhost:3000/study-stats/today', () => {
        return HttpResponse.json({ totalStudySeconds: 100 });
      })
    );

    const { result } = renderHook(() => useStudyTimer(), { wrapper });

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.time).toBe(100);
    });
  });

  it('starts and stops the timer', async () => {
    const { result } = renderHook(() => useStudyTimer(), { wrapper });

    // Wait for initial fetch (might need to advance timers if fetch uses setTimeout, but axios/msw usually don't with fake timers unless delay is set)
    // Actually, if we use fake timers, we might need to advance for promises? No.
    // But let's see.

    // We need to be careful. If we start with fake timers, the initial fetch might hang if it depends on time passing?
    // MSW responses are immediate usually.

    // Let's try to wait for initial fetch *before* using fake timers?
    // No, renderHook happens after.

    // Let's just try using fake timers.

    await waitFor(() => expect(result.current.time).toBeDefined());

    vi.useFakeTimers();

    act(() => {
      result.current.toggleTimer();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.isPaused).toBe(false);

    // Advance time by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.time).toBeGreaterThanOrEqual(5);

    act(() => {
      result.current.stopTimer();
    });

    expect(result.current.isActive).toBe(false);
  });

  it('resets the timer', async () => {
    const { result } = renderHook(() => useStudyTimer(), { wrapper });

    // Wait for initial fetch
    await waitFor(() => expect(result.current.time).toBeDefined());

    vi.useFakeTimers();

    act(() => {
      result.current.toggleTimer();
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.time).toBeGreaterThan(0);

    act(() => {
      result.current.resetTimer();
    });

    expect(result.current.time).toBe(0);
    expect(result.current.isActive).toBe(false);
  });
});
