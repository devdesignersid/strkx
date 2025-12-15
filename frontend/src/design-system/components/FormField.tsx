import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from './Label';
import { Input, type InputProps } from './Input';
import { Textarea } from './Textarea';
import { motion, AnimatePresence } from 'framer-motion';

interface FormFieldProps {
    label: string;
    description?: string;
    error?: string;
    required?: boolean;
    className?: string;
    children: React.ReactNode;
}

/**
 * FormField Component
 * 
 * Refined form field with premium typography:
 * - Consistent label sizing
 * - Improved description contrast
 * - Subtle error styling
 */
export function FormField({
    label,
    description,
    error,
    required,
    className,
    children,
}: FormFieldProps) {
    const id = React.useId();
    const descriptionId = `${id}-description`;
    const errorId = `${id}-error`;

    // Clone children to inject aria attributes
    const enhancedChildren = React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
                id,
                'aria-describedby': cn(
                    description && descriptionId,
                    error && errorId
                ) || undefined,
                'aria-invalid': error ? true : undefined,
                state: error ? 'error' : undefined,
            });
        }
        return child;
    });

    return (
        <div className={cn('space-y-1.5', className)}>
            <Label htmlFor={id} className="flex items-center gap-1 text-[13px] font-medium tracking-wide">
                {label}
                {required && <span className="text-destructive text-[11px]">*</span>}
            </Label>

            {description && (
                <p
                    id={descriptionId}
                    className="text-[11px] text-muted-foreground leading-relaxed"
                >
                    {description}
                </p>
            )}

            {enhancedChildren}

            <AnimatePresence mode="wait">
                {error && (
                    <motion.p
                        id={errorId}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="text-[11px] font-medium text-destructive tracking-wide"
                        role="alert"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

// Convenience wrappers for common form field types
interface FormInputProps extends Omit<InputProps, 'id' | 'aria-describedby' | 'aria-invalid'> {
    label: string;
    description?: string;
    error?: string;
    required?: boolean;
}

export function FormInput({
    label,
    description,
    error,
    required,
    className,
    ...inputProps
}: FormInputProps) {
    return (
        <FormField
            label={label}
            description={description}
            error={error}
            required={required}
        >
            <Input {...inputProps} state={error ? 'error' : 'default'} />
        </FormField>
    );
}

interface FormTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'aria-describedby' | 'aria-invalid'> {
    label: string;
    description?: string;
    error?: string;
    required?: boolean;
}

export function FormTextarea({
    label,
    description,
    error,
    required,
    className,
    ...textareaProps
}: FormTextareaProps) {
    return (
        <FormField
            label={label}
            description={description}
            error={error}
            required={required}
        >
            <Textarea {...textareaProps} className={cn(error && 'border-destructive focus-visible:ring-destructive', className)} />
        </FormField>
    );
}
