import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
    as?: React.ElementType;
    variant?: "h1" | "h2" | "h3" | "h4" | "p" | "small" | "muted" | "lead" | "large";
}

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
        };

        const Component = as || tagMap[variant] || "p";

        const variants = {
            h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
            h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
            h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
            h4: "scroll-m-20 text-xl font-semibold tracking-tight",
            p: "leading-7 [&:not(:first-child)]:mt-6",
            lead: "text-xl text-muted-foreground",
            large: "text-lg font-semibold",
            small: "text-sm font-medium leading-none",
            muted: "text-sm text-muted-foreground",
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
