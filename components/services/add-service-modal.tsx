'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import { MonitorTypeSelector } from './monitor-type-selector'
import {
  httpServiceSchema,
  tcpServiceSchema,
  pingServiceSchema,
  dnsServiceSchema,
  dockerServiceSchema,
  heartbeatServiceSchema,
  type ServiceType,
  type CreateServiceInput,
} from '@/lib/validations/service'
import type { z } from 'zod'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema = z.ZodType<any, any, any>

const schemaMap: Record<ServiceType, AnySchema> = {
  http: httpServiceSchema,
  tcp: tcpServiceSchema,
  ping: pingServiceSchema,
  dns: dnsServiceSchema,
  docker: dockerServiceSchema,
  heartbeat: heartbeatServiceSchema,
}

export function AddServiceModal({
  isOpen,
  onClose,
  onSubmit,
}: AddServiceModalProps): React.ReactElement {
  const [selectedType, setSelectedType] = useState<ServiceType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verifySsl, setVerifySsl] = useState(true)

  const schema = selectedType ? schemaMap[selectedType] : heartbeatServiceSchema

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
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

  const handleClose = (): void => {
    reset()
    setSelectedType(null)
    setVerifySsl(true)
    onClose()
  }

  const handleFormSubmit = async (data: Record<string, unknown>): Promise<void> => {
    if (!selectedType) return

    setIsSubmitting(true)
    try {
      // Transform expected status from string to array
      const formData = {
        ...data,
        type: selectedType,
        verifySsl: selectedType === 'http' ? verifySsl : undefined,
        expectedStatus:
          selectedType === 'http' && typeof data.expectedStatus === 'string'
            ? data.expectedStatus.split(',').map((s: string) => parseInt(s.trim(), 10))
            : undefined,
      }
      await onSubmit(formData as CreateServiceInput)
      handleClose()
    } catch (error) {
      console.error('Failed to create service:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTypeChange = (type: ServiceType): void => {
    setSelectedType(type)
    setValue('type', type)
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
