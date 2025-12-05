
import { useState, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, Loader2, XCircle, ChevronDown } from 'lucide-react';
import { Button, Input, Modal, Checkbox } from '@/design-system/components';
import { cn } from '@/lib/utils';


interface SelectableItem {
    id: string;
    label: string;
    description?: string;
    tags?: string[];
}

interface ItemSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    queryKey: string[];
    queryFn: (context: { pageParam: number }) => Promise<any[]>;
    itemMapper: (item: any) => SelectableItem;
    limit?: number;
}

export function ItemSelectionModal({
    isOpen,
    onClose,
    title,
    description,
    selectedIds,
    onSelectionChange,
    queryKey,
    queryFn,
    itemMapper,
    limit = 100
}: ItemSelectionModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(new Set(selectedIds));

    // Reset temp state when modal opens
    useMemo(() => {
        if (isOpen) {
            setTempSelectedIds(new Set(selectedIds));
            setSearchQuery('');
        }
    }, [isOpen, selectedIds]);

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
        queryKey,
        queryFn,
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage || lastPage.length < limit) return undefined;
            return allPages.length + 1;
        },
        enabled: isOpen,
    });

    const items = useMemo(() => {
        if (!data) return [];
        return data.pages.flatMap(page => page.map(itemMapper));
    }, [data, itemMapper]);

    const filteredItems = useMemo(() => {
        if (!searchQuery) return items;
        const lowerQuery = searchQuery.toLowerCase();
        return items.filter(item =>
            item.label.toLowerCase().includes(lowerQuery) ||
            item.description?.toLowerCase().includes(lowerQuery) ||
            item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }, [items, searchQuery]);

    const handleToggle = (id: string) => {
        const newSet = new Set(tempSelectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setTempSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        if (tempSelectedIds.size === filteredItems.length) {
            setTempSelectedIds(new Set());
        } else {
            const newSet = new Set(tempSelectedIds);
            filteredItems.forEach(item => newSet.add(item.id));
            setTempSelectedIds(newSet);
        }
    };

    const handleSave = () => {
        onSelectionChange(Array.from(tempSelectedIds));
        onClose();
    };

    const isAllSelected = filteredItems.length > 0 && Array.from(tempSelectedIds).length >= filteredItems.length;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            className="max-w-2xl"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>
                        Save Selection ({tempSelectedIds.size})
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                {/* Search & Filter Bar */}
                {/* Search & Filter Bar */}
                <div className="flex gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <Input
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-secondary/20 focus:bg-background transition-all border-border/50 focus:border-primary/30"
                        />
                    </div>
                    <Button variant="outline" onClick={handleSelectAll} disabled={isLoading || items.length === 0} className="hover:bg-secondary/50">
                        {isAllSelected ? "Deselect All" : "Select All"}
                    </Button>
                </div>

                {/* Content */}
                <div className="border rounded-md min-h-[300px] max-h-[400px] overflow-y-auto p-1 relative">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive p-4 text-center">
                            <XCircle className="w-8 h-8 mb-2" />
                            <p>Failed to load items</p>
                            <Button variant="link" onClick={() => window.location.reload()}>Retry</Button>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                            {searchQuery ? "No matching items found" : "No items available"}
                        </div>
                    ) : (
                        <div className="space-y-1.5 p-1">
                            {filteredItems.map(item => {
                                const isSelected = tempSelectedIds.has(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 group select-none relative",
                                            isSelected
                                                ? "bg-primary/5 border border-primary/40 shadow-[0_0_0_1px_rgba(var(--primary),0.1)]"
                                                : "bg-transparent border border-transparent hover:bg-secondary/40 hover:border-border/50"
                                        )}
                                        onClick={() => handleToggle(item.id)}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            className="mt-0.5 pointer-events-none"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={cn("font-medium text-sm transition-colors", isSelected ? "text-primary" : "text-foreground")}>
                                                    {item.label}
                                                </span>
                                                {item.tags?.map(tag => (
                                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/60 text-secondary-foreground font-medium border border-border/50">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            {item.description && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground px-1 h-6">
                    <span className="flex items-center gap-2">
                        <span>{tempSelectedIds.size} selected of {items.length} loaded</span>
                        {hasNextPage && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="h-5 px-2 text-[10px] gap-1 hover:bg-secondary/50"
                            >
                                {isFetchingNextPage ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <ChevronDown className="w-3 h-3" />
                                )}
                                Load More
                            </Button>
                        )}
                    </span>
                    {searchQuery && <span>{filteredItems.length} matches</span>}
                </div>
            </div>
        </Modal>
    );
}
