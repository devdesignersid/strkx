import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Edit, Trash2 } from 'lucide-react';

interface RowActionMenuProps {
    id: string;
    x: number;
    y: number;
    onClose: () => void;
    onModify: (id: string) => void;
    onDelete: (id: string) => void;
}

export function RowActionMenu({ id, x, y, onClose, onModify, onDelete }: RowActionMenuProps) {
    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-start justify-start"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                    position: 'absolute',
                    top: y + 5,
                    left: x - 128
                }}
                className="w-32 bg-card border border-border rounded-lg shadow-xl overflow-hidden row-action-menu-content"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors text-left"
                    onClick={() => onModify(id)}
                >
                    <Edit className="w-3.5 h-3.5" />
                    Modify
                </button>
                <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors text-left"
                    onClick={() => onDelete(id)}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                </button>
            </motion.div>
        </div>,
        document.body
    );
}
