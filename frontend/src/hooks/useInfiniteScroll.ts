import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * setup an infinite scroll listener on a scrollable element.
 * Triggers onLoadMore when the user scrolls close to the bottom.
 * 
 * @param scrollRef Ref to the scrollable container element
 * @param hasMore Whether there is more data to load
 * @param isLoading Whether data is currently loading
 * @param onLoadMore Callback function to load more data
 * @param threshold Distance from bottom in pixels to trigger load (default 200)
 */
export function useInfiniteScroll(
    scrollRef: RefObject<HTMLElement | null>,
    hasMore: boolean,
    isLoading: boolean,
    onLoadMore: () => void,
    threshold: number = 200
) {
    useEffect(() => {
        const scrollElement = scrollRef.current;
        if (!scrollElement) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollElement;

            // Check if user has scrolled near the bottom
            const isNearBottom = scrollHeight - scrollTop - clientHeight < threshold;

            if (isNearBottom && hasMore && !isLoading) {
                onLoadMore();
            }
        };

        scrollElement.addEventListener('scroll', handleScroll);

        // Check initially in case the content is less than the container height
        // or the user is already at the bottom
        handleScroll();

        return () => scrollElement.removeEventListener('scroll', handleScroll);
    }, [hasMore, isLoading, onLoadMore, threshold, scrollRef]); // detailed dependency array
}
