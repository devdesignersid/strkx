import { createPortal } from 'react-dom';

interface TagTooltipProps {
    id: string;
    x: number;
    y: number;
    tags: string[];
    position: 'top' | 'bottom';
}

export function TagTooltip({ x, y, tags, position }: TagTooltipProps) {
    if (!tags?.length) return null;

    return createPortal(
        <div
            className="fixed z-[9999] pointer-events-none"
            style={{
                left: x,
                top: y,
                transform: `translate(-50%, ${position === 'top' ? '-100%' : '0'})`,
                marginTop: position === 'bottom' ? '8px' : '-8px',
            }}
        >
            <div className="bg-popover border border-border rounded-md shadow-xl px-3 py-2 text-xs text-popover-foreground w-max max-w-md">
                {Array.from({ length: Math.ceil(tags.length / 4) }).map((_, i) => (
                    <div key={i} className="whitespace-nowrap">
                        {tags.slice(i * 4, (i + 1) * 4).join(', ')}
                    </div>
                ))}
            </div>
        </div>,
        document.body
    );
}
