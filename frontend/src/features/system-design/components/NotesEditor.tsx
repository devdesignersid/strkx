import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import { Markdown } from 'tiptap-markdown';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Code, Heading1, Heading2, List, ListOrdered, Quote, Undo, Redo, PanelBottomClose, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

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
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-card overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={cn(
                        "p-1.5 rounded hover:bg-white/10 transition-colors",
                        editor.isActive('bold') ? 'bg-white/10 text-primary' : 'text-muted-foreground'
                    )}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={cn(
                        "p-1.5 rounded hover:bg-white/10 transition-colors",
                        editor.isActive('italic') ? 'bg-white/10 text-primary' : 'text-muted-foreground'
                    )}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    disabled={!editor.can().chain().focus().toggleCode().run()}
                    className={cn(
                        "p-1.5 rounded hover:bg-white/10 transition-colors",
                        editor.isActive('code') ? 'bg-white/10 text-primary' : 'text-muted-foreground'
                    )}
                    title="Code"
                >
                    <Code className="w-4 h-4" />
                </button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={cn(
                        "p-1.5 rounded hover:bg-white/10 transition-colors",
                        editor.isActive('heading', { level: 1 }) ? 'bg-white/10 text-primary' : 'text-muted-foreground'
                    )}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={cn(
                        "p-1.5 rounded hover:bg-white/10 transition-colors",
                        editor.isActive('heading', { level: 2 }) ? 'bg-white/10 text-primary' : 'text-muted-foreground'
                    )}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={cn(
                        "p-1.5 rounded hover:bg-white/10 transition-colors",
                        editor.isActive('bulletList') ? 'bg-white/10 text-primary' : 'text-muted-foreground'
                    )}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={cn(
                        "p-1.5 rounded hover:bg-white/10 transition-colors",
                        editor.isActive('orderedList') ? 'bg-white/10 text-primary' : 'text-muted-foreground'
                    )}
                    title="Ordered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={cn(
                        "p-1.5 rounded hover:bg-white/10 transition-colors",
                        editor.isActive('blockquote') ? 'bg-white/10 text-primary' : 'text-muted-foreground'
                    )}
                    title="Quote"
                >
                    <Quote className="w-4 h-4" />
                </button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().chain().focus().undo().run()}
                    className="p-1.5 rounded hover:bg-white/10 transition-colors text-muted-foreground disabled:opacity-50"
                    title="Undo"
                >
                    <Undo className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().chain().focus().redo().run()}
                    className="p-1.5 rounded hover:bg-white/10 transition-colors text-muted-foreground disabled:opacity-50"
                    title="Redo"
                >
                    <Redo className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-center gap-1">
                {onToggleMaximize && (
                    <button
                        onClick={onToggleMaximize}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
                        title={isMaximized ? "Restore Size" : "Maximize Notes"}
                    >
                        {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                )}

                {onCollapse && (
                    <button
                        onClick={onCollapse}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
                        title="Collapse Notes"
                    >
                        <PanelBottomClose className="w-4 h-4" />
                    </button>
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
                placeholder: 'Write your notes here...',
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
                class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px] px-6 py-4',
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
