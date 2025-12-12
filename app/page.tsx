'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layouts'
import { ServiceGrid } from '@/components/dashboard'
import { Button } from '@/components/ui'
import { Plus } from 'lucide-react'

// Mock data for initial development
const mockServices = [
  {
    id: '1',
    name: 'Production API',
    type: 'http' as const,
    status: 'up' as const,
    responseTime: 145,
    uptime24h: 99.9,
  },
  {
    id: '2',
    name: 'Database Server',
    type: 'tcp' as const,
    status: 'up' as const,
    responseTime: 23,
    uptime24h: 100,
  },
  {
    id: '3',
    name: 'CDN Gateway',
    type: 'ping' as const,
    status: 'down' as const,
    responseTime: null,
    uptime24h: 95.2,
  },
  {
    id: '4',
    name: 'DNS Primary',
    type: 'dns' as const,
    status: 'up' as const,
    responseTime: 12,
    uptime24h: 99.99,
  },
  {
    id: '5',
    name: 'Redis Container',
    type: 'docker' as const,
    status: 'up' as const,
    responseTime: 5,
    uptime24h: 100,
  },
  {
    id: '6',
    name: 'Backup Service',
    type: 'heartbeat' as const,
    status: 'pending' as const,
    responseTime: null,
    uptime24h: null,
  },
]

// Mock heartbeats for sparkline
const mockHeartbeats: Record<string, { responseTime: number }[]> = {
  '1': Array.from({ length: 20 }, () => ({ responseTime: Math.floor(Math.random() * 50) + 120 })),
  '2': Array.from({ length: 20 }, () => ({ responseTime: Math.floor(Math.random() * 10) + 18 })),
  '3': Array.from({ length: 20 }, () => ({ responseTime: Math.floor(Math.random() * 100) + 200 })),
  '4': Array.from({ length: 20 }, () => ({ responseTime: Math.floor(Math.random() * 5) + 10 })),
  '5': Array.from({ length: 20 }, () => ({ responseTime: Math.floor(Math.random() * 3) + 3 })),
  '6': [],
}

export default function DashboardPage(): React.ReactElement {
  const [services] = useState(mockServices)

  // Calculate health score (percentage of services that are up)
  const upCount = services.filter((s) => s.status === 'up').length
  const healthScore = services.length > 0 ? (upCount / services.length) * 100 : null

  const handleServiceClick = (id: string): void => {
    // TODO: Navigate to service detail page
    console.log('Service clicked:', id)
  }

  const handleAddService = (): void => {
    // TODO: Open add service modal
    console.log('Add service clicked')
  }

  return (
    <DashboardLayout healthScore={healthScore}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Monitor all your services in one place
            </p>
          </div>
          <Button variant="primary" onClick={handleAddService}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>

        {/* Service Grid */}
        <ServiceGrid
          services={services}
          heartbeats={mockHeartbeats}
          onServiceClick={handleServiceClick}
        />
      </div>
    </DashboardLayout>
  )
}
