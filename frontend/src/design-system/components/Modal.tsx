import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useId, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { IconButton } from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children?: ReactNode;
    footer?: ReactNode;
    className?: string;
}

export function Modal({ isOpen, onClose, title, description, children, footer, className }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);
    const hasInitiallyFocused = useRef(false);
    const titleId = useId();
    const descriptionId = useId();

    // Handle ESC key close
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    // Focus trap and keyboard handling
    useEffect(() => {
        if (isOpen) {
            // Save current focus only on initial open
            if (!hasInitiallyFocused.current) {
                previousActiveElement.current = document.activeElement as HTMLElement;
            }

            // Add ESC listener
            document.addEventListener('keydown', handleKeyDown);

            // Focus the modal only on initial open, not on every re-render
            if (!hasInitiallyFocused.current) {
                hasInitiallyFocused.current = true;
                setTimeout(() => {
                    // Focus the first focusable element inside the modal instead of the modal itself
                    const firstInput = modalRef.current?.querySelector<HTMLElement>(
                        'input, textarea, select, button:not([aria-label="Close dialog"])'
                    );
                    if (firstInput) {
                        firstInput.focus();
                    } else {
                        modalRef.current?.focus();
                    }
                }, 0);
            }

            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        } else {
            // Reset the flag when modal closes
            hasInitiallyFocused.current = false;
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';

            // Restore focus on close
            if (previousActiveElement.current && !isOpen) {
                previousActiveElement.current.focus();
            }
        };
    }, [isOpen, handleKeyDown]);

    // Focus trap: keep focus within modal
    const handleTabKey = (e: React.KeyboardEvent) => {
        if (e.key !== 'Tab' || !modalRef.current) return;

        const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement?.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement?.focus();
            }
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={cn("relative bg-card border border-border rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 z-10", className)}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        aria-describedby={description ? descriptionId : undefined}
                        tabIndex={-1}
                        onKeyDown={handleTabKey}
                    >
                        <IconButton
                            onClick={onClose}
                            variant="ghost"
                            size="sm"
                            aria-label="Close dialog"
                            className="absolute top-4 right-4"
                            disableMotion
                        >
                            <X className="w-4 h-4" />
                        </IconButton>

                        <div className="mb-6">
                            <h2
                                id={titleId}
                                className="text-lg font-semibold text-foreground mb-1 truncate"
                            >
                                {title}
                            </h2>
                            {description && (
                                <p
                                    id={descriptionId}
                                    className="text-sm text-muted-foreground"
                                >
                                    {description}
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            {children}
                        </div>

                        {footer && (
                            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
