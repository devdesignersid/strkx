import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <div key={index} className="flex items-center gap-2">
                        {item.path && !isLast ? (
                            <Link
                                to={item.path}
                                className="hover:text-foreground transition-colors"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className={isLast ? 'text-foreground font-medium' : ''}>
                                {item.label}
                            </span>
                        )}
                        {!isLast && <ChevronRight className="w-4 h-4" />}
                    </div>
                );
            })}
        </nav>
    );
}
