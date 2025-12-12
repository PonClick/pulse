'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/database.types'
import type { CreateServiceInput } from '@/lib/validations/service'
import type { RealtimeChannel } from '@supabase/supabase-js'

type Service = Tables<'services'>

interface Heartbeat {
  id: string
  service_id: string | null
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
  const channelRef = useRef<RealtimeChannel | null>(null)

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
        // Don't update state here - realtime subscription will handle it
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

      // Don't update state here - realtime subscription will handle it
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service')
      return false
    }
  }, [])

  // Setup realtime subscriptions
  useEffect(() => {
    const supabase = createClient()

    // Create channel for realtime updates
    const channel = supabase
      .channel('dashboard-changes')
      // Subscribe to services changes
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'services' },
        (payload) => {
          const newService = payload.new as Service
          setServices((prev) => {
            // Check if service already exists (prevent duplicates)
            if (prev.some((s) => s.id === newService.id)) return prev
            return [newService, ...prev]
          })
          setHeartbeats((prev) => ({ ...prev, [newService.id]: [] }))
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'services' },
        (payload) => {
          const updatedService = payload.new as Service
          setServices((prev) =>
            prev.map((s) => (s.id === updatedService.id ? updatedService : s))
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'services' },
        (payload) => {
          const deletedId = payload.old.id as string
          setServices((prev) => prev.filter((s) => s.id !== deletedId))
          setHeartbeats((prev) => {
            const updated = { ...prev }
            delete updated[deletedId]
            return updated
          })
        }
      )
      // Subscribe to heartbeats changes (for live status updates)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'heartbeats' },
        (payload) => {
          const newHeartbeat = payload.new as Heartbeat
          if (newHeartbeat.service_id) {
            setHeartbeats((prev) => {
              const serviceHeartbeats = prev[newHeartbeat.service_id!] || []
              // Keep only last 20 heartbeats
              const updated = [...serviceHeartbeats, newHeartbeat].slice(-20)
              return { ...prev, [newHeartbeat.service_id!]: updated }
            })
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  // Initial fetch
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
