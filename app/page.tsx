'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layouts'
import { ServiceGrid } from '@/components/dashboard'
import { AddServiceModal } from '@/components/services'
import { Button, useToast } from '@/components/ui'
import { Plus, RefreshCw, Loader2 } from 'lucide-react'
import { useServices } from '@/lib/hooks'
import type { CreateServiceInput, ServiceType } from '@/lib/validations/service'

type Status = 'up' | 'down' | 'pending'

interface DisplayService {
  id: string
  name: string
  type: ServiceType
  status: Status
  responseTime: number | null
  uptime24h: number | null
}

// Helper to calculate status from heartbeats
function getServiceStatus(heartbeats: { status: string }[]): Status {
  if (heartbeats.length === 0) return 'pending'
  const latest = heartbeats[heartbeats.length - 1]
  if (latest?.status === 'up') return 'up'
  if (latest?.status === 'down') return 'down'
  return 'pending'
}

// Helper to calculate uptime from heartbeats
function calculateUptime(heartbeats: { status: string }[]): number | null {
  if (heartbeats.length === 0) return null
  const upCount = heartbeats.filter((h) => h.status === 'up').length
  return (upCount / heartbeats.length) * 100
}

// Helper to get latest response time
function getLatestResponseTime(heartbeats: { response_time_ms: number | null }[]): number | null {
  if (heartbeats.length === 0) return null
  return heartbeats[heartbeats.length - 1]?.response_time_ms ?? null
}

export default function DashboardPage(): React.ReactElement {
  const { services, heartbeats, isLoading, error, refetch, createService } = useServices()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { addToast } = useToast()

  // Transform services to display format
  const displayServices: DisplayService[] = services.map((service) => {
    const serviceHeartbeats = heartbeats[service.id] || []
    return {
      id: service.id,
      name: service.name,
      type: service.type as ServiceType,
      status: getServiceStatus(serviceHeartbeats),
      responseTime: getLatestResponseTime(serviceHeartbeats),
      uptime24h: calculateUptime(serviceHeartbeats),
    }
  })

  // Transform heartbeats for sparkline (just need responseTime)
  const sparklineData: Record<string, { responseTime: number }[]> = {}
  for (const [serviceId, hbs] of Object.entries(heartbeats)) {
    sparklineData[serviceId] = hbs
      .filter((h) => h.response_time_ms !== null)
      .map((h) => ({ responseTime: h.response_time_ms! }))
  }

  // Calculate health score (percentage of services that are up)
  const upCount = displayServices.filter((s) => s.status === 'up').length
  const healthScore = displayServices.length > 0 ? (upCount / displayServices.length) * 100 : null

  const handleServiceClick = (id: string): void => {
    // TODO: Navigate to service detail page
    console.log('Service clicked:', id)
  }

  const handleAddService = async (data: CreateServiceInput): Promise<void> => {
    const newService = await createService(data)
    if (newService) {
      addToast('success', `Service "${data.name}" created successfully`)
    } else {
      addToast('error', 'Failed to create service')
    }
  }

  const handleRefresh = async (): Promise<void> => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
    addToast('success', 'Services refreshed')
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
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <p className="mt-4 text-zinc-400">Loading services...</p>
          </div>
        ) : (
          /* Service Grid */
          <ServiceGrid
            services={displayServices}
            heartbeats={sparklineData}
            onServiceClick={handleServiceClick}
          />
        )}
      </div>

      {/* Add Service Modal */}
      <AddServiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddService}
      />
    </DashboardLayout>
  )
}
