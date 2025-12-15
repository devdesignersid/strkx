import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
}

/**
 * PageHeader Component
 * 
 * Premium page header with refined typography:
 * - Tight tracking on title for confident feel
 * - Subtle description with improved line-height
 * - Responsive sizing
 */
export function PageHeader({ title, description, children, className }: PageHeaderProps) {
    return (
        <header className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8", className)}>
            <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-[13px] md:text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-3 shrink-0">
                    {children}
                </div>
            )}
        </header>
    );
}
