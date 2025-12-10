import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Check, Type, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/design-system/components/Input';
import { LOCAL_FONTS } from '../../fonts/manifest';
import { createPortal } from 'react-dom';

interface FontItem {
    id: string;
    family: string;
    category: 'serif' | 'sans-serif' | 'display';
    isLocal?: boolean;
}

// Curated professional fonts for resumes - all loaded from Fontsource
const REMOTE_FONTS: FontItem[] = [
    // Serif Fonts (Classic Professional - loaded from Fontsource)
    { id: 'eb-garamond', family: 'EB Garamond', category: 'serif' },
    { id: 'libre-baskerville', family: 'Libre Baskerville', category: 'serif' },
    { id: 'lora', family: 'Lora', category: 'serif' },
    { id: 'merriweather', family: 'Merriweather', category: 'serif' },
    { id: 'playfair-display', family: 'Playfair Display', category: 'serif' },
    { id: 'source-serif-pro', family: 'Source Serif Pro', category: 'serif' },
    { id: 'crimson-text', family: 'Crimson Text', category: 'serif' },
    { id: 'pt-serif', family: 'PT Serif', category: 'serif' },
    { id: 'cormorant-garamond', family: 'Cormorant Garamond', category: 'serif' },
    { id: 'bitter', family: 'Bitter', category: 'serif' },

    // Sans-Serif Fonts (Modern Professional - loaded from Fontsource)
    { id: 'carlito', family: 'Carlito', category: 'sans-serif' },
    { id: 'inter', family: 'Inter', category: 'sans-serif' },
    { id: 'roboto', family: 'Roboto', category: 'sans-serif' },
    { id: 'open-sans', family: 'Open Sans', category: 'sans-serif' },
    { id: 'source-sans-pro', family: 'Source Sans Pro', category: 'sans-serif' },
    { id: 'lato', family: 'Lato', category: 'sans-serif' },
    { id: 'raleway', family: 'Raleway', category: 'sans-serif' },
    { id: 'poppins', family: 'Poppins', category: 'sans-serif' },
    { id: 'nunito', family: 'Nunito', category: 'sans-serif' },
    { id: 'fira-sans', family: 'Fira Sans', category: 'sans-serif' },
    { id: 'dm-sans', family: 'DM Sans', category: 'sans-serif' },
    { id: 'montserrat', family: 'Montserrat', category: 'sans-serif' },
    { id: 'work-sans', family: 'Work Sans', category: 'sans-serif' },
    { id: 'ibm-plex-sans', family: 'IBM Plex Sans', category: 'sans-serif' },
    { id: 'cabin', family: 'Cabin', category: 'sans-serif' },
    { id: 'karla', family: 'Karla', category: 'sans-serif' },
];

// Convert local font manifest to FontItem format
const LOCAL_FONT_ITEMS: FontItem[] = LOCAL_FONTS.map(f => ({
    id: f.id,
    family: f.family,
    category: f.category,
    isLocal: true
}));

export const FontPicker = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isOutsideWrapper = wrapperRef.current && !wrapperRef.current.contains(target);
            const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);

            // Only close if click is outside BOTH the wrapper and the dropdown
            if (isOutsideWrapper && (isOutsideDropdown || !dropdownRef.current)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Update dropdown position when opening
    useEffect(() => {
        if (isOpen && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, [isOpen]);

    // Memoize filtered fonts
    const { localFonts, serifFonts, sansFonts } = useMemo(() => {
        const lowerQuery = query.toLowerCase();
        const filterFn = (f: FontItem) =>
            !query || f.family.toLowerCase().includes(lowerQuery);

        return {
            localFonts: LOCAL_FONT_ITEMS.filter(filterFn),
            serifFonts: REMOTE_FONTS.filter(f => f.category === 'serif').filter(filterFn),
            sansFonts: REMOTE_FONTS.filter(f => f.category === 'sans-serif').filter(filterFn)
        };
    }, [query]);

    const hasResults = localFonts.length > 0 || serifFonts.length > 0 || sansFonts.length > 0;

    const handleSelect = (family: string) => {
        onChange(family);
        setIsOpen(false);
        setQuery('');
    };

    const dropdown = isOpen && createPortal(
        <div
            ref={dropdownRef}
            className="fixed bg-popover text-popover-foreground border border-border rounded-md shadow-xl max-h-72 overflow-y-auto custom-scrollbar animate-in zoom-in-95 fade-in-50 duration-100"
            style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                zIndex: 9999
            }}
        >
            {/* Local/System Fonts Section */}
            {localFonts.length > 0 && (
                <>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-gradient-to-r from-primary/10 to-transparent border-b border-border flex items-center gap-2">
                        <HardDrive className="w-3 h-3 text-primary" />
                        <span>System Fonts</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">Premium</span>
                    </div>
                    {localFonts.map(f => (
                        <button
                            key={f.id}
                            className={cn(
                                "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex justify-between items-center transition-colors",
                                value === f.family && "bg-primary/10 text-primary font-medium"
                            )}
                            onClick={() => handleSelect(f.family)}
                        >
                            <span>{f.family}</span>
                            {value === f.family && <Check className="w-4 h-4" />}
                        </button>
                    ))}
                </>
            )}

            {/* Serif Section */}
            {serifFonts.length > 0 && (
                <>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border flex items-center gap-2">
                        <Type className="w-3 h-3" />
                        Serif (Classic)
                    </div>
                    {serifFonts.map(f => (
                        <button
                            key={f.id}
                            className={cn(
                                "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex justify-between items-center transition-colors",
                                value === f.family && "bg-primary/10 text-primary font-medium"
                            )}
                            onClick={() => handleSelect(f.family)}
                        >
                            <span>{f.family}</span>
                            {value === f.family && <Check className="w-4 h-4" />}
                        </button>
                    ))}
                </>
            )}

            {/* Sans-Serif Section */}
            {sansFonts.length > 0 && (
                <>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border flex items-center gap-2">
                        <Type className="w-3 h-3" />
                        Sans-Serif (Modern)
                    </div>
                    {sansFonts.map(f => (
                        <button
                            key={f.id}
                            className={cn(
                                "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex justify-between items-center transition-colors",
                                value === f.family && "bg-primary/10 text-primary font-medium"
                            )}
                            onClick={() => handleSelect(f.family)}
                        >
                            <span>{f.family}</span>
                            {value === f.family && <Check className="w-4 h-4" />}
                        </button>
                    ))}
                </>
            )}

            {!hasResults && (
                <div className="p-3 text-sm text-muted-foreground text-center">No fonts found</div>
            )}
        </div>,
        document.body
    );

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <Input
                    ref={inputRef}
                    className="pl-9"
                    value={isOpen ? query : value}
                    onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
                    onFocus={() => { setQuery(''); setIsOpen(true); }}
                    placeholder="Select font..."
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            </div>
            {dropdown}
        </div>
    );
};

