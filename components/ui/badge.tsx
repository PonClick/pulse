import { cn } from '@/lib/utils/cn'

type Variant = 'default' | 'success' | 'error' | 'warning'

interface BadgeProps {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-zinc-800 text-zinc-400',
  success: 'bg-emerald-500/20 text-emerald-500',
  error: 'bg-red-500/20 text-red-500',
  warning: 'bg-amber-500/20 text-amber-500',
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
