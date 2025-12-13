'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layouts'
import { Card, Badge, Button, Input, Modal } from '@/components/ui'
import {
  Settings,
  Plus,
  Webhook,
  Mail,
  Trash2,
  RefreshCw,
  Loader2,
  ToggleLeft,
  ToggleRight,
  MessageSquare,
  Hash,
} from 'lucide-react'

type ChannelType = 'webhook' | 'email' | 'slack' | 'discord'

interface AlertChannel {
  id: string
  name: string
  type: ChannelType
  config: Record<string, unknown>
  is_active: boolean
  created_at: string
}

const channelIcons: Record<ChannelType, typeof Webhook> = {
  webhook: Webhook,
  email: Mail,
  slack: Hash,
  discord: MessageSquare,
}

export default function SettingsPage(): React.ReactElement {
  const [channels, setChannels] = useState<AlertChannel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const fetchChannels = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/alert-channels')
      if (!response.ok) throw new Error('Failed to fetch channels')
      const data = await response.json()
      setChannels(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchChannels()
  }, [])

  const handleAddChannel = async (data: {
    name: string
    type: ChannelType
    config: Record<string, string>
  }): Promise<void> => {
    try {
      const response = await fetch('/api/alert-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to create channel')

      await fetchChannels()
      setIsAddModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleDeleteChannel = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this channel?')) return

    try {
      const response = await fetch(`/api/alert-channels/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete channel')
      await fetchChannels()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Settings</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Configure alert channels and notifications
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={fetchChannels} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Channel
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Alert Channels Section */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
            <Settings className="h-5 w-5 text-zinc-400" />
            Alert Channels
          </h2>

          {isLoading ? (
            <Card className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </Card>
          ) : channels.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-8 text-center">
              <Webhook className="h-8 w-8 text-zinc-600" />
              <p className="mt-2 text-zinc-400">No alert channels configured</p>
              <p className="text-sm text-zinc-500">
                Add a webhook or email channel to receive alerts
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {channels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  onDelete={() => handleDeleteChannel(channel.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Channel Modal */}
      <AddChannelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddChannel}
      />
    </DashboardLayout>
  )
}

interface ChannelCardProps {
  channel: AlertChannel
  onDelete: () => void
}

function ChannelCard({ channel, onDelete }: ChannelCardProps): React.ReactElement {
  const Icon = channelIcons[channel.type] || Webhook
  const config = channel.config as Record<string, string>

  const getConfigDisplay = (): string => {
    switch (channel.type) {
      case 'webhook':
        return config.url || ''
      case 'email':
        return config.to || ''
      case 'slack':
      case 'discord':
        return config.webhookUrl || ''
      default:
        return ''
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
            <Icon className="h-5 w-5 text-zinc-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-white">{channel.name}</h3>
              <Badge variant="default" className="capitalize">
                {channel.type}
              </Badge>
              <Badge variant={channel.is_active ? 'success' : 'default'}>
                {channel.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 max-w-md truncate">
              {getConfigDisplay()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {channel.is_active ? (
            <ToggleRight className="h-6 w-6 text-emerald-500" />
          ) : (
            <ToggleLeft className="h-6 w-6 text-zinc-500" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-zinc-400 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

interface AddChannelModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    type: ChannelType
    config: Record<string, string>
  }) => Promise<void>
}

const channelTypeOptions: Array<{
  type: ChannelType
  label: string
  icon: typeof Webhook
  placeholder: string
}> = [
  { type: 'slack', label: 'Slack', icon: Hash, placeholder: 'https://hooks.slack.com/services/...' },
  { type: 'discord', label: 'Discord', icon: MessageSquare, placeholder: 'https://discord.com/api/webhooks/...' },
  { type: 'webhook', label: 'Webhook', icon: Webhook, placeholder: 'https://example.com/webhook' },
  { type: 'email', label: 'Email', icon: Mail, placeholder: 'alerts@example.com' },
]

function AddChannelModal({ isOpen, onClose, onSubmit }: AddChannelModalProps): React.ReactElement {
  const [type, setType] = useState<ChannelType>('slack')
  const [name, setName] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (): Promise<void> => {
    if (!name) return

    setIsSubmitting(true)
    try {
      let config: Record<string, string> = {}

      switch (type) {
        case 'webhook':
          config = { url: webhookUrl }
          break
        case 'email':
          config = { to: email }
          break
        case 'slack':
        case 'discord':
          config = { webhookUrl }
          break
      }

      await onSubmit({ name, type, config })

      // Reset form
      setName('')
      setWebhookUrl('')
      setEmail('')
      setType('slack')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedOption = channelTypeOptions.find((opt) => opt.type === type)!
  const needsWebhook = type === 'webhook' || type === 'slack' || type === 'discord'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Alert Channel">
      <div className="space-y-4">
        {/* Channel Type */}
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Channel Type</label>
          <div className="grid grid-cols-2 gap-3">
            {channelTypeOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={() => setType(option.type)}
                  className={`flex items-center gap-2 rounded-lg border p-3 transition-colors ${
                    type === option.type
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Name */}
        <Input
          label="Channel Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`e.g., ${selectedOption.label} Alerts`}
        />

        {/* Type-specific fields */}
        {needsWebhook ? (
          <Input
            label={`${selectedOption.label} Webhook URL`}
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder={selectedOption.placeholder}
          />
        ) : (
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={selectedOption.placeholder}
          />
        )}

        {/* Help text */}
        {type === 'slack' && (
          <p className="text-xs text-zinc-500">
            Create a webhook in Slack: App settings → Incoming Webhooks → Add New Webhook
          </p>
        )}
        {type === 'discord' && (
          <p className="text-xs text-zinc-500">
            Create a webhook in Discord: Server Settings → Integrations → Webhooks → New Webhook
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!name || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Channel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
