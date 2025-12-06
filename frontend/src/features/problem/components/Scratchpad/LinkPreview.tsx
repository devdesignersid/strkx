import { useState, useEffect } from 'react';
import { ExternalLink, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/design-system/animations';
import { apiClient } from '@/services/api/client';

export interface LinkPreviewData {
    url: string;
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    favicon: string | null;
}

interface LinkPreviewProps {
    url: string;
    onRemove?: () => void;
    cached?: LinkPreviewData | null;
    onPreviewFetched?: (data: LinkPreviewData) => void;
}

export function LinkPreview({ url, onRemove, cached, onPreviewFetched }: LinkPreviewProps) {
    const [preview, setPreview] = useState<LinkPreviewData | null>(cached || null);
    const [loading, setLoading] = useState(!cached);
    const [error, setError] = useState(false);

    // Fetch preview on mount with proper cleanup
    useEffect(() => {
        // Skip if we already have cached data
        if (cached) {
            setPreview(cached);
            setLoading(false);
            return;
        }

        let cancelled = false;
        const controller = new AbortController();

        const doFetch = async () => {
            try {
                setLoading(true);
                setError(false);

                const response = await apiClient.get<{ data: { success: boolean; data: LinkPreviewData | null } }>(
                    `/link-preview?url=${encodeURIComponent(url)}`,
                    { signal: controller.signal }
                );

                if (cancelled) return;

                const result = response.data.data;
                if (result.success && result.data) {
                    setPreview(result.data);
                    onPreviewFetched?.(result.data);
                } else {
                    console.error('LinkPreview: API returned unsuccessful', result);
                    setError(true);
                }
            } catch (err: unknown) {
                if (cancelled) return;
                // Don't log AbortError as it's expected on cleanup
                if (err instanceof Error && err.name !== 'AbortError') {
                    console.error('LinkPreview: Fetch failed', err);
                    setError(true);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        doFetch();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [url, cached, onPreviewFetched]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50 my-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate">{url}</span>
            </div>
        );
    }

    if (error || !preview) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline text-sm my-1"
            >
                <ExternalLink className="w-3 h-3" />
                {url}
            </a>
        );
    }

    return (
        <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            className="relative group rounded-lg overflow-hidden bg-muted/30 border border-border/50 hover:border-border transition-colors my-2"
        >
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 p-3 no-underline"
            >
                {preview.image && (
                    <div className="shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted">
                        <img
                            src={preview.image}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {preview.favicon && (
                            <img
                                src={preview.favicon}
                                alt=""
                                className="w-4 h-4 rounded-sm"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        )}
                        <span className="text-xs text-muted-foreground truncate">
                            {preview.siteName || new URL(url).hostname}
                        </span>
                    </div>
                    {preview.title && (
                        <h4 className="text-sm font-medium text-foreground line-clamp-1 mb-0.5">
                            {preview.title}
                        </h4>
                    )}
                    {preview.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {preview.description}
                        </p>
                    )}
                </div>
            </a>

            {onRemove && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="absolute top-2 right-2 p-1 rounded-md bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                    aria-label="Remove link preview"
                >
                    <X className="w-3 h-3 text-muted-foreground" />
                </button>
            )}
        </motion.div>
    );
}

// Utility to extract URLs from text
export function extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
    const matches = text.match(urlRegex);
    return matches ? [...new Set(matches)] : [];
}
