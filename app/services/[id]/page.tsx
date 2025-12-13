'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layouts'
import { Card, Badge, Button } from '@/components/ui'
import { Sparkline } from '@/components/ui/sparkline'
import { EditServiceModal, MaintenanceModal } from '@/components/services'
import { useToast } from '@/components/ui/toast'
import { useMaintenance, type CreateMaintenanceInput } from '@/lib/hooks'
import {
  ArrowLeft,
  Globe,
  Server,
  Radio,
  Database,
  Container,
  Heart,
  Clock,
  Activity,
  RefreshCw,
  Loader2,
  Trash2,
  Pencil,
  Pause,
  Play,
  Wrench,
  Calendar,
  X,
} from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string | null
  type: 'http' | 'tcp' | 'ping' | 'dns' | 'docker' | 'heartbeat'
  url: string | null
  method: string | null
  expected_status: number[] | null
  keyword: string | null
  verify_ssl: boolean | null
  hostname: string | null
  port: number | null
  dns_record_type: string | null
  dns_server: string | null
  expected_value: string | null
  docker_host: string | null
  container_name: string | null
  interval_seconds: number
  timeout_seconds: number
  retries: number
  is_active: boolean
  is_paused: boolean
  created_at: string
}

interface Heartbeat {
  id: string
  status: string
  response_time_ms: number | null
  message: string | null
  created_at: string
}

