'use client'

import { useState, useEffect, useCallback } from 'react'

export interface MaintenanceWindow {
  id: string
  service_id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  created_at: string
  updated_at: string
  services?: {
    id: string
    name: string
  }
}

export interface CreateMaintenanceInput {
  serviceId: string
  title: string
  description?: string
  startTime: string
  endTime: string
}

interface UseMaintenanceReturn {
  maintenanceWindows: MaintenanceWindow[]
  activeMaintenanceWindows: MaintenanceWindow[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createMaintenance: (data: CreateMaintenanceInput) => Promise<MaintenanceWindow | null>
  updateMaintenance: (id: string, data: Partial<CreateMaintenanceInput>) => Promise<MaintenanceWindow | null>
  deleteMaintenance: (id: string) => Promise<boolean>
  isServiceInMaintenance: (serviceId: string) => boolean
}

export function useMaintenance(serviceId?: string): UseMaintenanceReturn {
  const [maintenanceWindows, setMaintenanceWindows] = useState<MaintenanceWindow[]>([])
  const [activeMaintenanceWindows, setActiveMaintenanceWindows] = useState<MaintenanceWindow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMaintenance = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      const params = new URLSearchParams()
      if (serviceId) params.set('serviceId', serviceId)

      const [allRes, activeRes] = await Promise.all([
        fetch(`/api/maintenance?${params.toString()}`),
        fetch(`/api/maintenance/active?${params.toString()}`),
      ])

      if (!allRes.ok || !activeRes.ok) {
        throw new Error('Failed to fetch maintenance windows')
      }

      const [allData, activeData] = await Promise.all([
        allRes.json(),
        activeRes.json(),
      ])

      setMaintenanceWindows(allData)
      setActiveMaintenanceWindows(activeData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [serviceId])

  const createMaintenance = useCallback(
    async (data: CreateMaintenanceInput): Promise<MaintenanceWindow | null> => {
      try {
        const response = await fetch('/api/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create maintenance window')
        }

        const newMaintenance = await response.json()
        setMaintenanceWindows((prev) => [...prev, newMaintenance])

        // Check if it's currently active
        const now = new Date()
        const start = new Date(newMaintenance.start_time)
        const end = new Date(newMaintenance.end_time)
        if (now >= start && now <= end) {
          setActiveMaintenanceWindows((prev) => [...prev, newMaintenance])
        }

        return newMaintenance
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create maintenance window')
        return null
      }
    },
    []
  )

  const updateMaintenance = useCallback(
    async (id: string, data: Partial<CreateMaintenanceInput>): Promise<MaintenanceWindow | null> => {
      try {
        const response = await fetch(`/api/maintenance/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            startTime: data.startTime,
            endTime: data.endTime,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update maintenance window')
        }

        const updatedMaintenance = await response.json()
        setMaintenanceWindows((prev) =>
          prev.map((m) => (m.id === id ? updatedMaintenance : m))
        )
        // Refetch active to update correctly
        fetchMaintenance()
        return updatedMaintenance
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update maintenance window')
        return null
      }
    },
    [fetchMaintenance]
  )

  const deleteMaintenance = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/maintenance/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete maintenance window')
      }

      setMaintenanceWindows((prev) => prev.filter((m) => m.id !== id))
      setActiveMaintenanceWindows((prev) => prev.filter((m) => m.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete maintenance window')
      return false
    }
  }, [])

  const isServiceInMaintenance = useCallback(
    (checkServiceId: string): boolean => {
      return activeMaintenanceWindows.some((m) => m.service_id === checkServiceId)
    },
    [activeMaintenanceWindows]
  )

  useEffect(() => {
    fetchMaintenance()
  }, [fetchMaintenance])

  return {
    maintenanceWindows,
    activeMaintenanceWindows,
    isLoading,
    error,
    refetch: fetchMaintenance,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance,
    isServiceInMaintenance,
  }
}
