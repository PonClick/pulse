import { Suspense } from 'react'
import { LoginForm } from '@/components/auth'
import { Activity } from 'lucide-react'

export default function LoginPage(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-[var(--primary)] p-3 mb-4">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Welcome back</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Sign in to your Pulse dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <Suspense fallback={<div className="h-64 animate-pulse bg-[var(--accent)] rounded-lg" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
