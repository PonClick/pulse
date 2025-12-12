'use client'

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { DnsServiceInput } from '@/lib/validations/service'

interface DnsFieldsProps {
  register: UseFormRegister<DnsServiceInput>
  errors: FieldErrors<DnsServiceInput>
}

const recordTypeOptions = [
  { value: 'A', label: 'A (IPv4)' },
  { value: 'AAAA', label: 'AAAA (IPv6)' },
  { value: 'CNAME', label: 'CNAME' },
  { value: 'MX', label: 'MX (Mail)' },
  { value: 'TXT', label: 'TXT' },
  { value: 'NS', label: 'NS (Nameserver)' },
]

export function DnsFields({
  register,
  errors,
}: DnsFieldsProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <Input
        label="Hostname"
        placeholder="example.com"
        error={errors.hostname?.message}
        {...register('hostname')}
      />

      <Select
        label="Record Type"
        options={recordTypeOptions}
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
    </div>
  )
}
