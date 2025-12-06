import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { ChevronDown, ChevronUp, Link2 } from 'lucide-react';
import { LinkPreview, extractUrls, type LinkPreviewData } from './LinkPreview';

interface TextPadProps {
    html: string;
    onChange: (html: string) => void;
    placeholder?: string;
    linkPreviews?: Record<string, LinkPreviewData>;
    onLinkPreviewFetched?: (url: string, preview: LinkPreviewData) => void;
}

// URL regex for matching
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

// Escape HTML entities to prevent XSS
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Convert plain URLs in text to clickable links (with XSS protection)
function linkifyHtml(html: string): string {
    return html.replace(URL_REGEX, (url) => {
        const safeUrl = escapeHtml(url);
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-primary underline">${safeUrl}</a>`;
    });
}

// Remove anchor tags to get clean HTML for storage
function stripAnchors(html: string): string {
    return html.replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1');
}

export function TextPad({
    html,
    onChange,
    placeholder = 'Start typing your notes... Paste URLs to see previews.',
    linkPreviews = {},
    onLinkPreviewFetched
}: TextPadProps) {
    const ref = useRef<HTMLDivElement | null>(null);
    const isInternalChange = useRef(false);
    const [showPreviews, setShowPreviews] = useState(true);

    // All unique URLs for fetching previews
    const allUrls = useMemo(() => {
        // Create temp div and replace block elements with newlines to preserve line breaks
        const tempDiv = document.createElement('div');
        // Insert newlines before closing tags of block elements to preserve line separation
        const htmlWithBreaks = html
            .replace(/<\/div>/gi, '\n</div>')
            .replace(/<\/p>/gi, '\n</p>')
            .replace(/<br\s*\/?>/gi, '\n');
        tempDiv.innerHTML = htmlWithBreaks;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        return extractUrls(textContent);
    }, [html]);

    // Sync external html to DOM
    useEffect(() => {
        if (ref.current && !isInternalChange.current) {
            // If html is empty, clear the div completely
            if (!html) {
                ref.current.innerHTML = '';
            } else {
                const linkedHtml = linkifyHtml(html);
                if (ref.current.innerHTML !== linkedHtml) {
                    ref.current.innerHTML = linkedHtml;
                }
            }
        }
        isInternalChange.current = false;
    }, [html]);

    const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
        isInternalChange.current = true;
        const rawHtml = (e.target as HTMLDivElement).innerHTML;
        const cleaned = stripAnchors(rawHtml);
        onChange(cleaned);
    }, [onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            document.execCommand('bold');
        }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
            e.preventDefault();
            document.execCommand('italic');
        }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'u') {
            e.preventDefault();
            document.execCommand('underline');
        }
    }, []);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'A') {
            e.preventDefault();
            const href = target.getAttribute('href');
            if (href) {
                window.open(href, '_blank', 'noopener,noreferrer');
            }
        }
    }, []);

    const handlePaste = useCallback(() => {
        setTimeout(() => {
            if (ref.current) {
                const rawHtml = ref.current.innerHTML;
                const cleaned = stripAnchors(rawHtml);
                const linked = linkifyHtml(cleaned);
                if (ref.current.innerHTML !== linked) {
                    ref.current.innerHTML = linked;
                    const range = document.createRange();
                    range.selectNodeContents(ref.current);
                    range.collapse(false);
                    const selection = window.getSelection();
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                }
                onChange(cleaned);
            }
        }, 0);
    }, [onChange]);

    const isEmpty = !html || html === '<br>' || html === '<div><br></div>';

    return (
        <div className="h-full flex flex-col">
            {/* Editable text area - scrollable */}
            <div className="flex-1 min-h-0 overflow-auto p-6 relative">
                <div
                    ref={ref}
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-multiline="true"
                    aria-label="Scratchpad notes"
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    onClick={handleClick}
                    onPaste={handlePaste}
                    className="
            min-h-[100px] w-full
            text-foreground text-sm leading-relaxed
            focus:outline-none
            [&>*]:my-1
            [&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer
          "
                    style={{ whiteSpace: 'pre-wrap' }}
                />
                {isEmpty && (
                    <div
                        className="absolute top-6 left-6 text-muted-foreground/50 pointer-events-none text-sm"
                        aria-hidden="true"
                    >
                        {placeholder}
                    </div>
                )}
            </div>

            {/* Collapsible link previews section */}
            {allUrls.length > 0 && (
                <div className="shrink-0 border-t border-border/30 bg-muted/5">
                    {/* Toggle header - always visible */}
                    <button
                        onClick={() => setShowPreviews(!showPreviews)}
                        className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:bg-muted/10 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <Link2 className="w-3.5 h-3.5" />
                            {allUrls.length} link{allUrls.length > 1 ? 's' : ''} detected
                        </span>
                        {showPreviews ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronUp className="w-4 h-4" />
                        )}
                    </button>

                    {/* Preview cards - collapsible, scrollable */}
                    {showPreviews && (
                        <div className="max-h-[200px] overflow-y-auto px-4 pb-3 space-y-2">
                            {allUrls.map((url) => (
                                <LinkPreview
                                    key={url}
                                    url={url}
                                    cached={linkPreviews[url]}
                                    onPreviewFetched={(preview) => onLinkPreviewFetched?.(url, preview)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
