import { RegisterForm } from '@/components/auth'
import { Activity } from 'lucide-react'

export default function RegisterPage(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-[var(--primary)] p-3 mb-4">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Create an account</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Get started with Pulse monitoring
          </p>
        </div>

        {/* Register Form */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
