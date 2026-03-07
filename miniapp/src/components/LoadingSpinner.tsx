interface LoadingSpinnerProps {
    progress?: string
    subtitle?: string
}

export default function LoadingSpinner({ progress = 'Generating...', subtitle = 'Usually takes 5-30 seconds' }: LoadingSpinnerProps) {
    return (
        <div className="flex flex-col items-center gap-6 py-12">
            <div className="relative w-24 h-24">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-2 border-accent-primary/20 animate-spin-slow" />
                {/* Middle ring */}
                <div className="absolute inset-2 rounded-full border-2 border-accent-secondary/40 animate-spin-reverse" />
                {/* Inner ring */}
                <div className="absolute inset-4 rounded-full border-2 border-accent-primary animate-spin"
                    style={{ animationDuration: '1s' }} />
                {/* Center dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-accent-primary animate-pulse" />
                </div>
            </div>

            <div className="text-center">
                <p className="text-txt-primary font-medium text-lg animate-pulse">{progress}</p>
                <p className="text-txt-muted text-sm mt-1">{subtitle}</p>
            </div>

            {/* Progress bar */}
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full animate-progress" />
            </div>
        </div>
    )
}
