'use client'

import { Card } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/status-dot'
import { Sparkline } from '@/components/ui/sparkline'
import {
  Globe,
  Plug,
  Activity,
  Server,
  Container,
  Heart,
} from 'lucide-react'

type ServiceType = 'http' | 'tcp' | 'ping' | 'dns' | 'docker' | 'heartbeat'
type Status = 'up' | 'down' | 'pending'

interface ServiceCardProps {
  service: {
    id: string
    name: string
    type: ServiceType
    status: Status
    responseTime: number | null
    uptime24h: number | null
  }
  heartbeats: { responseTime: number }[]
  onClick: () => void
}

const typeIcons: Record<ServiceType, typeof Globe> = {
  http: Globe,
  tcp: Plug,
  ping: Activity,
  dns: Server,
  docker: Container,
  heartbeat: Heart,
}

const statusLabels: Record<Status, string> = {
  up: 'Operational',
  down: 'Down',
  pending: 'Checking...',
}

export function ServiceCard({
  service,
  heartbeats,
  onClick,
}: ServiceCardProps): React.ReactElement {
  const Icon = typeIcons[service.type]
  const sparklineData = heartbeats.map((h) => ({ value: h.responseTime }))
  const sparklineColor = service.status === 'up' ? '#10b981' : '#ef4444'

  return (
    <Card hover onClick={onClick}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-zinc-800 p-2">
            <Icon className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">{service.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusDot status={service.status} size="sm" />
              <span className="text-xs text-zinc-400">
                {statusLabels[service.status]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div>
          <p className="text-zinc-500 text-xs">Response</p>
          <p className="text-white font-medium">
            {service.responseTime !== null ? `${service.responseTime}ms` : '-'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-zinc-500 text-xs">Uptime (24h)</p>
          <p className="text-white font-medium">
            {service.uptime24h !== null
              ? `${service.uptime24h.toFixed(1)}%`
              : '-'}
          </p>
        </div>
      </div>

      {/* Sparkline */}
      <div className="mt-3">
        <Sparkline data={sparklineData} color={sparklineColor} height={32} />
      </div>
    </Card>
  )
}
