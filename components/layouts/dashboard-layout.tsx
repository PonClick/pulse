'use client'

import { Header } from '@/components/dashboard/header'
import { Sidebar } from '@/components/dashboard/sidebar'
import { ToastProvider } from '@/components/ui/toast'

interface DashboardLayoutProps {
  children: React.ReactNode
  healthScore?: number | null
}

export function DashboardLayout({
  children,
  healthScore = null,
}: DashboardLayoutProps): React.ReactElement {
  return (
    <ToastProvider>
      <div className="flex h-screen bg-zinc-950">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header healthScore={healthScore} />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}
