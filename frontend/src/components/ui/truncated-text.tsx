import * as React from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TruncatedTextProps extends React.HTMLAttributes<HTMLSpanElement> {
    text: string;
    maxLength?: number;
    lines?: number;
    showTooltip?: boolean;
}

export function TruncatedText({
    text,
    maxLength,
    lines = 1,
    showTooltip = true,
    className,
    ...props
}: TruncatedTextProps) {
    const [isTruncated, setIsTruncated] = React.useState(false);
    const textRef = React.useRef<HTMLSpanElement>(null);

    React.useLayoutEffect(() => {
        const checkTruncation = () => {
            const element = textRef.current;
            if (!element) return;

            const isOverflowing =
                element.scrollWidth > element.clientWidth ||
                element.scrollHeight > element.clientHeight;

            setIsTruncated(isOverflowing || (maxLength !== undefined && text.length > maxLength));
        };

        checkTruncation();
        window.addEventListener('resize', checkTruncation);
        return () => window.removeEventListener('resize', checkTruncation);
    }, [text, maxLength, lines]);

    const displayText = maxLength && text.length > maxLength
        ? `${text.slice(0, maxLength)}...`
        : text;

    const content = (
        <span
            ref={textRef}
            className={cn(
                'block overflow-hidden text-ellipsis',
                lines === 1 ? 'whitespace-nowrap' : 'display-webkit-box',
                className
            )}
            style={
                lines > 1
                    ? {
                        display: '-webkit-box',
                        WebkitLineClamp: lines,
                        WebkitBoxOrient: 'vertical',
                    }
                    : undefined
            }
            {...props}
        >
            {displayText}
        </span>
    );

    if (!showTooltip || !isTruncated) {
        return content;
    }

    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent className="max-w-sm break-words">
                    <p>{text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
