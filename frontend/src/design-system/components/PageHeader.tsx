import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
    return (
        <header className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8", className)}>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
                {description && <p className="text-muted-foreground text-sm md:text-base mt-1">{description}</p>}
            </div>
            {children && <div className="flex items-center gap-3">{children}</div>}
        </header>
    );
}
