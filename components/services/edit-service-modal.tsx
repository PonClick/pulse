'use client'

import { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import { serviceTypes, type ServiceType } from '@/lib/validations/service'

interface Service {
  id: string
  name: string
  description: string | null
  type: ServiceType
  url: string | null
  method: string | null
  expected_status: number[] | null
  keyword: string | null
  verify_ssl: boolean | null
  hostname: string | null
  port: number | null
  dns_record_type: string | null
  dns_server: string | null
  expected_value: string | null
  docker_host: string | null
  container_name: string | null
  interval_seconds: number
  timeout_seconds: number
  retries: number
}

interface EditServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  service: Service
}

const intervalOptions = [
  { value: '30', label: 'Every 30 seconds' },
  { value: '60', label: 'Every 1 minute' },
  { value: '300', label: 'Every 5 minutes' },
  { value: '600', label: 'Every 10 minutes' },
  { value: '1800', label: 'Every 30 minutes' },
  { value: '3600', label: 'Every 1 hour' },
]

const methodOptions = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'HEAD', label: 'HEAD' },
]

const dnsRecordOptions = [
  { value: 'A', label: 'A (IPv4)' },
  { value: 'AAAA', label: 'AAAA (IPv6)' },
  { value: 'CNAME', label: 'CNAME' },
  { value: 'MX', label: 'MX (Mail)' },
  { value: 'TXT', label: 'TXT' },
  { value: 'NS', label: 'NS (Nameserver)' },
]

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(500).optional().nullable(),
  intervalSeconds: z.number().min(10).max(3600),
  timeoutSeconds: z.number().min(1).max(60),
  retries: z.number().min(0).max(5),
  url: z.string().optional().nullable(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']).optional().nullable(),
  expectedStatus: z.string().optional().nullable(),
  keyword: z.string().optional().nullable(),
  hostname: z.string().optional().nullable(),
  port: z.number().optional().nullable(),
  dnsRecordType: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS']).optional().nullable(),
  dnsServer: z.string().optional().nullable(),
  expectedValue: z.string().optional().nullable(),
  dockerHost: z.string().optional().nullable(),
  containerName: z.string().optional().nullable(),
})

type FormData = z.infer<typeof formSchema>

