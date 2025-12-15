import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Label Component
 * 
 * Refined typography for form labels:
 * - 13px for readability
 * - Medium weight for hierarchy
 * - Wide tracking for premium feel
 */
const labelVariants = cva(
    "text-[13px] font-medium leading-none tracking-wide peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

export interface LabelProps
    extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> { }

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, ...props }, ref) => (
        <label
            ref={ref}
            className={cn(labelVariants(), className)}
            {...props}
        />
    )
)
Label.displayName = "Label"

export { Label }
