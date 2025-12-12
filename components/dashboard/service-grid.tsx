'use client'

import { ServiceCard } from './service-card'

type ServiceType = 'http' | 'tcp' | 'ping' | 'dns' | 'docker' | 'heartbeat'
type Status = 'up' | 'down' | 'pending'

interface Service {
  id: string
  name: string
  type: ServiceType
  status: Status
  responseTime: number | null
  uptime24h: number | null
}

interface Heartbeat {
  responseTime: number
}

interface ServiceGridProps {
  services: Service[]
  heartbeats: Record<string, Heartbeat[]>
  onServiceClick: (id: string) => void
}

export function ServiceGrid({
  services,
  heartbeats,
  onServiceClick,
}: ServiceGridProps): React.ReactElement {
  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-zinc-400">No services yet</p>
        <p className="mt-1 text-sm text-zinc-500">
          Add your first service to start monitoring
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          heartbeats={heartbeats[service.id] || []}
          onClick={() => onServiceClick(service.id)}
        />
      ))}
    </div>
  )
}
