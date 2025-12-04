interface IllustrationProps {
    className?: string;
}

/**
 * Empty Problems List Illustration
 * Used when no problems exist in the list
 */
export function EmptyProblemsIllustration({ className }: IllustrationProps) {
    return (
        <svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background circle */}
            <circle cx="60" cy="60" r="56" className="fill-primary/10" />

            {/* Document stack */}
            <rect x="35" y="45" width="50" height="40" rx="4" className="fill-primary/30" />
            <rect x="38" y="42" width="50" height="40" rx="4" className="fill-primary/60" />
            <rect x="41" y="39" width="50" height="40" rx="4" className="fill-card stroke-primary/20" strokeWidth="1.5" />

            {/* Lines on document */}
            <rect x="49" y="49" width="26" height="3" rx="1.5" className="fill-primary/30" />
            <rect x="49" y="56" width="34" height="3" rx="1.5" className="fill-primary/20" />
            <rect x="49" y="63" width="20" height="3" rx="1.5" className="fill-primary/20" />

            {/* Plus icon */}
            <circle cx="85" cy="75" r="14" className="fill-primary" />
            <path d="M85 69v12M79 75h12" className="stroke-primary-foreground" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

/**
 * Empty Dashboard Illustration
 * Used when user has no activity yet
 */
export function EmptyDashboardIllustration({ className }: IllustrationProps) {
    return (
        <svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background circle */}
            <circle cx="60" cy="60" r="56" className="fill-primary/10" />

            {/* Seed/growth metaphor */}
            <ellipse cx="60" cy="85" rx="20" ry="6" className="fill-primary/20" />

            {/* Seedling */}
            <path
                d="M60 85V55"
                className="stroke-primary"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M60 55C60 55 50 50 50 40C50 30 60 28 60 28C60 28 70 30 70 40C70 50 60 55 60 55Z"
                className="fill-primary/60"
            />
            <path
                d="M60 65C60 65 48 58 45 48"
                className="stroke-primary/60"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <circle cx="45" cy="48" r="8" className="fill-primary/30" />

            {/* Sparkles */}
            <circle cx="80" cy="35" r="3" className="fill-primary/40" />
            <circle cx="35" cy="45" r="2" className="fill-primary/30" />
            <circle cx="90" cy="55" r="2" className="fill-primary/20" />
        </svg>
    );
}

/**
 * Empty Activity Illustration
 * Used when there's no recent activity in the activity feed
 */
export function EmptyActivityIllustration({ className }: IllustrationProps) {
    return (
        <svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background circle */}
            <circle cx="60" cy="60" r="56" className="fill-primary/10" />

            {/* Clock body */}
            <circle cx="60" cy="55" r="28" className="fill-card stroke-primary/30" strokeWidth="2" />
            <circle cx="60" cy="55" r="23" className="fill-primary/5" />

            {/* Clock hands - stopped/waiting */}
            <path d="M60 55V40" className="stroke-primary/60" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M60 55L72 55" className="stroke-primary/40" strokeWidth="2" strokeLinecap="round" />

            {/* Center dot */}
            <circle cx="60" cy="55" r="3" className="fill-primary" />

            {/* Hour markers */}
            <circle cx="60" cy="35" r="2" className="fill-primary/40" />
            <circle cx="80" cy="55" r="2" className="fill-primary/40" />
            <circle cx="60" cy="75" r="2" className="fill-primary/40" />
            <circle cx="40" cy="55" r="2" className="fill-primary/40" />

            {/* Zzz sleep/idle indicator */}
            <text x="82" y="35" className="fill-primary/50" fontSize="10" fontWeight="bold">z</text>
            <text x="88" y="30" className="fill-primary/40" fontSize="8" fontWeight="bold">z</text>
            <text x="93" y="26" className="fill-primary/30" fontSize="6" fontWeight="bold">z</text>
        </svg>
    );
}

/**
 * Error State Illustration
 * Used for error boundaries and failed requests
 */
