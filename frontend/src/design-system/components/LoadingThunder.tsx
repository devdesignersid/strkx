import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const loadingThunderVariants = cva(
    'relative',
    {
        variants: {
            size: {
                sm: 'w-4 h-4',
                md: 'w-6 h-6',
                lg: 'w-8 h-8',
                xl: 'w-12 h-12',
            },
        },
        defaultVariants: {
            size: 'md',
        },
    }
);

interface LoadingThunderProps extends VariantProps<typeof loadingThunderVariants> {
    className?: string;
    strokeWidth?: number;
}

/**
 * LoadingThunder - Premium animated loading indicator
 * 
 * Features a thunder/lightning bolt with an animated stroke that
 * "travels" around the outline in a smooth, continuous loop.
 * 
 * @example
 * <LoadingThunder size="lg" />
 * <LoadingThunder size="md" className="mx-auto" />
 */
export function LoadingThunder({
    size,
    className,
    strokeWidth = 2
}: LoadingThunderProps) {
    // Thunder bolt path - matches logo exactly (favicon.svg)
    // Points: 13,2 -> 3,14 -> 12,14 -> 11,22 -> 21,10 -> 12,10 -> 13,2
    const thunderPath = "M13 2 L3 14 H12 L11 22 L21 10 H12 L13 2 Z";

    return (
        <div className={cn(loadingThunderVariants({ size }), className)}>
            <svg
                viewBox="0 0 22 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
            >
                {/* Background stroke - subtle ghost of the full shape */}
                <path
                    d={thunderPath}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary/20"
                    fill="none"
                />

                {/* Animated stroke - main animation */}
                <motion.path
                    d={thunderPath}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 1, 1, 0],
                        opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        times: [0, 0.4, 0.6, 1],
                    }}
                />

                {/* Glow effect - trailing highlight */}
                <motion.path
                    d={thunderPath}
                    stroke="currentColor"
                    strokeWidth={strokeWidth + 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary/30"
                    fill="none"
                    style={{ filter: 'blur(2px)' }}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: [0, 1, 1, 0],
                        opacity: [0, 0.5, 0.5, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        times: [0, 0.4, 0.6, 1],
                    }}
                />
            </svg>
        </div>
    );
}

export default LoadingThunder;
