import { cn } from '@/lib/utils/cn'

type Variant = 'default' | 'success' | 'error' | 'warning'

interface BadgeProps {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-[var(--accent)] text-[var(--muted)]',
  success: 'bg-[var(--status-up)]/20 text-[var(--status-up)]',
  error: 'bg-[var(--status-down)]/20 text-[var(--status-down)]',
  warning: 'bg-[var(--status-warning)]/20 text-[var(--status-warning)]',
}

export function Badge({
  variant = 'default',
  children,
  className,
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
