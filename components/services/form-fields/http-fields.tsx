'use client'

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { HttpServiceInput } from '@/lib/validations/service'

interface HttpFieldsProps {
  register: UseFormRegister<HttpServiceInput>
  errors: FieldErrors<HttpServiceInput>
  verifySsl: boolean
  onVerifySslChange: (value: boolean) => void
}

const methodOptions = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'HEAD', label: 'HEAD' },
]

export function HttpFields({
  register,
  errors,
  verifySsl,
  onVerifySslChange,
}: HttpFieldsProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <Input
        label="URL"
        placeholder="https://example.com/api/health"
        error={errors.url?.message}
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
        error={errors.expectedStatus?.message}
        {...register('expectedStatus', {
          setValueAs: (v: string) =>
            v ? v.split(',').map((s) => parseInt(s.trim(), 10)) : [200],
        })}
      />

      <Input
        label="Keyword (optional)"
        placeholder="Text to search in response"
        {...register('keyword')}
      />

      <Toggle
        label="Verify SSL Certificate"
        checked={verifySsl}
        onChange={onVerifySslChange}
      />
    </div>
  )
}
