import { cn } from '@/lib/utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({
  children,
  className,
  hover = false,
  onClick,
}: CardProps): React.ReactElement {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={cn(
        'rounded-lg border border-zinc-800 bg-zinc-900 p-4',
        hover && 'transition-colors hover:border-zinc-700 cursor-pointer',
        onClick && 'w-full text-left',
        className
      )}
    >
      {children}
    </Component>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({
  children,
  className,
}: CardHeaderProps): React.ReactElement {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export function CardTitle({
  children,
  className,
}: CardTitleProps): React.ReactElement {
  return (
    <h3 className={cn('text-sm font-medium text-white', className)}>
      {children}
    </h3>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export function CardContent({
  children,
  className,
}: CardContentProps): React.ReactElement {
  return <div className={cn('mt-3', className)}>{children}</div>
}
