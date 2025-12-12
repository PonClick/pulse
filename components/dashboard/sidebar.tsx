'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { LayoutGrid, Bell, Settings } from 'lucide-react'

const navItems = [
  { href: '/', icon: LayoutGrid, label: 'Dashboard' },
  { href: '/alerts', icon: Bell, label: 'Alerts' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar(): React.ReactElement {
  const pathname = usePathname()

  return (
    <aside className="flex w-16 flex-col items-center border-r border-zinc-800 bg-zinc-950 py-4">
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:bg-zinc-800 hover:text-white'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
