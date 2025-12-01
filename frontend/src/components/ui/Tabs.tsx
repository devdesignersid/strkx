import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface TabsProps {
    defaultValue?: string
    value?: string
    onValueChange?: (value: string) => void
    className?: string
    children: React.ReactNode
}

const TabsContext = React.createContext<{
    value: string
    setValue: (value: string) => void
} | null>(null)

export function Tabs({ defaultValue, value, onValueChange, className, children }: TabsProps) {
    const [internalValue, setInternalValue] = React.useState(defaultValue || "")

    const currentValue = value !== undefined ? value : internalValue

    const setValue = (newValue: string) => {
        if (value === undefined) {
            setInternalValue(newValue)
        }
        onValueChange?.(newValue)
    }

    return (
        <TabsContext.Provider value={{ value: currentValue, setValue }}>
            <div className={cn("w-full", className)}>{children}</div>
        </TabsContext.Provider>
    )
}

interface TabsListProps {
    className?: string
    children: React.ReactNode
}

export function TabsList({ className, children }: TabsListProps) {
    return (
        <div
            className={cn(
                "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
                className
            )}
        >
            {children}
        </div>
    )
}

interface TabsTriggerProps {
    value: string
    className?: string
    children: React.ReactNode
}

export function TabsTrigger({ value, className, children }: TabsTriggerProps) {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error("TabsTrigger must be used within Tabs")

    const isActive = context.value === value

    return (
        <button
            onClick={() => context.setValue(value)}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "hover:bg-background/50 hover:text-foreground",
                className
            )}
        >
            {isActive && (
                <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-background rounded-sm shadow-sm -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            )}
            <span className="relative z-10">{children}</span>
        </button>
    )
}

interface TabsContentProps {
    value: string
    className?: string
    children: React.ReactNode
}

export function TabsContent({ value, className, children }: TabsContentProps) {
    const context = React.useContext(TabsContext)
    if (!context) throw new Error("TabsContent must be used within Tabs")

    if (context.value !== value) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
        >
            {children}
        </motion.div>
    )
}
