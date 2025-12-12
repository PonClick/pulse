'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface HeartbeatFieldsProps {
  serviceId?: string
}

export function HeartbeatFields({
  serviceId,
}: HeartbeatFieldsProps): React.ReactElement {
  const [copied, setCopied] = useState(false)
  const pushUrl = serviceId
    ? `${window.location.origin}/api/heartbeat/${serviceId}`
    : 'URL will be generated after creation'

  const handleCopy = async (): Promise<void> => {
    if (!serviceId) return
    await navigator.clipboard.writeText(pushUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-sm text-zinc-400 mb-2">
          Heartbeat monitors work differently. Instead of Pulse checking your
          service, your service sends a ping to Pulse.
        </p>
        <p className="text-sm text-zinc-400">
          After creating this monitor, you&apos;ll receive a unique URL. Send a GET
          or POST request to this URL from your service (e.g., via cron job).
        </p>
      </div>

      {serviceId && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Push URL</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 overflow-x-auto">
              {pushUrl}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
