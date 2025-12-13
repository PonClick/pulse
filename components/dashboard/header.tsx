'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Settings, Sun, Moon, Menu, LogOut, User } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  healthScore: number | null
  onMenuClick?: () => void
  userEmail?: string | null
}

export function Header({ healthScore, onMenuClick, userEmail }: HeaderProps): React.ReactElement {
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()

  const handleLogout = async (): Promise<void> => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const variant = healthScore === null
    ? 'default'
    : healthScore >= 99
      ? 'success'
      : healthScore >= 95
        ? 'warning'
        : 'error'

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 md:px-6">
      {/* Left side: Menu button + Logo */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <Link href="/" className="text-lg font-semibold text-[var(--foreground)]">
          Pulse
        </Link>
      </div>

      {/* Health Score - hidden on very small screens */}
      <Badge variant={variant} className="hidden sm:flex">
        {healthScore !== null ? `${healthScore.toFixed(1)}% Healthy` : 'Loading...'}
      </Badge>

      {/* Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Settings - hidden on mobile since it's in sidebar */}
        <Link
          href="/settings"
          className="hidden md:flex rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>

        {/* User info and logout */}
        {userEmail && (
          <>
            <div className="hidden md:flex items-center gap-2 px-2 text-sm text-[var(--muted)]">
              <User className="h-4 w-4" />
              <span className="max-w-[120px] truncate">{userEmail}</span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </header>
  )
}