export function EditServiceModal({
  isOpen,
  onClose,
  onSubmit,
  service,
}: EditServiceModalProps): React.ReactElement {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verifySsl, setVerifySsl] = useState(service.verify_ssl ?? true)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: service.name,
      description: service.description,
      intervalSeconds: service.interval_seconds,
      timeoutSeconds: service.timeout_seconds,
      retries: service.retries,
      url: service.url,
      method: service.method as FormData['method'],
      expectedStatus: service.expected_status?.join(', ') || '200, 201, 204',
      keyword: service.keyword,
      hostname: service.hostname,
      port: service.port,
      dnsRecordType: service.dns_record_type as FormData['dnsRecordType'],
      dnsServer: service.dns_server || '1.1.1.1',
      expectedValue: service.expected_value,
      dockerHost: service.docker_host,
      containerName: service.container_name,
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        name: service.name,
        description: service.description,
        intervalSeconds: service.interval_seconds,
        timeoutSeconds: service.timeout_seconds,
        retries: service.retries,
        url: service.url,
        method: service.method as FormData['method'],
        expectedStatus: service.expected_status?.join(', ') || '200, 201, 204',
        keyword: service.keyword,
        hostname: service.hostname,
        port: service.port,
        dnsRecordType: service.dns_record_type as FormData['dnsRecordType'],
        dnsServer: service.dns_server || '1.1.1.1',
        expectedValue: service.expected_value,
        dockerHost: service.docker_host,
        containerName: service.container_name,
      })
      setVerifySsl(service.verify_ssl ?? true)
    }
  }, [isOpen, service, reset])

  const handleClose = useCallback((): void => {
    setFormError(null)
    onClose()
  }, [onClose])

  const handleFormSubmit = async (data: FormData): Promise<void> => {
    setFormError(null)
    setIsSubmitting(true)

    try {
      const updateData: Record<string, unknown> = {
        name: data.name,
        intervalSeconds: data.intervalSeconds,
        timeoutSeconds: data.timeoutSeconds,
        retries: data.retries,
      }

      // Only include description if it has a value
      if (data.description) {
        updateData.description = data.description
      }

      // Add type-specific fields
      switch (service.type) {
        case 'http':
          if (data.url) updateData.url = data.url
          updateData.method = data.method || 'GET'
          updateData.expectedStatus = data.expectedStatus
            ? data.expectedStatus.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n))
            : [200, 201, 204]
          if (data.keyword) updateData.keyword = data.keyword
          updateData.verifySsl = verifySsl
          break
        case 'tcp':
          if (data.hostname) updateData.hostname = data.hostname
          if (data.port) updateData.port = data.port
          break
        case 'ping':
          if (data.hostname) updateData.hostname = data.hostname
          break
        case 'dns':
          if (data.hostname) updateData.hostname = data.hostname
          updateData.dnsRecordType = data.dnsRecordType || 'A'
          updateData.dnsServer = data.dnsServer || '1.1.1.1'
          if (data.expectedValue) updateData.expectedValue = data.expectedValue
          break
        case 'docker':
          if (data.dockerHost) updateData.dockerHost = data.dockerHost
          if (data.containerName) updateData.containerName = data.containerName
          break
      }

      await onSubmit(updateData)
      handleClose()
    } catch (error) {
      console.error('Failed to update service:', error)
      setFormError('Failed to update service. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Service">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-white">Basic Settings</h3>
          <Input
            label="Name"
            placeholder="My Service"
            error={errors.name?.message as string}
            {...register('name')}
          />
          <Input
            label="Description (optional)"
            placeholder="Optional description"
            {...register('description')}
          />
        </div>

        {/* Type-specific fields */}
        <div className="border-t border-zinc-800 pt-6 space-y-4">
          <h3 className="text-sm font-medium text-white">
            {service.type.toUpperCase()} Settings
          </h3>

          {/* HTTP Fields */}
          {service.type === 'http' && (
            <>
              <Input
                label="URL"
                placeholder="https://example.com/api/health"
                error={errors.url?.message as string}
                {...register('url')}
              />
              <Select
                label="Method"
                options={methodOptions}
                {...register('method')}
              />
              <Input
                label="Expected Status Codes"
                placeholder="200, 201, 204"
                {...register('expectedStatus')}
              />
              <Input
                label="Keyword (optional)"
                placeholder="Text to search in response"
                {...register('keyword')}
              />
              <Toggle
                label="Verify SSL Certificate"
                checked={verifySsl}
                onChange={setVerifySsl}
              />
            </>
          )}

          {/* TCP Fields */}
          {service.type === 'tcp' && (
            <>
              <Input
                label="Hostname"
                placeholder="example.com or 192.168.1.1"
                error={errors.hostname?.message as string}
                {...register('hostname')}
              />
              <Input
                label="Port"
                type="number"
                placeholder="3306"
                error={errors.port?.message as string}
                {...register('port', { valueAsNumber: true })}
              />
            </>
          )}

          {/* Ping Fields */}
          {service.type === 'ping' && (
            <Input
              label="Hostname"
              placeholder="example.com or 192.168.1.1"
              error={errors.hostname?.message as string}
              {...register('hostname')}
            />
          )}

          {/* DNS Fields */}
          {service.type === 'dns' && (
            <>
              <Input
                label="Hostname"
                placeholder="example.com"
                error={errors.hostname?.message as string}
                {...register('hostname')}
              />
              <Select
                label="Record Type"
                options={dnsRecordOptions}
                {...register('dnsRecordType')}
              />
              <Input
                label="DNS Server"
                placeholder="1.1.1.1"
                {...register('dnsServer')}
              />
              <Input
                label="Expected Value (optional)"
                placeholder="Expected IP or record value"
                {...register('expectedValue')}
              />
            </>
          )}

          {/* Docker Fields */}
          {service.type === 'docker' && (
            <>
              <Input
                label="Docker Host"
                placeholder="unix:///var/run/docker.sock"
                error={errors.dockerHost?.message as string}
                {...register('dockerHost')}
              />
              <Input
                label="Container Name"
                placeholder="my-container"
                error={errors.containerName?.message as string}
                {...register('containerName')}
              />
            </>
          )}

          {/* Heartbeat Info */}
          {service.type === 'heartbeat' && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-sm text-zinc-400">
                Heartbeat monitors receive push notifications from your services.
                The monitor type cannot be changed after creation.
              </p>
            </div>
          )}
        </div>

        {/* Advanced Settings */}
        <div className="border-t border-zinc-800 pt-6 space-y-4">
          <h3 className="text-sm font-medium text-white">Advanced Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Check Interval"
              options={intervalOptions}
              {...register('intervalSeconds', { valueAsNumber: true })}
            />
            <Input
              label="Timeout (seconds)"
              type="number"
              placeholder="10"
              {...register('timeoutSeconds', { valueAsNumber: true })}
            />
          </div>
          <Input
            label="Retries"
            type="number"
            placeholder="0"
            {...register('retries', { valueAsNumber: true })}
          />
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
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}
