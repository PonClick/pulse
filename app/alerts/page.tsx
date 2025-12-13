'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layouts'
import { Card, Badge } from '@/components/ui'
import { Bell, Clock, CheckCircle, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'

interface Incident {
  id: string
  service_id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  cause: string | null
  resolution: string | null
  acknowledged: boolean
  services: {
    id: string
    name: string
    type: string
  } | null
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTimeSince(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export default function AlertsPage(): React.ReactElement {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIncidents = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/incidents')
      if (!response.ok) throw new Error('Failed to fetch incidents')
      const data = await response.json()
      setIncidents(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
  }, [])

  const activeIncidents = incidents.filter(i => !i.ended_at)
  const resolvedIncidents = incidents.filter(i => i.ended_at)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Alerts & Incidents</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Monitor downtime and incidents across your services
            </p>
          </div>
          <Button variant="secondary" onClick={fetchIncidents} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Active Incidents */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Active Incidents
            {activeIncidents.length > 0 && (
              <Badge variant="error">{activeIncidents.length}</Badge>
            )}
          </h2>

          {isLoading ? (
            <Card className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </Card>
          ) : activeIncidents.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
              <p className="mt-2 text-zinc-400">All systems operational</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeIncidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} isActive />
              ))}
            </div>
          )}
        </div>

        {/* Resolved Incidents */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
            <Clock className="h-5 w-5 text-zinc-400" />
            Recent Incidents
          </h2>

          {isLoading ? (
            <Card className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </Card>
          ) : resolvedIncidents.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-zinc-600" />
              <p className="mt-2 text-zinc-400">No incidents recorded</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {resolvedIncidents.slice(0, 20).map((incident) => (
                <IncidentCard key={incident.id} incident={incident} isActive={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

interface IncidentCardProps {
  incident: Incident
  isActive: boolean
}

function IncidentCard({ incident, isActive }: IncidentCardProps): React.ReactElement {
  return (
    <Card className={isActive ? 'border-red-500/50' : ''}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Badge variant={isActive ? 'error' : 'success'}>
              {isActive ? 'Active' : 'Resolved'}
            </Badge>
            <h3 className="font-medium text-white">
              {incident.services?.name || 'Unknown Service'}
            </h3>
            <span className="text-sm text-zinc-500">
              {incident.services?.type}
            </span>
          </div>

          <p className="mt-2 text-sm text-zinc-400">
            {incident.cause || 'No cause recorded'}
          </p>

          <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
            <span>Started: {formatDate(incident.started_at)}</span>
            {incident.ended_at && (
              <span>Ended: {formatDate(incident.ended_at)}</span>
            )}
            {incident.duration_seconds && (
              <span>Duration: {formatDuration(incident.duration_seconds)}</span>
            )}
          </div>
        </div>

        <div className="text-right text-sm text-zinc-500">
          {getTimeSince(incident.started_at)}
        </div>
      </div>
    </Card>
  )
}
