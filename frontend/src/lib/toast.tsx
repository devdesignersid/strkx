import { toast as sonnerToast, type ExternalToast } from 'sonner';
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { TOAST_MESSAGES } from './toast-catalog';

// Type for our catalog messages
type ToastMessage = { title: string; description?: string };

// Configuration constants
const TOAST_DURATION = 4000;
const DEBOUNCE_MS = 500;

// Track last toast timestamps to prevent spam
const lastToastTimestamps: Record<string, number> = {};

function shouldShowToast(key: string): boolean {
  const now = Date.now();
  const last = lastToastTimestamps[key] || 0;
  if (now - last < DEBOUNCE_MS) {
    return false;
  }
  lastToastTimestamps[key] = now;
  return true;
}

// Custom styles for different toast types
const styles = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    className: 'border-green-500/20 bg-green-500/10',
  },
  error: {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    className: 'border-red-500/20 bg-red-500/10',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    className: 'border-yellow-500/20 bg-yellow-500/10',
  },
  info: {
    icon: <Info className="w-5 h-5 text-blue-500" />,
    className: 'border-blue-500/20 bg-blue-500/10',
  },
  loading: {
    icon: <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />,
    className: 'border-border bg-secondary/50',
  },
};

type ToastOptions = ExternalToast & {
  // Optional key for debouncing specific custom messages
  key?: string;
};

export const toast = {
  success: (message: string | ToastMessage, options?: ToastOptions) => {
    const { title, description } = typeof message === 'string' ? { title: message, description: undefined } : message;
    const key = options?.key || title;

    if (!shouldShowToast(key)) return;

    sonnerToast.success(title, {
      description,
      duration: TOAST_DURATION,
      icon: styles.success.icon,
      className: styles.success.className,
      ...options,
    });
  },

  error: (message: string | ToastMessage, options?: ToastOptions) => {
    const { title, description } = typeof message === 'string' ? { title: message, description: undefined } : message;
    const key = options?.key || title;

    if (!shouldShowToast(key)) return;

    sonnerToast.error(title, {
      description,
      duration: TOAST_DURATION + 1000, // Errors stay a bit longer
      icon: styles.error.icon,
      className: styles.error.className,
      ...options,
    });
  },

  warning: (message: string | ToastMessage, options?: ToastOptions) => {
    const { title, description } = typeof message === 'string' ? { title: message, description: undefined } : message;
    const key = options?.key || title;

    if (!shouldShowToast(key)) return;

    sonnerToast.warning(title, {
      description,
      duration: TOAST_DURATION,
      icon: styles.warning.icon,
      className: styles.warning.className,
      ...options,
    });
  },

  info: (message: string | ToastMessage, options?: ToastOptions) => {
    const { title, description } = typeof message === 'string' ? { title: message, description: undefined } : message;
    const key = options?.key || title;

    if (!shouldShowToast(key)) return;

    sonnerToast.info(title, {
      description,
      duration: TOAST_DURATION,
      icon: styles.info.icon,
      className: styles.info.className,
      ...options,
    });
  },

  loading: (message: string | ToastMessage, options?: ToastOptions) => {
    const { title, description } = typeof message === 'string' ? { title: message, description: undefined } : message;

    // Loading toasts usually shouldn't be debounced as they track immediate state
    return sonnerToast.loading(title, {
      description,
      icon: styles.loading.icon,
      className: styles.loading.className,
      ...options,
    });
  },

  dismiss: (id?: string | number) => sonnerToast.dismiss(id),

  // Expose raw sonner for edge cases if absolutely needed
  raw: sonnerToast,
};

export { TOAST_MESSAGES };
