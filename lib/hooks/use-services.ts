'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Tables } from '@/lib/supabase/database.types'
import type { CreateServiceInput } from '@/lib/validations/service'

type Service = Tables<'services'>

interface Heartbeat {
  id: string
  status: string
  response_time_ms: number | null
  created_at: string | null
}

interface UseServicesReturn {
  services: Service[]
  heartbeats: Record<string, Heartbeat[]>
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createService: (data: CreateServiceInput) => Promise<Service | null>
  deleteService: (id: string) => Promise<boolean>
}

export function useServices(): UseServicesReturn {
  const [services, setServices] = useState<Service[]>([])
  const [heartbeats, setHeartbeats] = useState<Record<string, Heartbeat[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      const response = await fetch('/api/services')
      if (!response.ok) {
        throw new Error('Failed to fetch services')
      }
      const data = await response.json()
      setServices(data)

      // Fetch heartbeats for each service
      const heartbeatsData: Record<string, Heartbeat[]> = {}
      await Promise.all(
        data.map(async (service: Service) => {
          try {
            const hbResponse = await fetch(`/api/services/${service.id}/heartbeats?limit=20`)
            if (hbResponse.ok) {
              heartbeatsData[service.id] = await hbResponse.json()
            }
          } catch {
            heartbeatsData[service.id] = []
          }
        })
      )
      setHeartbeats(heartbeatsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createService = useCallback(
    async (data: CreateServiceInput): Promise<Service | null> => {
      try {
        const response = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create service')
        }

        const newService = await response.json()
        setServices((prev) => [newService, ...prev])
        setHeartbeats((prev) => ({ ...prev, [newService.id]: [] }))
        return newService
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create service')
        return null
      }
    },
    []
  )

  const deleteService = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete service')
      }

      setServices((prev) => prev.filter((s) => s.id !== id))
      setHeartbeats((prev) => {
        const updated = { ...prev }
        delete updated[id]
        return updated
      })
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service')
      return false
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  return {
    services,
    heartbeats,
    isLoading,
    error,
    refetch: fetchServices,
    createService,
    deleteService,
  }
}