export function ErrorIllustration({ className }: IllustrationProps) {
    return (
        <svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background circle */}
            <circle cx="60" cy="60" r="56" className="fill-destructive/10" />

            {/* Warning triangle */}
            <path
                d="M60 30L90 80H30L60 30Z"
                className="fill-destructive/20 stroke-destructive"
                strokeWidth="2"
                strokeLinejoin="round"
            />

            {/* Exclamation mark */}
            <path d="M60 50V62" className="stroke-destructive" strokeWidth="4" strokeLinecap="round" />
            <circle cx="60" cy="70" r="2.5" className="fill-destructive" />

            {/* Retry arrow hint */}
            <path
                d="M85 85C85 85 80 90 75 90C70 90 65 85 65 85"
                className="stroke-muted-foreground"
                strokeWidth="2"
                strokeLinecap="round"
            />
            <path d="M65 85L65 80M65 85L70 85" className="stroke-muted-foreground" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

/**
 * Success/Completed Illustration
 * Used for success states and completion
 */
export function SuccessIllustration({ className }: IllustrationProps) {
    return (
        <svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background circle */}
            <circle cx="60" cy="60" r="56" className="fill-green-500/10" />

            {/* Check circle */}
            <circle cx="60" cy="60" r="30" className="fill-green-500/20 stroke-green-500" strokeWidth="2" />

            {/* Check mark */}
            <path
                d="M45 60L55 70L75 50"
                className="stroke-green-500"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Sparkles */}
            <circle cx="90" cy="35" r="4" className="fill-green-500/40" />
            <circle cx="30" cy="40" r="3" className="fill-green-500/30" />
            <circle cx="85" cy="85" r="3" className="fill-green-500/30" />
        </svg>
    );
}

/**
 * Loading/Processing Illustration
 * Used for loading states (static version)
 */
export function LoadingIllustration({ className }: IllustrationProps) {
    return (
        <svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background circle */}
            <circle cx="60" cy="60" r="56" className="fill-primary/10" />

            {/* Progress ring */}
            <circle
                cx="60"
                cy="60"
                r="30"
                className="stroke-primary/20"
                strokeWidth="4"
                fill="none"
            />
            <path
                d="M60 30A30 30 0 0 1 90 60"
                className="stroke-primary"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
            />

            {/* Center dot */}
            <circle cx="60" cy="60" r="6" className="fill-primary/40" />
        </svg>
    );
}

/**
 * Empty Lists Illustration
 * Used when there are no lists or no problems in a list
 */
export function EmptyListsIllustration({ className }: IllustrationProps) {
    return (
        <svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background circle */}
            <circle cx="60" cy="60" r="56" className="fill-primary/10" />

            {/* Folder stack */}
            <rect x="30" y="55" width="50" height="35" rx="3" className="fill-primary/20" />
            <rect x="35" y="50" width="50" height="35" rx="3" className="fill-primary/40" />
            <rect x="40" y="45" width="50" height="35" rx="3" className="fill-card stroke-primary/30" strokeWidth="1.5" />

            {/* Folder tab */}
            <path d="M40 45H55L60 40H85C86.6569 40 88 41.3431 88 43V45H40Z" className="fill-card stroke-primary/30" strokeWidth="1.5" />

            {/* Plus icon */}
            <circle cx="65" cy="62" r="12" className="fill-primary/20" />
            <path d="M65 57V67M60 62H70" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />

            {/* Sparkles */}
            <circle cx="85" cy="35" r="3" className="fill-primary/40" />
            <circle cx="28" cy="45" r="2" className="fill-primary/30" />
        </svg>
    );
}

/**
 * Empty Canvas Illustration
 * Used for system design empty state
 */
export function EmptyCanvasIllustration({ className }: IllustrationProps) {
    return (
        <svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background circle */}
            <circle cx="60" cy="60" r="56" className="fill-primary/10" />

            {/* Canvas frame */}
            <rect x="30" y="35" width="60" height="50" rx="4" className="fill-card stroke-primary/30" strokeWidth="1.5" />

            {/* Grid dots */}
            {[40, 50, 60, 70, 80].map((x) =>
                [45, 55, 65, 75].map((y) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r="1" className="fill-primary/20" />
                ))
            )}

            {/* Pen cursor hint */}
            <path
                d="M75 70L85 60L88 63L78 73L75 73V70Z"
                className="fill-primary/60"
            />
            <path d="M85 60L88 57" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}