const typeIcons: Record<string, typeof Globe> = {
  http: Globe,
  tcp: Server,
  ping: Radio,
  dns: Database,
  docker: Container,
  heartbeat: Heart,
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}): React.ReactElement {
  const { id } = use(params)
  const router = useRouter()
  const { addToast } = useToast()
  const [service, setService] = useState<Service | null>(null)
  const [heartbeats, setHeartbeats] = useState<Heartbeat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false)

  const {
    maintenanceWindows,
    activeMaintenanceWindows,
    createMaintenance,
    deleteMaintenance,
    isServiceInMaintenance,
  } = useMaintenance(id)

  const fetchData = async (): Promise<void> => {
    try {
      setIsLoading(true)

      const [serviceRes, heartbeatsRes] = await Promise.all([
        fetch(`/api/services/${id}`),
        fetch(`/api/services/${id}/heartbeats`),
      ])

      if (!serviceRes.ok) throw new Error('Service not found')

      const serviceData = await serviceRes.json()
      const heartbeatsData = await heartbeatsRes.json()

      setService(serviceData)
      setHeartbeats(heartbeatsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Poll every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [id])

  const handleDelete = async (): Promise<void> => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const response = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete service')
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleEdit = async (data: Record<string, unknown>): Promise<void> => {
    const response = await fetch(`/api/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to update service')
    }

    addToast('success', `Service "${service?.name}" updated successfully`)
    await fetchData()
  }

  const handleScheduleMaintenance = async (data: CreateMaintenanceInput): Promise<void> => {
    const result = await createMaintenance(data)
    if (result) {
      addToast('success', 'Maintenance window scheduled')
    } else {
      throw new Error('Failed to schedule maintenance')
    }
  }

  const handleDeleteMaintenance = async (maintenanceId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this maintenance window?')) return
    const success = await deleteMaintenance(maintenanceId)
    if (success) {
      addToast('success', 'Maintenance window deleted')
    }
  }

  const isInMaintenance = isServiceInMaintenance(id)

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !service) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Card className="border-red-500/50">
            <p className="text-red-500">{error || 'Service not found'}</p>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const Icon = typeIcons[service.type] || Globe
  const latestStatus = heartbeats[0]?.status || 'pending'
  const latestResponseTime = heartbeats[0]?.response_time_ms

  // Calculate stats
  const upCount = heartbeats.filter((h) => h.status === 'up').length
  const uptime = heartbeats.length > 0 ? (upCount / heartbeats.length) * 100 : 0
  const avgResponseTime =
    heartbeats.length > 0
      ? Math.round(
          heartbeats
            .filter((h) => h.response_time_ms)
            .reduce((sum, h) => sum + (h.response_time_ms || 0), 0) /
            heartbeats.filter((h) => h.response_time_ms).length
        )
      : 0

  // Sparkline data (reversed for chronological order)
  const sparklineData = [...heartbeats]
    .reverse()
    .filter((h) => h.response_time_ms)
    .map((h) => ({ value: h.response_time_ms! }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-800">
              <Icon className="h-6 w-6 text-zinc-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-white">{service.name}</h1>
                <Badge
                  variant={
                    latestStatus === 'up'
                      ? 'success'
                      : latestStatus === 'down'
                        ? 'error'
                        : 'default'
                  }
                >
                  {latestStatus === 'up'
                    ? 'Operational'
                    : latestStatus === 'down'
                      ? 'Down'
                      : 'Pending'}
                </Badge>
                {isInMaintenance && (
                  <Badge variant="warning">
                    <Wrench className="mr-1 h-3 w-3" />
                    In Maintenance
                  </Badge>
                )}
              </div>
              <p className="text-sm text-zinc-400">
                {service.url || service.hostname || service.type}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsMaintenanceModalOpen(true)}>
              <Wrench className="mr-2 h-4 w-4" />
              Schedule Maintenance
            </Button>
            <Button variant="secondary" onClick={fetchData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="text-red-500 hover:bg-red-500/10"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm text-zinc-400">Uptime (24h)</p>
                <p className="text-xl font-semibold text-white">{uptime.toFixed(1)}%</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-zinc-400">Avg Response</p>
                <p className="text-xl font-semibold text-white">{avgResponseTime}ms</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-zinc-400">Check Interval</p>
                <p className="text-xl font-semibold text-white">{service.interval_seconds}s</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-pink-500" />
              <div>
                <p className="text-sm text-zinc-400">Total Checks</p>
                <p className="text-xl font-semibold text-white">{heartbeats.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Response Time Chart */}
        <Card>
          <h2 className="mb-4 text-lg font-medium text-white">Response Time</h2>
          {sparklineData.length > 0 ? (
            <div className="h-32">
              <Sparkline data={sparklineData} height={128} />
            </div>
          ) : (
            <p className="py-8 text-center text-zinc-500">No data available</p>
          )}
        </Card>

        {/* Recent Heartbeats */}
        <Card>
          <h2 className="mb-4 text-lg font-medium text-white">Recent Checks</h2>
          {heartbeats.length === 0 ? (
            <p className="py-8 text-center text-zinc-500">No checks recorded yet</p>
          ) : (
            <div className="space-y-2">
              {heartbeats.slice(0, 20).map((hb) => (
                <div
                  key={hb.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        hb.status === 'up' ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-sm text-zinc-400">{formatDate(hb.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-400">
                      {hb.response_time_ms ? `${hb.response_time_ms}ms` : '-'}
                    </span>
                    <span
                      className={`text-sm ${
                        hb.status === 'up' ? 'text-emerald-500' : 'text-red-500'
                      }`}
                    >
                      {hb.status === 'up' ? 'OK' : hb.message || 'Failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Maintenance Windows */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">Maintenance Windows</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsMaintenanceModalOpen(true)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
          </div>
          {maintenanceWindows.length === 0 ? (
            <p className="py-8 text-center text-zinc-500">No maintenance windows scheduled</p>
          ) : (
            <div className="space-y-2">
              {maintenanceWindows.map((mw) => {
                const now = new Date()
                const start = new Date(mw.start_time)
                const end = new Date(mw.end_time)
                const isActive = now >= start && now <= end
                const isPast = now > end
                const isFuture = now < start

                return (
                  <div
                    key={mw.id}
                    className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                      isActive
                        ? 'bg-amber-500/10 border border-amber-500/30'
                        : isPast
                          ? 'bg-zinc-800/30'
                          : 'bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Wrench
                        className={`h-4 w-4 ${
                          isActive
                            ? 'text-amber-500'
                            : isPast
                              ? 'text-zinc-600'
                              : 'text-zinc-400'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              isPast ? 'text-zinc-500' : 'text-white'
                            }`}
                          >
                            {mw.title}
                          </span>
                          {isActive && (
                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                              Active
                            </span>
                          )}
                          {isFuture && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                              Scheduled
                            </span>
                          )}
                          {isPast && (
                            <span className="text-xs bg-zinc-700 text-zinc-400 px-2 py-0.5 rounded">
                              Completed
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-500">
                          {formatDate(mw.start_time)} - {formatDate(mw.end_time)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 hover:text-red-500"
                      onClick={() => handleDeleteMaintenance(mw.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Edit Service Modal */}
      {service && (
        <EditServiceModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEdit}
          service={service}
        />
      )}

      {/* Maintenance Modal */}
      {service && (
        <MaintenanceModal
          isOpen={isMaintenanceModalOpen}
          onClose={() => setIsMaintenanceModalOpen(false)}
          onSubmit={handleScheduleMaintenance}
          serviceId={service.id}
          serviceName={service.name}
        />
      )}
    </DashboardLayout>
  )
}
