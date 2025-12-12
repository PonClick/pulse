'use client'

import { cn } from '@/lib/utils/cn'
import {
  Globe,
  Plug,
  Activity,
  Server,
  Container,
  Heart,
} from 'lucide-react'
import type { ServiceType } from '@/lib/validations/service'

interface MonitorType {
  type: ServiceType
  label: string
  description: string
  icon: typeof Globe
}

const monitorTypes: MonitorType[] = [
  {
    type: 'http',
    label: 'HTTP(S)',
    description: 'Monitor websites and APIs',
    icon: Globe,
  },
  {
    type: 'tcp',
    label: 'TCP Port',
    description: 'Check if a port is open',
    icon: Plug,
  },
  {
    type: 'ping',
    label: 'Ping',
    description: 'ICMP ping to check host',
    icon: Activity,
  },
  {
    type: 'dns',
    label: 'DNS',
    description: 'Monitor DNS records',
    icon: Server,
  },
  {
    type: 'docker',
    label: 'Docker',
    description: 'Check container status',
    icon: Container,
  },
  {
    type: 'heartbeat',
    label: 'Heartbeat',
    description: 'Receive push notifications',
    icon: Heart,
  },
]

interface MonitorTypeSelectorProps {
  value: ServiceType | null
  onChange: (type: ServiceType) => void
}

export function MonitorTypeSelector({
  value,
  onChange,
}: MonitorTypeSelectorProps): React.ReactElement {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {monitorTypes.map((monitor) => {
        const Icon = monitor.icon
        const isSelected = value === monitor.type

        return (
          <button
            key={monitor.type}
            type="button"
            onClick={() => onChange(monitor.type)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors',
              isSelected
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
            )}
          >
            <div
              className={cn(
                'rounded-lg p-2',
                isSelected ? 'bg-emerald-500/20' : 'bg-zinc-800'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  isSelected ? 'text-emerald-500' : 'text-zinc-400'
                )}
              />
            </div>
            <div>
              <p
                className={cn(
                  'text-sm font-medium',
                  isSelected ? 'text-emerald-500' : 'text-white'
                )}
              >
                {monitor.label}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">{monitor.description}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
