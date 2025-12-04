export const spacing = {
  // Standard Tailwind spacing scale can be re-exported or defined here if we want to restrict it.
  // For now, we will rely on Tailwind's default spacing but this file serves as a placeholder for future custom spacing.
  px: '1px',
  0: '0px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
} as const;

// Semantic spacing tokens for consistent layout patterns
export const semanticSpacing = {
  // Page-level
  page: '2rem',           // px-8, py-8 - outer page padding
  pageY: '2rem',          // vertical page padding
  pageX: '2rem',          // horizontal page padding

  // Section spacing
  section: '1.5rem',      // gap-6 - between major sections
  sectionLg: '2rem',      // gap-8 - larger section gaps (dashboard)

  // Card spacing
  card: '1.5rem',         // p-6 - standard card padding
  cardCompact: '1rem',    // p-4 - compact card padding
  cardHeader: '1.5rem',   // header/footer padding

  // Element spacing
  stack: '1rem',          // gap-4 - between stacked elements
  stackSm: '0.5rem',      // gap-2 - tight stacking
  stackLg: '1.5rem',      // gap-6 - loose stacking

  inline: '0.5rem',       // gap-2 - between inline elements
  inlineSm: '0.25rem',    // gap-1 - tight inline spacing
  inlineLg: '0.75rem',    // gap-3 - loose inline spacing

  // Form spacing
  formGap: '1rem',        // gap between form fields
  formLabelGap: '0.5rem', // gap between label and input

  // Component internal
  buttonPadding: '1rem',  // px-4 - horizontal button padding
  inputPadding: '0.75rem', // px-3 - horizontal input padding
} as const;

export type SemanticSpacing = keyof typeof semanticSpacing;

