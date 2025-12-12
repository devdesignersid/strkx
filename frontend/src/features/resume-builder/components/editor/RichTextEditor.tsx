import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '@/lib/utils';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { useRef, useCallback, memo, useEffect, useReducer } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    debounceMs?: number;
}

// MenuBar component that listens to editor updates to reflect active state
const MenuBar = ({ editor }: { editor: Editor | null }) => {
    // Force re-render on editor updates
    const [, forceUpdate] = useReducer((x) => x + 1, 0);

    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            forceUpdate();
        };

        // Listen to all relevant events for UI updates
        editor.on('transaction', handleUpdate);
        editor.on('selectionUpdate', handleUpdate);
        editor.on('update', handleUpdate); // Content updates

        return () => {
            editor.off('transaction', handleUpdate);
            editor.off('selectionUpdate', handleUpdate);
            editor.off('update', handleUpdate);
        };
    }, [editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="flex items-center gap-1 p-1 border-b border-border/40 bg-transparent">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={cn(
                    "p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground",
                    editor.isActive('bold') ? "bg-primary/10 text-primary font-medium" : ""
                )}
                type="button"
                title="Bold (Cmd+B)"
            >
                <Bold className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={cn(
                    "p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground",
                    editor.isActive('italic') ? "bg-primary/10 text-primary font-medium" : ""
                )}
                type="button"
                title="Italic (Cmd+I)"
            >
                <Italic className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(
                    "p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground",
                    editor.isActive('bulletList') ? "bg-primary/10 text-primary font-medium" : ""
                )}
                type="button"
                title="Bullet List"
            >
                <List className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(
                    "p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground",
                    editor.isActive('orderedList') ? "bg-primary/10 text-primary font-medium" : ""
                )}
                type="button"
                title="Ordered List"
            >
                <ListOrdered className="w-3.5 h-3.5" />
            </button>
        </div>
    );
};

export const RichTextEditor = memo(({
    value,
    onChange,
    className,
    placeholder,
    debounceMs = 300
}: RichTextEditorProps) => {
    // Debounce timer ref
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Debounced onChange handler
    const debouncedOnChange = useCallback((newValue: string) => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            onChange(newValue);
        }, debounceMs);
    }, [onChange, debounceMs]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Markdown,
            Placeholder.configure({
                placeholder: placeholder || 'Type something...',
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            const storage = editor.storage as any;
            debouncedOnChange(storage.markdown.getMarkdown());
        },
        editorProps: {
            attributes: {
                class: cn(
                    "prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3 text-sm leading-relaxed text-foreground caret-primary",
                    "prose-p:my-1 prose-ul:my-1 prose-li:my-0",
                    "prose-headings:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-code:text-foreground",
                    className
                ),
            },
        },
    });

    // Update content if value changes externally (and differs from current editor content)
    useEffect(() => {
        if (editor && value !== undefined) {
            const storage = editor.storage as any;
            const currentContent = storage.markdown?.getMarkdown() ?? '';

            if (value !== currentContent) {
                editor.commands.setContent(value);
            }
        }
    }, [value, editor]);



    return (
        <div className="w-full border border-input rounded-md overflow-hidden bg-background focus-within:outline-none focus-within:border-primary transition-all group overscroll-contain">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} className="max-h-[300px] overflow-y-auto custom-scrollbar" />
        </div>
    );
});

RichTextEditor.displayName = 'RichTextEditor';


