'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Settings } from 'lucide-react'

interface HeaderProps {
  healthScore: number | null
}

export function Header({ healthScore }: HeaderProps): React.ReactElement {
  const variant = healthScore === null
    ? 'default'
    : healthScore >= 99
      ? 'success'
      : healthScore >= 95
        ? 'warning'
        : 'error'

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
      {/* Logo */}
      <Link href="/" className="text-lg font-semibold text-white">
        Pulse
      </Link>

      {/* Health Score */}
      <Badge variant={variant}>
        {healthScore !== null ? `${healthScore.toFixed(1)}% Healthy` : 'Loading...'}
      </Badge>

      {/* Settings */}
      <Link
        href="/settings"
        className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5" />
      </Link>
    </header>
  )
}
