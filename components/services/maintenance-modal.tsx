'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Wrench } from 'lucide-react'
import type { CreateMaintenanceInput } from '@/lib/hooks'

interface MaintenanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateMaintenanceInput) => Promise<void>
  serviceId: string
  serviceName: string
}

const maintenanceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
})

type FormData = z.infer<typeof maintenanceSchema>

// Helper to format datetime-local input value
function formatDateTimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset()
  const adjusted = new Date(date.getTime() - offset * 60 * 1000)
  return adjusted.toISOString().slice(0, 16)
}

export function MaintenanceModal({
  isOpen,
  onClose,
  onSubmit,
  serviceId,
  serviceName,
}: MaintenanceModalProps): React.ReactElement {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Default to current time for start, +1 hour for end
  const now = new Date()
  const defaultEnd = new Date(now.getTime() + 60 * 60 * 1000)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      title: '',
      description: '',
      startTime: formatDateTimeLocal(now),
      endTime: formatDateTimeLocal(defaultEnd),
    },
  })

  const handleClose = useCallback((): void => {
    reset()
    setFormError(null)
    onClose()
  }, [reset, onClose])

  const handleFormSubmit = async (data: FormData): Promise<void> => {
    setFormError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({
        serviceId,
        title: data.title,
        description: data.description || undefined,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
      })
      handleClose()
    } catch (error) {
      console.error('Failed to schedule maintenance:', error)
      setFormError('Failed to schedule maintenance. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Schedule Maintenance">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Info Banner */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <Wrench className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-amber-200">
              Scheduling maintenance for <strong>{serviceName}</strong>
            </p>
            <p className="text-xs text-amber-300/70 mt-1">
              Alerts will be suppressed during this maintenance window.
            </p>
          </div>
        </div>

        {/* Title */}
        <Input
          label="Title"
          placeholder="Scheduled server upgrade"
          error={errors.title?.message as string}
          {...register('title')}
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Description (optional)
          </label>
          <textarea
            placeholder="Details about the maintenance..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[80px] resize-y"
            {...register('description')}
          />
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Start Time
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              {...register('startTime')}
            />
            {errors.startTime && (
              <p className="text-xs text-red-500 mt-1">{errors.startTime.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              End Time
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              {...register('endTime')}
            />
            {errors.endTime && (
              <p className="text-xs text-red-500 mt-1">{errors.endTime.message}</p>
            )}
          </div>
        </div>

        {/* Form Error */}
        {formError && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-500">{formError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Schedule Maintenance
          </Button>
        </div>
      </form>
    </Modal>
  )
}
