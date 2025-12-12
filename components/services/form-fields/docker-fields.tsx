'use client'

import { Input } from '@/components/ui/input'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { DockerServiceInput } from '@/lib/validations/service'

interface DockerFieldsProps {
  register: UseFormRegister<DockerServiceInput>
  errors: FieldErrors<DockerServiceInput>
}

export function DockerFields({
  register,
  errors,
}: DockerFieldsProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <Input
        label="Docker Host"
        placeholder="unix:///var/run/docker.sock or tcp://localhost:2375"
        error={errors.dockerHost?.message}
        {...register('dockerHost')}
      />

      <Input
        label="Container Name"
        placeholder="my-container"
        error={errors.containerName?.message}
        {...register('containerName')}
      />
    </div>
  )
}
