'use client'

import { useState } from 'react'
import { Header } from '@/components/dashboard/header'
import { Sidebar } from '@/components/dashboard/sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  healthScore?: number | null
  userEmail?: string | null
}

export function DashboardLayout({
  children,
  healthScore = null,
  userEmail = null,
}: DashboardLayoutProps): React.ReactElement {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleMenuClick = (): void => {
    setIsSidebarOpen(true)
  }

  const handleSidebarClose = (): void => {
    setIsSidebarOpen(false)
  }

  return (
    <div className="flex h-screen bg-[var(--background)]">
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header healthScore={healthScore} onMenuClick={handleMenuClick} userEmail={userEmail} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
