
import { useState, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, Loader2, XCircle, ChevronDown, Check, Sparkles, Package } from 'lucide-react';
import { Button, Input, Modal, Checkbox } from '@/design-system/components';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';


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

    const handleClearAll = () => {
        setTempSelectedIds(new Set());
    };

    const handleSave = () => {
        onSelectionChange(Array.from(tempSelectedIds));
        onClose();
    };

    const isAllSelected = filteredItems.length > 0 && tempSelectedIds.size >= filteredItems.length;
    const hasSelection = tempSelectedIds.size > 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            className="max-w-2xl"
            footer={
                <div className="flex items-center justify-between w-full">
                    {/* Selection summary */}
                    <div className="flex items-center gap-2">
                        {hasSelection && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full"
                            >
                                <Sparkles className="w-3 h-3" />
                                <span>{tempSelectedIds.size} selected</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="gap-2 min-w-[140px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                        >
                            <Check className="w-4 h-4" />
                            {hasSelection ? `Confirm (${tempSelectedIds.size})` : 'Confirm Selection'}
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                {/* Search & Actions Bar */}
                <div className="flex gap-3">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search by name, description, or tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 bg-secondary/30 border-border/50 focus:bg-background focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/60"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                            disabled={isLoading || items.length === 0}
                            className={cn(
                                "h-10 px-3 text-xs font-medium transition-all",
                                isAllSelected
                                    ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
                                    : "border-border/60 hover:border-primary/30 hover:bg-secondary/50"
                            )}
                        >
                            {isAllSelected ? "Deselect All" : "Select All"}
                        </Button>
                        {hasSelection && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearAll}
                                    className="h-10 px-3 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                    Clear
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Items Container */}
                <div className="relative border border-border/60 rounded-xl bg-gradient-to-b from-background to-secondary/10 min-h-[320px] max-h-[400px] overflow-hidden">
                    {/* Decorative top gradient */}
                    <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />

                    {/* Scrollable content */}
                    <div className="h-full overflow-y-auto px-2 py-2 scroll-smooth">
                        {isLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                    <Package className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <p className="text-sm text-muted-foreground">Loading items...</p>
                            </div>
                        ) : error ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <XCircle className="w-6 h-6 text-destructive" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">Failed to load items</p>
                                    <p className="text-sm text-muted-foreground mt-1">Please try again</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2">
                                    Retry
                                </Button>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                                <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
                                    <Search className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">
                                        {searchQuery ? "No matching items" : "No items available"}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {searchQuery ? "Try a different search term" : "There are no items to select"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1.5 pt-4 pb-2">
                                <AnimatePresence mode="popLayout">
                                    {filteredItems.map((item, index) => {
                                        const isSelected = tempSelectedIds.has(item.id);
                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: Math.min(index * 0.02, 0.2) }}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 group select-none relative",
                                                    isSelected
                                                        ? "bg-primary/8 border border-primary/30 shadow-sm shadow-primary/5"
                                                        : "bg-card/50 border border-transparent hover:bg-secondary/50 hover:border-border/50"
                                                )}
                                                onClick={() => handleToggle(item.id)}
                                            >
                                                {/* Custom checkbox */}
                                                <div className={cn(
                                                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0",
                                                    isSelected
                                                        ? "bg-primary border-primary shadow-sm shadow-primary/30"
                                                        : "border-border/60 bg-background group-hover:border-primary/40"
                                                )}>
                                                    <AnimatePresence>
                                                        {isSelected && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                exit={{ scale: 0 }}
                                                            >
                                                                <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={cn(
                                                            "font-medium text-sm transition-colors truncate",
                                                            isSelected ? "text-primary" : "text-foreground"
                                                        )}>
                                                            {item.label}
                                                        </span>
                                                        {item.tags?.slice(0, 3).map(tag => (
                                                            <span
                                                                key={tag}
                                                                className={cn(
                                                                    "text-[10px] px-1.5 py-0.5 rounded-md font-medium transition-colors",
                                                                    isSelected
                                                                        ? "bg-primary/15 text-primary border border-primary/20"
                                                                        : "bg-secondary/80 text-secondary-foreground border border-border/50"
                                                                )}
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {item.tags && item.tags.length > 3 && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                +{item.tags.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {item.description && (
                                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Selection indicator glow */}
                                                {isSelected && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="absolute inset-0 rounded-lg bg-primary/5 pointer-events-none"
                                                    />
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Decorative bottom gradient */}
                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
                </div>

                {/* Footer stats bar */}
                <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                            <span>{items.length} items loaded</span>
                        </span>
                        {searchQuery && filteredItems.length !== items.length && (
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
                                <span>{filteredItems.length} matches</span>
                            </span>
                        )}
                    </div>

                    {hasNextPage && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="h-6 px-2 text-[11px] gap-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        >
                            {isFetchingNextPage ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <ChevronDown className="w-3 h-3" />
                            )}
                            Load more items
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
}
