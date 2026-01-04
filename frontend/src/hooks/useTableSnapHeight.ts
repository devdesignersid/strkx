import { useState, useEffect } from 'react';

/**
 * Calculates a container height that snaps to multiples of the row height
 * to ensure that no partial rows are displayed at the bottom of the viewport.
 * 
 * @param rowHeight Height of a single row in pixels
 * @param offsetTotal Total vertical space occupied by other elements (header, footer, padding)
 * @param minHeight Minimum height for the container
 * @returns The calculated height in pixels
 */
export function useTableSnapHeight(
    rowHeight: number,
    offsetTotal: number = 350,
    minHeight: number = 400
) {
    const [height, setHeight] = useState(minHeight);

    useEffect(() => {
        const updateHeight = () => {
            // Calculate available height based on viewport
            const available = window.innerHeight - offsetTotal;

            // Calculate how many full rows fit in that space
            const rows = Math.floor(available / rowHeight);

            // Calculate the snapped height, ensuring it meets the minimum
            const snapped = Math.max(rows * rowHeight, minHeight);

            setHeight(snapped);
        };

        // Initial calculation
        updateHeight();

        // Re-calculate on resize
        window.addEventListener('resize', updateHeight);

        return () => window.removeEventListener('resize', updateHeight);
    }, [rowHeight, offsetTotal, minHeight]);

    return height;
}
