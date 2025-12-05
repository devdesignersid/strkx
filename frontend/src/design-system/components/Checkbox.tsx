import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, onCheckedChange, onChange, checked, defaultChecked, ...props }, ref) => {
        const [isChecked, setIsChecked] = React.useState(checked || defaultChecked || false);

        React.useEffect(() => {
            if (checked !== undefined) {
                setIsChecked(checked);
            }
        }, [checked]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newChecked = e.target.checked;
            if (checked === undefined) {
                setIsChecked(newChecked);
            }
            onChange?.(e);
            onCheckedChange?.(newChecked);
        };

        return (
            <label className={cn("relative flex items-center justify-center cursor-pointer group", className)}>
                <input
                    type="checkbox"
                    className="peer sr-only"
                    ref={ref}
                    checked={checked}
                    onChange={handleChange}
                    defaultChecked={defaultChecked}
                    {...props}
                />
                <div className={cn(
                    "h-4 w-4 shrink-0 rounded-sm border border-primary text-current ring-offset-background transition-all",
                    "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
                    "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                    isChecked
                        ? "bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
                        : "bg-transparent border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
                )}>
                    <Check className={cn(
                        "h-3.5 w-3.5 absolute top-[1px] left-[1px] stroke-[3px] transition-transform duration-200",
                        isChecked ? "scale-100" : "scale-0"
                    )} />
                </div>
            </label>
        )
    }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
