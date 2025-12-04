export const typography = {
  fontFamily: {
    sans: ['DM Sans', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  // Font size scale with line heights
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],        // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],    // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],       // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],    // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],     // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  // Semantic text styles for consistent usage
  textStyles: {
    // Headings
    h1: 'text-3xl font-bold tracking-tight',
    h2: 'text-2xl font-semibold tracking-tight',
    h3: 'text-xl font-semibold',
    h4: 'text-lg font-semibold',
    // Body
    body: 'text-base font-normal',
    bodySmall: 'text-sm font-normal',
    // Labels & captions
    label: 'text-sm font-medium',
    caption: 'text-xs font-normal text-muted-foreground',
    // Code
    code: 'font-mono text-sm',
  },
} as const;

export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type TextStyle = keyof typeof typography.textStyles;
