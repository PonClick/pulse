'use client'

import { useEffect, useState } from 'react'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Loader2,
  Globe,
  Server,
  Radio,
  Database,
  Container,
  Heart,
} from 'lucide-react'

interface ServiceStatus {
  id: string
  name: string
  type: string
  status: 'up' | 'down' | 'pending'
  uptime24h: number | null
}

interface StatusData {
  overallStatus: 'operational' | 'degraded' | 'outage'
  healthScore: number
  services: ServiceStatus[]
  lastUpdated: string
}

const typeIcons: Record<string, typeof Globe> = {
  http: Globe,
  tcp: Server,
  ping: Radio,
  dns: Database,
  docker: Container,
  heartbeat: Heart,
}

function formatLastUpdated(dateStr: string): string {
  return new Date(dateStr).toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function StatusPage(): React.ReactElement {
  const [data, setData] = useState<StatusData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async (): Promise<void> => {
    try {
      const response = await fetch('/api/status')
      if (!response.ok) throw new Error('Failed to fetch status')
      const statusData = await response.json()
      setData(statusData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-zinc-400">{error || 'Failed to load status'}</p>
        </div>
      </div>
    )
  }

  const statusConfig = {
    operational: {
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/50',
      label: 'All Systems Operational',
    },
    degraded: {
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/50',
      label: 'Partial System Outage',
    },
    outage: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/50',
      label: 'Major System Outage',
    },
  }

  const config = statusConfig[data.overallStatus]
  const StatusIcon = config.icon

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">System Status</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Real-time service availability
              </p>
            </div>
            <button
              onClick={fetchStatus}
              className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Overall Status Banner */}
        <div
          className={`rounded-xl border ${config.border} ${config.bg} p-6 mb-8`}
        >
          <div className="flex items-center gap-4">
            <StatusIcon className={`h-10 w-10 ${config.color}`} />
            <div>
              <h2 className={`text-xl font-semibold ${config.color}`}>
                {config.label}
              </h2>
              <p className="text-sm text-zinc-400">
                {data.healthScore.toFixed(1)}% of services are operational
              </p>
            </div>
          </div>
        </div>

        {/* Services List */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="border-b border-zinc-800 px-6 py-4">
            <h3 className="font-medium text-white">Services</h3>
          </div>
          <div className="divide-y divide-zinc-800">
            {data.services.map((service) => {
              const Icon = typeIcons[service.type] || Globe
              return (
                <div
                  key={service.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-zinc-500" />
                    <div>
                      <p className="font-medium text-white">{service.name}</p>
                      <p className="text-xs text-zinc-500 uppercase">
                        {service.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {service.uptime24h !== null && (
                      <span className="text-sm text-zinc-500">
                        {service.uptime24h.toFixed(1)}% uptime
                      </span>
                    )}
                    <div
                      className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                        service.status === 'up'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : service.status === 'down'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-zinc-500/10 text-zinc-500'
                      }`}
                    >
                      {service.status === 'up' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : service.status === 'down' ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                      {service.status === 'up'
                        ? 'Operational'
                        : service.status === 'down'
                          ? 'Down'
                          : 'Pending'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-6 text-center text-sm text-zinc-500">
          <Clock className="inline-block h-4 w-4 mr-1" />
          Last updated: {formatLastUpdated(data.lastUpdated)}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-900/50 mt-12">
        <div className="mx-auto max-w-4xl px-4 py-6 text-center text-sm text-zinc-500">
          Powered by{' '}
          <a href="/" className="text-emerald-500 hover:underline">
            Pulse
          </a>
        </div>
      </footer>
    </div>
  )
}
