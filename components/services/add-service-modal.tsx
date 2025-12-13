'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import { MonitorTypeSelector } from './monitor-type-selector'
import {
  serviceTypes,
  type ServiceType,
  type CreateServiceInput,
} from '@/lib/validations/service'

interface AddServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateServiceInput) => Promise<void>
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

// Flexible form schema - validates common fields, type-specific validation in submit
const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(500).optional(),
  type: z.enum(serviceTypes),
  intervalSeconds: z.number().min(10).max(3600),
  timeoutSeconds: z.number().min(1).max(60),
  retries: z.number().min(0).max(5),
  // HTTP
  url: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']).optional(),
  expectedStatus: z.string().optional(),
  keyword: z.string().optional(),
  verifySsl: z.boolean().optional(),
  headers: z.string().optional(), // JSON string of headers
  body: z.string().optional(),
  // TCP/Ping/DNS
  hostname: z.string().optional(),
  port: z.number().optional(),
  // DNS
  dnsRecordType: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS']).optional(),
  dnsServer: z.string().optional(),
  expectedValue: z.string().optional(),
  // Docker
  dockerHost: z.string().optional(),
  containerName: z.string().optional(),
  // SSL
  sslExpiryWarningDays: z.number().min(1).max(365).optional(),
})

type FormData = z.infer<typeof formSchema>

