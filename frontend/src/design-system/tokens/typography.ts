/**
 * Typography Design Tokens
 * 
 * Premium typography scale optimized for:
 * - Clarity and readability
 * - Strong visual hierarchy
 * - Reduced visual fatigue
 * - Consistency across all components
 */

export const typography = {
  fontFamily: {
    sans: ['DM Sans', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },

  /**
   * Font Size Scale
   * 
   * Optimized line-heights and letter-spacing for each size:
   * - Larger sizes: tighter tracking (-0.02em to -0.025em)
   * - Body sizes: neutral tracking (0)
   * - Small sizes: looser tracking (0.005em to 0.01em)
   */
  fontSize: {
    // Display - Hero headings, marketing
    display: ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],    // 36px

    // Headings - Progressively tighter tracking
    '3xl': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],      // 30px
    '2xl': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],       // 24px
    'xl': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.015em' }],       // 20px
    'lg': ['1.125rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }],       // 18px

    // Body - Comfortable reading
    'base': ['0.9375rem', { lineHeight: '1.5', letterSpacing: '0' }],          // 15px
    'sm': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0.005em' }],      // 13px

    // Small text - Slight expansion for legibility
    'xs': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],       // 11px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  /**
   * Semantic Text Styles
   * 
   * Pre-composed styles for consistent usage across the application.
   * Use these instead of ad-hoc Tailwind classes.
   */
  textStyles: {
    // Display - Hero headings, marketing headlines
    display: 'text-4xl font-bold tracking-tight leading-tight',

    // Page-level headings
    h1: 'text-3xl font-bold tracking-tight leading-tight',
    h2: 'text-2xl font-semibold tracking-tight leading-snug',
    h3: 'text-xl font-semibold tracking-tight leading-snug',
    h4: 'text-lg font-semibold leading-snug',

    // Body text
    body: 'text-[15px] font-normal leading-relaxed',
    bodySmall: 'text-[13px] font-normal leading-relaxed',

    // Labels & interactive elements
    label: 'text-[13px] font-medium leading-none tracking-wide',
    labelSmall: 'text-[11px] font-medium leading-none tracking-wide',

    // Metadata & secondary information
    caption: 'text-[11px] font-normal text-muted-foreground leading-normal tracking-wide',
    metadata: 'text-[11px] font-medium text-muted-foreground tracking-wider uppercase',

    // Overline - Section labels, category indicators
    overline: 'text-[10px] font-semibold text-muted-foreground tracking-widest uppercase',

    // Code
    code: 'font-mono text-[13px] leading-relaxed',
    codeSmall: 'font-mono text-[11px] leading-normal',
  },

  /**
   * Letter Spacing Scale
   * 
   * Fine-grained tracking control for typography refinement.
   */
  letterSpacing: {
    tighter: '-0.025em',
    tight: '-0.02em',
    snug: '-0.01em',
    normal: '0',
    wide: '0.01em',
    wider: '0.025em',
    widest: '0.05em',
  },

  /**
   * Line Height Scale
   * 
   * Optimized for different text contexts.
   */
  lineHeight: {
    none: '1',
    tight: '1.1',
    snug: '1.25',
    normal: '1.4',
    relaxed: '1.5',
    loose: '1.75',
  },
} as const;

export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type TextStyle = keyof typeof typography.textStyles;
export type LetterSpacing = keyof typeof typography.letterSpacing;
export type LineHeight = keyof typeof typography.lineHeight;
