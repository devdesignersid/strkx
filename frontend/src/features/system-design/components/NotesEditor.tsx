import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import { Markdown } from 'tiptap-markdown';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Code, Heading1, Heading2, List, ListOrdered, Quote, Undo, Redo, PanelBottomClose, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { Button } from '@/design-system/components';

interface NotesEditorProps {
    value: string;
    onChange: (value: string) => void;
    onSave?: () => void;
    readOnly?: boolean;
    onCollapse?: () => void;
    isMaximized?: boolean;
    onToggleMaximize?: () => void;
}

const MenuBar = ({ editor, onCollapse, isMaximized, onToggleMaximize }: { editor: any, onCollapse?: () => void, isMaximized?: boolean, onToggleMaximize?: () => void }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={cn(
                        "h-7 w-7",
                        editor.isActive('bold') ? 'bg-white/10 text-primary' : 'text-muted-foreground'
                    )}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={cn(
                        "h-7 w-7",
                        editor.isActive('italic') ? 'bg-white/10 text-primary' : 'text-muted-foreground'
                    )}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    disabled={!editor.can().chain().focus().toggleCode().run()}
                    className={cn(
                        "h-7 w-7",
                        editor.isActive('code') ? 'bg-white/10 text-primary' : 'text-muted-foreground'
                    )}
                    title="Code"
                >
                    <Code className="w-4 h-4" />
                </Button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={cn(
                        "h-7 w-7",
                        editor.isActive('heading', { level: 1 }) ? 'bg-white/10 text-primary' : 'text-muted-foreground'
                    )}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={cn(
                        "h-7 w-7",
                        editor.isActive('heading', { level: 2 }) ? 'bg-white/10 text-primary' : 'text-muted-foreground'
                    )}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </Button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={cn(
                        "h-7 w-7",
                        editor.isActive('bulletList') ? 'bg-white/10 text-primary' : 'text-muted-foreground'
                    )}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={cn(
                        "h-7 w-7",
                        editor.isActive('orderedList') ? 'bg-white/10 text-primary' : 'text-muted-foreground'
                    )}
                    title="Ordered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={cn(
                        "h-7 w-7",
                        editor.isActive('blockquote') ? 'bg-white/10 text-primary' : 'text-muted-foreground'
                    )}
                    title="Quote"
                >
                    <Quote className="w-4 h-4" />
                </Button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().chain().focus().undo().run()}
                    className="h-7 w-7 text-muted-foreground disabled:opacity-50"
                    title="Undo"
                >
                    <Undo className="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().chain().focus().redo().run()}
                    className="h-7 w-7 text-muted-foreground disabled:opacity-50"
                    title="Redo"
                >
                    <Redo className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex items-center gap-1">
                {onToggleMaximize && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleMaximize}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5"
                        title={isMaximized ? "Restore Size" : "Maximize Notes"}
                    >
                        {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                )}

                {onCollapse && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCollapse}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-white/5"
                        title="Collapse Notes"
                    >
                        <PanelBottomClose className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default function NotesEditor({
    value,
    onChange,
    onSave,
    readOnly = false,
    onCollapse,
    isMaximized,
    onToggleMaximize,
}: NotesEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Typography,
            Markdown,
            Placeholder.configure({
                placeholder: 'Start taking notes...',
            }),
        ],
        content: value,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            // Get markdown content
            const markdown = (editor.storage as any).markdown.getMarkdown();
            onChange(markdown);
            onSave?.();
        },
        editorProps: {
            attributes: {
                class: cn(
                    'prose prose-invert max-w-none focus:outline-none min-h-[200px] px-6 py-5',
                    // Enhanced typography
                    'prose-headings:font-semibold prose-headings:tracking-tight',
                    'prose-h1:text-xl prose-h1:mb-4 prose-h1:mt-6',
                    'prose-h2:text-lg prose-h2:mb-3 prose-h2:mt-5 prose-h2:text-primary/90',
                    'prose-h3:text-base prose-h3:mb-2 prose-h3:mt-4',
                    // Paragraph and text styling
                    'prose-p:text-sm prose-p:leading-relaxed prose-p:text-foreground/90',
                    'prose-p:my-3',
                    // List styling
                    'prose-li:text-sm prose-li:text-foreground/90 prose-li:my-1',
                    'prose-ul:my-2 prose-ol:my-2',
                    // Code styling
                    'prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-medium',
                    'prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50',
                    // Quote styling
                    'prose-blockquote:border-l-primary/50 prose-blockquote:text-muted-foreground prose-blockquote:italic',
                    // Link styling
                    'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
                    // Strong and emphasis
                    'prose-strong:font-semibold prose-strong:text-foreground',
                ),
            },
        },
    });

    useEffect(() => {
        if (editor && value !== (editor.storage as any).markdown.getMarkdown()) {
            if (!editor.isFocused) {
                editor.commands.setContent(value);
            }
        }
    }, [value, editor]);

    useEffect(() => {
        if (editor) {
            editor.setEditable(!readOnly);
        }
    }, [readOnly, editor]);

    return (
        <div className="h-full flex flex-col bg-card border-r border-border">
            {!readOnly && <MenuBar editor={editor} onCollapse={onCollapse} isMaximized={isMaximized} onToggleMaximize={onToggleMaximize} />}
            <div className="flex-1 overflow-y-auto cursor-text" onClick={() => editor?.chain().focus().run()}>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
