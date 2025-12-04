/**
 * Icon Usage Guide
 * 
 * This module defines patterns and utilities for consistent icon usage
 * across the application. All icons use Lucide React.
 */

import type { LucideIcon } from 'lucide-react';

// ============================================
// Icon Size Tokens
// ============================================

export const iconSizes = {
    xs: 'w-3 h-3',      // 12px - inline text, compact UI
    sm: 'w-3.5 h-3.5',  // 14px - table actions, small buttons
    md: 'w-4 h-4',      // 16px - default, buttons, inputs
    lg: 'w-5 h-5',      // 20px - card headers, prominent actions
    xl: 'w-6 h-6',      // 24px - navigation, large buttons
    '2xl': 'w-8 h-8',   // 32px - empty state icons
    '3xl': 'w-12 h-12', // 48px - hero illustrations
} as const;

export type IconSize = keyof typeof iconSizes;

// ============================================
// Icon Color Tokens
// ============================================

export const iconColors = {
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    primary: 'text-primary',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-destructive',
    info: 'text-blue-500',
} as const;

export type IconColor = keyof typeof iconColors;

// ============================================
// Icon Categories & Semantic Mapping
// ============================================

/**
 * Navigation Icons
 * Used for primary navigation and route indication
 */
export const navigationIcons = {
    home: 'Home',
    problems: 'Code2',
    systemDesign: 'PenTool',
    mockInterview: 'MessageSquare',
    settings: 'Settings',
} as const;

/**
 * Action Icons
 * Used for interactive elements that trigger actions
 */
export const actionIcons = {
    add: 'Plus',
    remove: 'Minus',
    delete: 'Trash2',
    edit: 'Edit',
    save: 'Save',
    cancel: 'X',
    refresh: 'RefreshCw',
    search: 'Search',
    filter: 'Filter',
    sort: 'ArrowUpDown',
    expand: 'ChevronDown',
    collapse: 'ChevronUp',
    more: 'MoreHorizontal',
} as const;

/**
 * Status Icons
 * Used for representing state or status
 */
export const statusIcons = {
    success: 'CheckCircle2',
    error: 'XCircle',
    warning: 'AlertTriangle',
    info: 'Info',
    pending: 'Clock',
    loading: 'Loader2',
} as const;

/**
 * Editor Icons
 * Used in code editor and related toolbars
 */
export const editorIcons = {
    run: 'Play',
    stop: 'Square',
    reset: 'RotateCcw',
    hint: 'Lightbulb',
    complete: 'Sparkles',
    fullscreen: 'Maximize2',
    exitFullscreen: 'Minimize2',
    keyboard: 'Keyboard',
    focus: 'Focus',
} as const;

// ============================================
// Icon Component Helpers
// ============================================

/**
 * Get icon classes for a specific size and color
 */
export function getIconClasses(
    size: IconSize = 'md',
    color: IconColor = 'default'
): string {
    return `${iconSizes[size]} ${iconColors[color]}`;
}

/**
 * Icon wrapper props interface
 */
export interface IconWrapperProps {
    icon: LucideIcon;
    size?: IconSize;
    color?: IconColor;
    className?: string;
    'aria-label'?: string;
}

// ============================================
// Motion Patterns for Icons
// ============================================

export const iconMotion = {
    // Hover scale for interactive icons
    hover: {
        scale: 1.1,
        transition: { duration: 0.15 },
    },

    // Tap feedback
    tap: {
        scale: 0.9,
        transition: { duration: 0.1 },
    },

    // Spin animation for loading
    spin: {
        rotate: 360,
        transition: {
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
        },
    },

    // Pulse for attention
    pulse: {
        scale: [1, 1.1, 1],
        transition: {
            duration: 0.6,
            repeat: Infinity,
        },
    },

    // Pop-in for status changes
    popIn: {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: 'spring', stiffness: 500, damping: 25 },
    },
} as const;

// ============================================
// Usage Guidelines (JSDoc for IDE hints)
// ============================================

/**
 * @example
 * // Button with icon
 * <Button>
 *   <Plus className={getIconClasses('md')} />
 *   Add Problem
 * </Button>
 * 
 * @example
 * // Icon-only button with tooltip
 * <Tooltip content="Reset">
 *   <Button variant="ghost" size="icon">
 *     <RotateCcw className={getIconClasses('md', 'muted')} />
 *   </Button>
 * </Tooltip>
 * 
 * @example
 * // Status indicator
 * <CheckCircle2 className={getIconClasses('sm', 'success')} />
 * 
 * @example
 * // Animated loading icon
 * <motion.div animate={iconMotion.spin}>
 *   <Loader2 className={getIconClasses('md')} />
 * </motion.div>
 */
