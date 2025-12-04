import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectProps
    extends React.SelectHTMLAttributes<HTMLSelectElement> {
    containerClassName?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, containerClassName, children, ...props }, ref) => {
        return (
            <div className={cn("relative", containerClassName)}>
                <select
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    {children}
                </select>
                <div className="absolute right-3 top-2.5 pointer-events-none text-muted-foreground">
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
            </div>
        )
    }
)
Select.displayName = "Select"

export { Select }
