import { useRef, useMemo, useEffect } from 'react';

/**
 * Creates a stable callback reference that doesn't change between renders.
 * Unlike useCallback, this doesn't require a dependency array and is safe from stale closures.
 * 
 * @example
 * ```tsx
 * const handleClick = useStableCallback((id: string) => {
 *   // Always uses latest state/props without re-creating the function
 *   console.log(someState, id);
 * });
 * ```
 * 
 * @param callback - The callback function to stabilize
 * @returns A stable function reference
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
    const callbackRef = useRef(callback);

    // Update ref on every render to capture latest closure
    callbackRef.current = callback;

    // Return stable function that calls the latest callback
    return useMemo(
        () => ((...args: any[]) => callbackRef.current(...args)) as T,
        []
    );
}

/**
 * Creates a safe interval with automatic cleanup on unmount.
 * Prevents common memory leaks from forgotten clearInterval calls.
 * 
 * @example
 * ```tsx
 * const [count, setCount] = useState(0);
 * 
 * useSafeInterval(() => {
 *   setCount(c => c + 1);
 * }, isRunning ? 1000 : null); // null pauses the interval
 * ```
 * 
 * @param callback - Function to call on each interval
 * @param delay - Delay in milliseconds, or null to pause
 */
export function useSafeInterval(
    callback: () => void,
    delay: number | null
): void {
    const savedCallback = useRef(callback);

    // Update callback ref on each render
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval
    useEffect(() => {
        if (delay === null) return;

        const id = setInterval(() => savedCallback.current(), delay);

        // CRITICAL: Automatic cleanup prevents memory leaks
        return () => clearInterval(id);
    }, [delay]);
}

/**
 * Creates a safe timeout with automatic cleanup on unmount.
 * Prevents common memory leaks from forgotten clearTimeout calls.
 * 
 * @example
 * ```tsx
 * useSafeTimeout(() => {
 *   console.log('Delayed action');
 * }, 1000);
 * ```
 * 
 * @param callback - Function to call after delay
 * @param delay - Delay in milliseconds, or null to cancel
 */
export function useSafeTimeout(
    callback: () => void,
    delay: number | null
): void {
    const savedCallback = useRef(callback);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (delay === null) return;

        const id = setTimeout(() => savedCallback.current(), delay);

        // CRITICAL: Automatic cleanup prevents memory leaks
        return () => clearTimeout(id);
    }, [delay]);
}

/**
 * Adds an event listener with automatic cleanup on unmount.
 * Prevents memory leaks from forgotten removeEventListener calls.
 * 
 * @example
 * ```tsx
 * useEventListener('resize', () => {
 *   setWidth(window.innerWidth);
 * });
 * ```
 * 
 * @param eventName - Name of the event to listen for
 * @param handler - Event handler function
 * @param element - Element to attach listener to (defaults to window)
 */
export function useEventListener<K extends keyof WindowEventMap>(
    eventName: K,
    handler: (event: WindowEventMap[K]) => void,
    element: Window | HTMLElement = window
): void {
    const savedHandler = useRef(handler);

    useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    useEffect(() => {
        const eventListener = (event: Event) => savedHandler.current(event as WindowEventMap[K]);

        element.addEventListener(eventName, eventListener as EventListener);

        // CRITICAL: Automatic cleanup prevents memory leaks
        return () => {
            element.removeEventListener(eventName, eventListener as EventListener);
        };
    }, [eventName, element]);
}

/**
 * Debounces a value with automatic cleanup.
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // Only runs when debounced value changes
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 * 
 * @param value - Value to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useRef(value).current as any;

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // CRITICAL: Cleanup timeout on value or delay change
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}
