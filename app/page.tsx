'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layouts'
import { ServiceGrid } from '@/components/dashboard'
import { AddServiceModal } from '@/components/services'
import { Button, useToast } from '@/components/ui'
import { Plus, RefreshCw, Loader2, Search, CheckSquare, X, Trash2, Pause, Play } from 'lucide-react'
import { useServices, useGroups } from '@/lib/hooks'
import { createClient } from '@/lib/supabase/client'
import type { CreateServiceInput, ServiceType } from '@/lib/validations/service'

type Status = 'up' | 'down' | 'pending'

interface DisplayService {
  id: string
  name: string
  type: ServiceType
  status: Status
  responseTime: number | null
  uptime24h: number | null
  groupId: string | null
  groupName: string | null
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
  const { services, heartbeats, isLoading, error, refetch, createService, deleteService } = useServices()
  const { groups } = useGroups()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | ServiceType>('all')
  const [groupFilter, setGroupFilter] = useState<'all' | 'ungrouped' | string>('all')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const { addToast } = useToast()

  // Fetch current user
  useEffect(() => {
    const fetchUser = async (): Promise<void> => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email ?? null)
    }
    fetchUser()
  }, [])

  // Create a map of group ids to names
  const groupMap = new Map(groups.map((g) => [g.id, g.name]))

  // Transform services to display format
  const allServices: DisplayService[] = services.map((service) => {
    const serviceHeartbeats = heartbeats[service.id] || []
    return {
      id: service.id,
      name: service.name,
      type: service.type as ServiceType,
      status: getServiceStatus(serviceHeartbeats),
      responseTime: getLatestResponseTime(serviceHeartbeats),
      uptime24h: calculateUptime(serviceHeartbeats),
      groupId: service.group_id,
      groupName: service.group_id ? groupMap.get(service.group_id) || null : null,
    }
  })

  // Apply filters
  const displayServices = allServices.filter((service) => {
    // Search filter
    const matchesSearch = searchQuery === '' ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter

    // Type filter
    const matchesType = typeFilter === 'all' || service.type === typeFilter

    // Group filter
    const matchesGroup =
      groupFilter === 'all' ||
      (groupFilter === 'ungrouped' && !service.groupId) ||
      service.groupId === groupFilter

    return matchesSearch && matchesStatus && matchesType && matchesGroup
  })

  // Transform heartbeats for sparkline (just need responseTime)
  const sparklineData: Record<string, { responseTime: number }[]> = {}
  for (const [serviceId, hbs] of Object.entries(heartbeats)) {
    sparklineData[serviceId] = hbs
      .filter((h) => h.response_time_ms !== null)
      .map((h) => ({ responseTime: h.response_time_ms! }))
  }

  // Calculate health score (percentage of services that are up) - use all services
  const upCount = allServices.filter((s) => s.status === 'up').length
  const healthScore = allServices.length > 0 ? (upCount / allServices.length) * 100 : null

  const handleServiceClick = (id: string): void => {
    window.location.href = `/services/${id}`
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

  const handleToggleSelectionMode = (): void => {
    setSelectionMode(!selectionMode)
    setSelectedIds(new Set())
  }

  const handleSelect = (id: string): void => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = (): void => {
    if (selectedIds.size === displayServices.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(displayServices.map((s) => s.id)))
    }
  }

  const handleBulkDelete = async (): Promise<void> => {
    if (selectedIds.size === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} service${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`
    )
    if (!confirmed) return

    setIsDeleting(true)
    let successCount = 0
    let failCount = 0

    for (const id of selectedIds) {
      const success = await deleteService(id)
      if (success) {
        successCount++
      } else {
        failCount++
      }
    }

    setIsDeleting(false)
    setSelectedIds(new Set())
    setSelectionMode(false)

    if (failCount === 0) {
      addToast('success', `Deleted ${successCount} service${successCount > 1 ? 's' : ''}`)
    } else {
      addToast('error', `Deleted ${successCount}, failed to delete ${failCount} service${failCount > 1 ? 's' : ''}`)
    }
  }

  const handleBulkPause = async (): Promise<void> => {
    // TODO: Implement bulk pause when pause functionality is added to API
    addToast('info', 'Bulk pause functionality coming soon')
  }

  const handleBulkResume = async (): Promise<void> => {
    // TODO: Implement bulk resume when resume functionality is added to API
    addToast('info', 'Bulk resume functionality coming soon')
  }

  return (
    <DashboardLayout healthScore={healthScore} userEmail={userEmail}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)]">Dashboard</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Monitor all your services in one place
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="secondary"
              onClick={handleRefresh}
              disabled={isRefreshing || selectionMode}
              className="flex-1 sm:flex-none"
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant={selectionMode ? 'ghost' : 'secondary'}
              onClick={handleToggleSelectionMode}
              className="flex-1 sm:flex-none"
            >
              {selectionMode ? (
                <X className="mr-2 h-4 w-4" />
              ) : (
                <CheckSquare className="mr-2 h-4 w-4" />
              )}
              <span className="hidden sm:inline">{selectionMode ? 'Cancel' : 'Select'}</span>
            </Button>
            {!selectionMode && (
              <Button variant="primary" onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Service</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Filters Row - scrollable on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 sm:gap-4">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | Status)}
              className="min-w-[100px] rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="all">All Status</option>
              <option value="up">Up</option>
              <option value="down">Down</option>
              <option value="pending">Pending</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | ServiceType)}
              className="min-w-[100px] rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="all">All Types</option>
              <option value="http">HTTP</option>
              <option value="tcp">TCP</option>
              <option value="ping">Ping</option>
              <option value="dns">DNS</option>
              <option value="docker">Docker</option>
              <option value="heartbeat">Heartbeat</option>
              <option value="ssl">SSL</option>
            </select>

            {/* Group Filter */}
            {groups.length > 0 && (
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="min-w-[100px] rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="all">All Groups</option>
                <option value="ungrouped">Ungrouped</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Results count */}
          <span className="text-sm text-[var(--muted)] whitespace-nowrap">
            {displayServices.length} of {allServices.length} services
          </span>
        </div>

        {/* Bulk Action Bar */}
        {selectionMode && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedIds.size === displayServices.length ? 'Deselect All' : 'Select All'}
            </Button>
            <span className="text-sm text-[var(--muted)]">
              {selectedIds.size} selected
            </span>
            <div className="ml-auto flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkPause}
                disabled={selectedIds.size === 0}
              >
                <Pause className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Pause</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkResume}
                disabled={selectedIds.size === 0}
              >
                <Play className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Resume</span>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-1 h-4 w-4" />
                )}
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        )}

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
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onSelect={handleSelect}
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
