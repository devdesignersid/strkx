import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion, type HTMLMotionProps } from "framer-motion"
import { Loader2 } from "lucide-react"

/**
 * Premium Button Component
 * 
 * Inspired by macOS native buttons with sleek, polished aesthetics.
 * Features subtle gradients, refined shadows, and smooth state transitions.
 * 
 * Variants:
 * - default: Primary action button with subtle gradient and shadow
 * - secondary: Muted secondary action
 * - outline: Bordered button for less prominent actions
 * - ghost: Transparent button for toolbars and minimal UI
 * - destructive: Danger actions with red styling
 * - link: Text-only button styled as a link
 * - success: Positive action confirmation
 * - premium: Special gradient button for key CTAs
 */
const buttonVariants = cva(
    // Base styles - refined typography, smooth transitions, native-feel
    [
        "inline-flex items-center justify-center gap-2 whitespace-nowrap",
        "text-sm font-medium leading-none select-none",
        "rounded-lg", // Slightly more rounded for modern feel
        "transition-all duration-150 ease-out",
        // Focus states - subtle ring that doesn't overwhelm
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        // Disabled state
        "disabled:pointer-events-none disabled:opacity-50",
        // Active state - subtle press effect
        "active:scale-[0.98]",
    ].join(" "),
    {
        variants: {
            variant: {
                // Primary button - subtle gradient with refined shadow
                default: [
                    "bg-primary text-primary-foreground",
                    "shadow-sm shadow-primary/20",
                    "hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25",
                    "active:bg-primary/85 active:shadow-sm",
                    // Subtle inner highlight for depth
                    "border border-primary/20",
                ].join(" "),

                // Secondary button - muted background with subtle borders
                secondary: [
                    "bg-secondary text-secondary-foreground",
                    "border border-border/50",
                    "shadow-sm shadow-black/5",
                    "hover:bg-secondary/80 hover:border-border/70 hover:shadow",
                    "active:bg-secondary/70",
                ].join(" "),

                // Outline button - transparent with defined border
                outline: [
                    "bg-transparent text-foreground",
                    "border border-border/60",
                    "shadow-sm shadow-black/5",
                    "hover:bg-secondary/50 hover:border-border hover:shadow",
                    "active:bg-secondary/70",
                ].join(" "),

                // Ghost button - minimal, for toolbars and compact UIs
                ghost: [
                    "bg-transparent text-muted-foreground",
                    "hover:bg-secondary/60 hover:text-foreground",
                    "active:bg-secondary/80",
                ].join(" "),

                // Destructive button - danger actions
                destructive: [
                    "bg-destructive text-destructive-foreground",
                    "shadow-sm shadow-destructive/20",
                    "border border-destructive/20",
                    "hover:bg-destructive/90 hover:shadow-md hover:shadow-destructive/25",
                    "active:bg-destructive/85 active:shadow-sm",
                ].join(" "),

                // Link button - text only
                link: [
                    "bg-transparent text-primary",
                    "underline-offset-4",
                    "hover:underline hover:text-primary/80",
                    "active:text-primary/70",
                    "h-auto p-0", // Reset padding for inline use
                ].join(" "),

                // Success button - positive confirmations
                success: [
                    "bg-emerald-600 text-white",
                    "shadow-sm shadow-emerald-600/20",
                    "border border-emerald-500/20",
                    "hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-500/25",
                    "active:bg-emerald-600/90 active:shadow-sm",
                ].join(" "),

                // Premium/Accent button - for key CTAs and special actions
                premium: [
                    "bg-gradient-to-r from-primary via-primary to-primary/80",
                    "text-primary-foreground font-semibold",
                    "shadow-lg shadow-primary/30",
                    "border border-white/10",
                    "hover:shadow-xl hover:shadow-primary/40 hover:from-primary/95 hover:to-primary/75",
                    "active:shadow-md active:scale-[0.98]",
                    // Animated shimmer effect on hover could be added via CSS
                ].join(" "),

                // Soft variant - very subtle, for de-emphasized actions
                soft: [
                    "bg-primary/10 text-primary",
                    "border border-primary/10",
                    "hover:bg-primary/15 hover:border-primary/20",
                    "active:bg-primary/20",
                ].join(" "),

                // Warning variant - for cautionary actions
                warning: [
                    "bg-amber-500/90 text-white",
                    "shadow-sm shadow-amber-500/20",
                    "border border-amber-400/20",
                    "hover:bg-amber-500 hover:shadow-md hover:shadow-amber-500/25",
                    "active:bg-amber-600 active:shadow-sm",
                ].join(" "),
            },
            size: {
                // Default - standard button
                default: "h-9 px-4 py-2 text-sm",
                // Small - compact UI elements
                sm: "h-8 px-3 py-1.5 text-xs rounded-md",
                // Large - prominent actions
                lg: "h-11 px-6 py-2.5 text-base",
                // Extra large - hero CTAs
                xl: "h-12 px-8 py-3 text-base font-semibold",
                // Icon buttons - square aspect ratio
                icon: "h-9 w-9 p-0",
                "icon-sm": "h-8 w-8 p-0 rounded-md",
                "icon-lg": "h-11 w-11 p-0",
                "icon-xs": "h-6 w-6 p-0 rounded",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends Omit<HTMLMotionProps<"button">, "ref">,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
    isLoading?: boolean
    /** Disables the micro-animations for contexts where they may interfere */
    disableMotion?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        className,
        variant,
        size,
        asChild = false,
        isLoading = false,
        disableMotion = false,
        children,
        disabled,
        ...props
    }, ref) => {
        const Comp = asChild ? Slot : motion.button

        // Subtle micro-interactions for polish
        const motionProps = !asChild && !disableMotion ? {
            whileTap: { scale: 0.97 },
            whileHover: { scale: 1.01 },
            transition: { duration: 0.1 }
        } : {}

        const isDisabled = disabled || isLoading

        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={isDisabled}
                {...motionProps}
                {...props as any}
            >
                {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {children}
            </Comp>
        )
    }
)
Button.displayName = "Button"

/**
 * IconButton - Convenience wrapper for icon-only buttons
 * Provides automatic sizing and aria-label requirement
 */
interface IconButtonProps extends Omit<ButtonProps, "size"> {
    size?: "xs" | "sm" | "default" | "lg"
    "aria-label": string // Required for accessibility
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ size = "default", className, ...props }, ref) => {
        const sizeMap = {
            xs: "icon-xs",
            sm: "icon-sm",
            default: "icon",
            lg: "icon-lg",
        } as const

        return (
            <Button
                ref={ref}
                size={sizeMap[size]}
                className={cn("flex-shrink-0", className)}
                {...props}
            />
        )
    }
)
IconButton.displayName = "IconButton"

export { Button, IconButton, buttonVariants }
