import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
    as?: React.ElementType;
    direction?: "row" | "column";
    gap?: number | string;
    align?: "start" | "center" | "end" | "stretch" | "baseline";
    justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
    ({ className, as: Component = "div", direction = "column", gap = 2, align, justify, style, ...props }, ref) => {

        // Map gap number to tailwind spacing if possible, or use inline style
        // For simplicity, we'll use inline style for gap if it's a number, assuming it's a multiple of 0.25rem (4px) or just raw px?
        // Actually, let's use style for gap to be flexible, or classnames if we want to stick to tailwind.
        // To keep it simple and consistent with tokens, let's assume gap is a number representing tailwind units (0.25rem).

        const gapStyle = typeof gap === 'number' ? `${gap * 0.25}rem` : gap;

        return (
            <Component
                ref={ref}
                className={cn(
                    "flex",
                    direction === "column" ? "flex-col" : "flex-row",
                    {
                        "items-start": align === "start",
                        "items-center": align === "center",
                        "items-end": align === "end",
                        "items-stretch": align === "stretch",
                        "items-baseline": align === "baseline",
                        "justify-start": justify === "start",
                        "justify-center": justify === "center",
                        "justify-end": justify === "end",
                        "justify-between": justify === "between",
                        "justify-around": justify === "around",
                        "justify-evenly": justify === "evenly",
                    },
                    className
                )}
                style={{ gap: gapStyle, ...style }}
                {...props}
            />
        );
    }
);
Stack.displayName = "Stack";