export function AddServiceModal({
  isOpen,
  onClose,
  onSubmit,
}: AddServiceModalProps): React.ReactElement {
  const [selectedType, setSelectedType] = useState<ServiceType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verifySsl, setVerifySsl] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      intervalSeconds: 60,
      timeoutSeconds: 10,
      retries: 0,
      method: 'GET',
      expectedStatus: '200, 201, 204',
      verifySsl: true,
      dnsRecordType: 'A',
      dnsServer: '1.1.1.1',
    },
  })

  const handleClose = useCallback((): void => {
    reset()
    setSelectedType(null)
    setVerifySsl(true)
    setFormError(null)
    onClose()
  }, [reset, onClose])

  const validateTypeSpecificFields = (data: FormData): string | null => {
    switch (data.type) {
      case 'http':
        if (!data.url) return 'URL is required'
        try {
          new URL(data.url)
        } catch {
          return 'Please enter a valid URL'
        }
        break
      case 'tcp':
        if (!data.hostname) return 'Hostname is required'
        if (!data.port || data.port < 1 || data.port > 65535) return 'Valid port (1-65535) is required'
        break
      case 'ping':
        if (!data.hostname) return 'Hostname is required'
        break
      case 'dns':
        if (!data.hostname) return 'Hostname is required'
        break
      case 'docker':
        if (!data.dockerHost) return 'Docker host is required'
        if (!data.containerName) return 'Container name is required'
        break
      case 'ssl':
        if (!data.hostname) return 'Hostname is required'
        break
    }
    return null
  }

  const handleFormSubmit = async (data: FormData): Promise<void> => {
    if (!selectedType) {
      setFormError('Please select a monitor type')
      return
    }

    // Validate type-specific fields
    const validationError = validateTypeSpecificFields(data)
    if (validationError) {
      setFormError(validationError)
      return
    }

    setFormError(null)
    setIsSubmitting(true)

    try {
      // Build the final data object based on type
      const baseData = {
        name: data.name,
        description: data.description,
        intervalSeconds: data.intervalSeconds,
        timeoutSeconds: data.timeoutSeconds,
        retries: data.retries,
      }

      let formData: CreateServiceInput

      switch (selectedType) {
        case 'http':
          // Parse headers if provided
          let parsedHeaders: Record<string, string> | undefined
          if (data.headers) {
            try {
              parsedHeaders = JSON.parse(data.headers)
            } catch {
              setFormError('Invalid headers JSON format')
              return
            }
          }
          formData = {
            ...baseData,
            type: 'http',
            url: data.url!,
            method: data.method || 'GET',
            expectedStatus: data.expectedStatus
              ? data.expectedStatus.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n))
              : [200, 201, 204],
            keyword: data.keyword,
            verifySsl: verifySsl,
            headers: parsedHeaders,
            body: data.body,
          }
          break
        case 'tcp':
          formData = {
            ...baseData,
            type: 'tcp',
            hostname: data.hostname!,
            port: data.port!,
          }
          break
        case 'ping':
          formData = {
            ...baseData,
            type: 'ping',
            hostname: data.hostname!,
          }
          break
        case 'dns':
          formData = {
            ...baseData,
            type: 'dns',
            hostname: data.hostname!,
            dnsRecordType: data.dnsRecordType || 'A',
            dnsServer: data.dnsServer || '1.1.1.1',
            expectedValue: data.expectedValue,
          }
          break
        case 'docker':
          formData = {
            ...baseData,
            type: 'docker',
            dockerHost: data.dockerHost!,
            containerName: data.containerName!,
          }
          break
        case 'heartbeat':
          formData = {
            ...baseData,
            type: 'heartbeat',
          }
          break
        case 'ssl':
          formData = {
            ...baseData,
            type: 'ssl',
            hostname: data.hostname!,
            port: data.port || 443,
            sslExpiryWarningDays: data.sslExpiryWarningDays || 30,
          }
          break
      }

      await onSubmit(formData)
      handleClose()
    } catch (error) {
      console.error('Failed to create service:', error)
      setFormError('Failed to create service. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTypeChange = (type: ServiceType): void => {
    setSelectedType(type)
    setValue('type', type)
    setFormError(null)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Service">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Step 1: Select Monitor Type */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white">Monitor Type</h3>
          <MonitorTypeSelector value={selectedType} onChange={handleTypeChange} />
        </div>

        {/* Step 2: Basic Settings (only show after type selected) */}
        {selectedType && (
          <>
            <div className="border-t border-zinc-800 pt-6 space-y-4">
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
                {selectedType.toUpperCase()} Settings
              </h3>

              {/* HTTP Fields */}
              {selectedType === 'http' && (
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">
                      Headers (optional)
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                      rows={3}
                      {...register('headers')}
                    />
                    <p className="text-xs text-zinc-500">Enter headers as JSON object</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">
                      Request Body (optional)
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder='{"key": "value"}'
                      rows={3}
                      {...register('body')}
                    />
                    <p className="text-xs text-zinc-500">For POST, PUT, PATCH requests</p>
                  </div>
                  <Toggle
                    label="Verify SSL Certificate"
                    checked={verifySsl}
                    onChange={setVerifySsl}
                  />
                </>
              )}

              {/* TCP Fields */}
              {selectedType === 'tcp' && (
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
              {selectedType === 'ping' && (
                <Input
                  label="Hostname"
                  placeholder="example.com or 192.168.1.1"
                  error={errors.hostname?.message as string}
                  {...register('hostname')}
                />
              )}

              {/* DNS Fields */}
              {selectedType === 'dns' && (
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
              {selectedType === 'docker' && (
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

              {/* SSL Fields */}
              {selectedType === 'ssl' && (
                <>
                  <Input
                    label="Hostname"
                    placeholder="example.com"
                    error={errors.hostname?.message as string}
                    {...register('hostname')}
                  />
                  <Input
                    label="Port"
                    type="number"
                    placeholder="443"
                    {...register('port', { valueAsNumber: true })}
                  />
                  <Input
                    label="Warning Days Before Expiry"
                    type="number"
                    placeholder="30"
                    {...register('sslExpiryWarningDays', { valueAsNumber: true })}
                  />
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                    <p className="text-sm text-zinc-400">
                      SSL Certificate monitors check when your certificate expires.
                      You&apos;ll be notified when it&apos;s within the warning period.
                    </p>
                  </div>
                </>
              )}

              {/* Heartbeat Info */}
              {selectedType === 'heartbeat' && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-sm text-zinc-400 mb-2">
                    Heartbeat monitors work differently. Instead of Pulse checking
                    your service, your service sends a ping to Pulse.
                  </p>
                  <p className="text-sm text-zinc-400">
                    After creating this monitor, you&apos;ll receive a unique URL.
                    Send a GET or POST request to this URL from your service.
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
                Create Service
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  )
}
