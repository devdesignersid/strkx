import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion, type HTMLMotionProps } from "framer-motion"
import { Loader2 } from "lucide-react"

/**
 * Premium Button Component
 * 
 * Calm, confident, cohesive button system with:
 * - Subtle vertical gradients for primary actions
 * - Flat backgrounds for secondary/tertiary
 * - Refined, tactile interaction states
 * - Consistent sizing and typography
 * 
 * Variants:
 * - default: Primary action with subtle gradient
 * - secondary: Flat muted background
 * - outline: Bordered, transparent
 * - ghost: Minimal, for toolbars
 * - destructive: Danger actions
 * - link: Text-only
 * - success: Positive confirmations
 * - soft: De-emphasized actions
 */
const buttonVariants = cva(
    // Base styles - matching reference design
    [
        "inline-flex items-center justify-center gap-2 whitespace-nowrap",
        "text-[14px] font-medium leading-none select-none",
        "rounded-[6px]", // Matching reference radius
        "transition-all duration-100 ease-out",
        // Focus - accessible
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        // Disabled
        "disabled:pointer-events-none disabled:opacity-50",
    ].join(" "),
    {
        variants: {
            variant: {
                /**
                 * Primary Button
                 * - Visible gradient: lighter top to darker bottom
                 * - Matches reference style
                 */
                default: [
                    // Subtle gradient: slight lightness shift only
                    "bg-gradient-to-b from-primary-light to-primary",
                    "text-primary-foreground font-semibold",
                    // Very subtle border - barely visible
                    "ring-1 ring-inset ring-black/10",
                    // Minimal shadow
                    "shadow-sm",
                    // Hover: slight brightness shift
                    "hover:from-primary-light hover:to-primary-dark hover:shadow",
                    // Active: flat
                    "active:from-primary active:to-primary active:shadow-none",
                ].join(" "),

                /**
                 * Secondary Button (matching reference "Invite" button)
                 * - Light/white background, visible border
                 * - Lower visual weight than primary
                 */
                secondary: [
                    "bg-card text-foreground font-medium",
                    "border border-border",
                    "shadow-sm",
                    "hover:bg-secondary hover:border-border/80",
                    "active:bg-secondary/80 active:shadow-none",
                ].join(" "),

                /**
                 * Outline Button
                 * - Transparent with clean border
                 * - Understated
                 */
                outline: [
                    "bg-transparent text-foreground font-medium",
                    "ring-1 ring-inset ring-border",
                    "hover:bg-secondary/40",
                    "active:bg-secondary/60 active:shadow-none",
                ].join(" "),

                /**
                 * Ghost Button
                 * - Minimal, lightweight
                 * - Clear hover affordance
                 */
                ghost: [
                    "bg-transparent text-muted-foreground font-medium",
                    "hover:bg-secondary/50 hover:text-foreground",
                    "active:bg-secondary/70",
                ].join(" "),

                /**
                 * Destructive Button
                 * - Same subtle gradient as primary
                 * - Red tones
                 */
                destructive: [
                    "bg-gradient-to-b from-red-500 to-red-600",
                    "text-white font-semibold",
                    "ring-1 ring-inset ring-black/10",
                    "shadow-sm",
                    "hover:from-red-500/90 hover:to-red-600 hover:shadow",
                    "active:from-red-600 active:to-red-600 active:shadow-none",
                ].join(" "),

                /**
                 * Link Button
                 * - Text only, inline
                 */
                link: [
                    "bg-transparent text-primary font-medium",
                    "underline-offset-4",
                    "hover:underline hover:text-primary/80",
                    "active:text-primary/70",
                    "h-auto p-0",
                ].join(" "),

                /**
                 * Success Button
                 * - Same subtle gradient as primary
                 * - Green tones
                 */
                success: [
                    "bg-gradient-to-b from-emerald-500 to-emerald-600",
                    "text-white font-semibold",
                    "ring-1 ring-inset ring-black/10",
                    "shadow-sm",
                    "hover:from-emerald-500/90 hover:to-emerald-600 hover:shadow",
                    "active:from-emerald-600 active:to-emerald-600 active:shadow-none",
                ].join(" "),

                /**
                 * Soft Button
                 * - Very subtle, de-emphasized
                 */
                soft: [
                    "bg-primary/10 text-primary font-medium",
                    "hover:bg-primary/15",
                    "active:bg-primary/20",
                ].join(" "),

                /**
                 * Warning Button
                 * - Same subtle gradient
                 * - Amber tones
                 */
                warning: [
                    "bg-gradient-to-b from-amber-500 to-amber-600",
                    "text-white font-semibold",
                    "ring-1 ring-inset ring-black/10",
                    "shadow-sm",
                    "hover:from-amber-500/90 hover:to-amber-600 hover:shadow",
                    "active:from-amber-600 active:to-amber-600 active:shadow-none",
                ].join(" "),

                /**
                 * Premium Button
                 * - For key CTAs and special actions
                 * - More prominent than default
                 */
                premium: [
                    "bg-gradient-to-b from-primary-light to-primary-dark",
                    "text-primary-foreground font-bold",
                    "shadow-lg shadow-primary/20",
                    "ring-1 ring-inset ring-white/10",
                    "hover:from-primary hover:to-primary-dark hover:shadow-xl hover:shadow-primary/30",
                    "active:from-primary-dark active:to-primary-dark active:shadow-md",
                ].join(" "),
            },
            size: {
                // Default - standard button
                default: "h-9 px-4 py-2",
                // Small - compact UI
                sm: "h-8 px-3 py-1.5 text-[12px]",
                // Large - prominent actions
                lg: "h-10 px-5 py-2.5 text-[14px]",
                // Extra large - hero CTAs
                xl: "h-11 px-6 py-3 text-[14px] font-semibold",
                // Icon buttons - square
                icon: "h-9 w-9 p-0",
                "icon-sm": "h-8 w-8 p-0",
                "icon-lg": "h-10 w-10 p-0",
                "icon-xs": "h-6 w-6 p-0 text-[11px]",
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
    /** Disables micro-animations */
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

        // Subtle, restrained micro-interactions
        const motionProps = !asChild && !disableMotion ? {
            whileTap: { scale: 0.98 },
            transition: { duration: 0.1, ease: "easeOut" }
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
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                )}
                {children}
            </Comp>
        )
    }
)
Button.displayName = "Button"

/**
 * IconButton - Square icon-only buttons
 * Requires aria-label for accessibility
 */
interface IconButtonProps extends Omit<ButtonProps, "size"> {
    size?: "xs" | "sm" | "default" | "lg"
    "aria-label": string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ size = "default", variant = "ghost", className, ...props }, ref) => {
        const sizeMap = {
            xs: "icon-xs",
            sm: "icon-sm",
            default: "icon",
            lg: "icon-lg",
        } as const

        return (
            <Button
                ref={ref}
                variant={variant}
                size={sizeMap[size]}
                className={cn("shrink-0", className)}
                {...props}
            />
        )
    }
)
IconButton.displayName = "IconButton"

export { Button, IconButton, buttonVariants }
