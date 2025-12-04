import type { Variants, Transition } from 'framer-motion';

// Duration tokens (in seconds)
export const duration = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  slower: 0.6,
} as const;

// Spring presets
export const spring = {
  // Snappy - for buttons, toggles, micro-interactions
  snappy: { type: 'spring', stiffness: 500, damping: 30 } as Transition,
  // Gentle - for modals, panels, larger elements
  gentle: { type: 'spring', stiffness: 300, damping: 25 } as Transition,
  // Bouncy - for playful interactions
  bouncy: { type: 'spring', stiffness: 400, damping: 15 } as Transition,
} as const;

// Animation Variants
export const buttonClick: Variants = {
  tap: { scale: 0.97 },
  hover: { scale: 1.01 },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.normal } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.normal } },
  exit: { opacity: 0, y: 8, transition: { duration: duration.fast } },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.normal } },
  exit: { opacity: 0, y: -8, transition: { duration: duration.fast } },
};

export const slideUp: Variants = {
  initial: { y: 10, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: duration.slow, ease: 'easeOut' } },
};

export const slideInRight: Variants = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: spring.gentle },
  exit: { x: 20, opacity: 0, transition: { duration: duration.fast } },
};

export const scaleIn: Variants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: spring.snappy },
  exit: { scale: 0.95, opacity: 0, transition: { duration: duration.fast } },
};

export const popIn: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: spring.bouncy },
  exit: { scale: 0.9, opacity: 0, transition: { duration: duration.fast } },
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    }
  }
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.normal } },
};

// Modal specific
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.fast } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: spring.gentle },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: duration.fast } },
};

// Collapse/expand
export const collapse: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1, transition: spring.gentle },
  exit: { height: 0, opacity: 0, transition: { duration: duration.fast } },
};
