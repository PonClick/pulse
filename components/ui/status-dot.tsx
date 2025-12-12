'use client'

import { cn } from '@/lib/utils/cn'

type Status = 'up' | 'down' | 'pending' | 'paused'
type Size = 'sm' | 'md' | 'lg'

interface StatusDotProps {
  status: Status
  size?: Size
  pulse?: boolean
  className?: string
}

const statusColors: Record<Status, string> = {
  up: 'bg-emerald-500',
  down: 'bg-red-500',
  pending: 'bg-blue-500',
  paused: 'bg-zinc-500',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
}

export function StatusDot({
  status,
  size = 'md',
  pulse = false,
  className,
}: StatusDotProps): React.ReactElement {
  return (
    <span
      className={cn(
        'inline-block rounded-full',
        statusColors[status],
        sizeClasses[size],
        pulse && 'animate-pulse',
        className
      )}
      aria-label={`Status: ${status}`}
    />
  )
}
