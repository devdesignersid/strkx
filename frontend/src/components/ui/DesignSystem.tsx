import type { Variants } from 'framer-motion';

// Animation Variants
export const buttonClick: Variants = {
  tap: { scale: 0.95 },
  hover: { scale: 1.02, filter: 'brightness(1.1)' },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0 },
};

export const slideUp: Variants = {
  initial: { y: 10, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const scaleIn: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } },
};
