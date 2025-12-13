'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { LayoutGrid, Bell, Settings, X } from 'lucide-react'

const navItems = [
  { href: '/', icon: LayoutGrid, label: 'Dashboard' },
  { href: '/alerts', icon: Bell, label: 'Alerts' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps): React.ReactElement {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border)] bg-[var(--background)] transition-transform duration-200 ease-in-out md:static md:w-16 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile header with close button */}
        <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-4 md:hidden">
          <span className="text-lg font-semibold text-[var(--foreground)]">Menu</span>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 p-4 md:items-center md:py-4 md:px-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors md:h-10 md:w-10 md:justify-center md:p-0',
                  isActive
                    ? 'bg-[var(--accent)] text-[var(--foreground)]'
                    : 'text-[var(--muted)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
                )}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className="h-5 w-5" />
                <span className="md:hidden">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
