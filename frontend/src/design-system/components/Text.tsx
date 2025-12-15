import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
    as?: React.ElementType;
    variant?:
    | "h1" | "h2" | "h3" | "h4"
    | "p" | "lead" | "large"
    | "small" | "muted"
    | "overline" | "caption" | "metadata" | "label";
}

/**
 * Text Component
 * 
 * Semantic text component with refined typography for premium polish.
 * Use for consistent text styling across the application.
 */
export const Text = forwardRef<HTMLParagraphElement, TextProps>(
    ({ className, as, variant = "p", ...props }, ref) => {
        const tagMap: Record<string, React.ElementType> = {
            h1: "h1",
            h2: "h2",
            h3: "h3",
            h4: "h4",
            p: "p",
            lead: "p",
            large: "div",
            small: "small",
            muted: "p",
            overline: "span",
            caption: "span",
            metadata: "span",
            label: "label",
        };

        const Component = as || tagMap[variant] || "p";

        /**
         * Typography variants optimized for:
         * - Tight tracking on headings for confident feel
         * - Comfortable line-heights for readability
         * - Consistent weight hierarchy
         */
        const variants = {
            // Headings - Tight tracking, bold, confident
            h1: "scroll-m-20 text-3xl font-bold tracking-tight leading-tight",
            h2: "scroll-m-20 text-2xl font-semibold tracking-tight leading-snug",
            h3: "scroll-m-20 text-xl font-semibold tracking-tight leading-snug",
            h4: "scroll-m-20 text-lg font-semibold leading-snug",

            // Body - Relaxed for comfortable reading
            p: "text-[15px] leading-relaxed [&:not(:first-child)]:mt-4",
            lead: "text-lg text-muted-foreground leading-relaxed",
            large: "text-lg font-medium",

            // Secondary text
            small: "text-[13px] font-medium leading-snug",
            muted: "text-[13px] text-muted-foreground leading-relaxed",

            // Utility text styles
            overline: "text-[10px] font-semibold uppercase tracking-widest text-muted-foreground",
            caption: "text-[11px] text-muted-foreground leading-normal tracking-wide",
            metadata: "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
            label: "text-[13px] font-medium leading-none tracking-wide",
        };

        return (
            <Component
                ref={ref}
                className={cn(variants[variant], className)}
                {...props}
            />
        );
    }
);
Text.displayName = "Text";
