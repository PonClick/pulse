'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Group {
  id: string
  name: string
  description: string | null
  color: string
  collapsed: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface UseGroupsReturn {
  groups: Group[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createGroup: (data: { name: string; description?: string; color?: string }) => Promise<Group | null>
  updateGroup: (id: string, data: Partial<Group>) => Promise<Group | null>
  deleteGroup: (id: string) => Promise<boolean>
}

export function useGroups(): UseGroupsReturn {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGroups = useCallback(async (): Promise<void> => {
    try {
      setError(null)
      const response = await fetch('/api/groups')
      if (!response.ok) {
        throw new Error('Failed to fetch groups')
      }
      const data = await response.json()
      setGroups(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createGroup = useCallback(
    async (data: { name: string; description?: string; color?: string }): Promise<Group | null> => {
      try {
        const response = await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create group')
        }

        const newGroup = await response.json()
        setGroups((prev) => [...prev, newGroup])
        return newGroup
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create group')
        return null
      }
    },
    []
  )

  const updateGroup = useCallback(
    async (id: string, data: Partial<Group>): Promise<Group | null> => {
      try {
        const response = await fetch(`/api/groups/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error('Failed to update group')
        }

        const updatedGroup = await response.json()
        setGroups((prev) => prev.map((g) => (g.id === id ? updatedGroup : g)))
        return updatedGroup
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update group')
        return null
      }
    },
    []
  )

  const deleteGroup = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete group')
      }

      setGroups((prev) => prev.filter((g) => g.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group')
      return false
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  return {
    groups,
    isLoading,
    error,
    refetch: fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  }
}
