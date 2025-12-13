'use client'

import { Card } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/status-dot'
import { Sparkline } from '@/components/ui/sparkline'
import { Check } from 'lucide-react'
import {
  Globe,
  Plug,
  Activity,
  Server,
  Container,
  Heart,
  ShieldCheck,
} from 'lucide-react'

type ServiceType = 'http' | 'tcp' | 'ping' | 'dns' | 'docker' | 'heartbeat' | 'ssl'
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
  selectionMode?: boolean
  isSelected?: boolean
  onSelect?: (id: string) => void
}

const typeIcons: Record<ServiceType, typeof Globe> = {
  http: Globe,
  tcp: Plug,
  ping: Activity,
  dns: Server,
  docker: Container,
  heartbeat: Heart,
  ssl: ShieldCheck,
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
  selectionMode = false,
  isSelected = false,
  onSelect,
}: ServiceCardProps): React.ReactElement {
  const Icon = typeIcons[service.type]
  const sparklineData = heartbeats.map((h) => ({ value: h.responseTime }))
  const sparklineColor = service.status === 'up' ? '#10b981' : '#ef4444'

  const handleClick = (): void => {
    if (selectionMode && onSelect) {
      onSelect(service.id)
    } else {
      onClick()
    }
  }

  return (
    <Card
      hover
      onClick={handleClick}
      className={isSelected ? 'ring-2 ring-[var(--primary)]' : ''}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {selectionMode ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelect?.(service.id)
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-colors ${
                isSelected
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                  : 'border-[var(--border)] bg-[var(--card)] text-transparent hover:border-[var(--muted)]'
              }`}
              aria-label={isSelected ? 'Deselect service' : 'Select service'}
            >
              <Check className="h-4 w-4" />
            </button>
          ) : (
            <div className="rounded-lg bg-[var(--accent)] p-2">
              <Icon className="h-4 w-4 text-[var(--muted)]" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-[var(--foreground)]">{service.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusDot status={service.status} size="sm" />
              <span className="text-xs text-[var(--muted)]">
                {statusLabels[service.status]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div>
          <p className="text-[var(--muted-foreground)] text-xs">Response</p>
          <p className="text-[var(--foreground)] font-medium">
            {service.responseTime !== null ? `${service.responseTime}ms` : '-'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[var(--muted-foreground)] text-xs">Uptime (24h)</p>
          <p className="text-[var(--foreground)] font-medium">
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
