'use client'

import { Input } from '@/components/ui/input'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { TcpServiceInput } from '@/lib/validations/service'

interface TcpFieldsProps {
  register: UseFormRegister<TcpServiceInput>
  errors: FieldErrors<TcpServiceInput>
}

export function TcpFields({
  register,
  errors,
}: TcpFieldsProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <Input
        label="Hostname"
        placeholder="example.com or 192.168.1.1"
        error={errors.hostname?.message}
        {...register('hostname')}
      />

      <Input
        label="Port"
        type="number"
        placeholder="3306"
        error={errors.port?.message}
        {...register('port', { valueAsNumber: true })}
      />
    </div>
  )
}
