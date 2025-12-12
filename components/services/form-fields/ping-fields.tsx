'use client'

import { Input } from '@/components/ui/input'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { PingServiceInput } from '@/lib/validations/service'

interface PingFieldsProps {
  register: UseFormRegister<PingServiceInput>
  errors: FieldErrors<PingServiceInput>
}

export function PingFields({
  register,
  errors,
}: PingFieldsProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <Input
        label="Hostname"
        placeholder="example.com or 192.168.1.1"
        error={errors.hostname?.message}
        {...register('hostname')}
      />
    </div>
  )
}
