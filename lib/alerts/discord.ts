import type { AlertChannel, AlertPayload, AlertSender } from './types'

interface DiscordConfig {
  webhookUrl: string
}

interface DiscordEmbed {
  title: string
  description?: string
  color: number
  fields: Array<{
    name: string
    value: string
    inline?: boolean
  }>
  footer?: {
    text: string
  }
  timestamp?: string
}

interface DiscordMessage {
  embeds: DiscordEmbed[]
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}

function buildDiscordMessage(payload: AlertPayload): DiscordMessage {
  const isDown = payload.status === 'down'
  const emoji = isDown ? '🔴' : '🟢'
  const statusText = isDown ? 'DOWN' : 'RECOVERED'
  // Discord colors are decimal: red = 15548997 (0xef4444), green = 1100289 (0x10b981)
  const color = isDown ? 15548997 : 1100289

  const fields: DiscordEmbed['fields'] = [
    {
      name: '📊 Service',
      value: payload.service.name,
      inline: true,
    },
    {
      name: '🔧 Type',
      value: payload.service.type.toUpperCase(),
      inline: true,
    },
    {
      name: '📡 Status',
      value: statusText,
      inline: true,
    },
    {
      name: '⏱️ Response Time',
      value: `${payload.responseTimeMs}ms`,
      inline: true,
    },
  ]

  // Add URL/hostname if available
  const target = payload.service.url || payload.service.hostname
  if (target) {
    fields.push({
      name: '🎯 Target',
      value: `\`${target}\``,
      inline: false,
    })
  }

  // Add message/reason
  if (payload.message) {
    fields.push({
      name: '💬 Message',
      value: payload.message,
      inline: false,
    })
  }

  // Add incident info for recovery
  if (!isDown && payload.incident?.duration_seconds) {
    fields.push({
      name: '⏰ Downtime Duration',
      value: formatDuration(payload.incident.duration_seconds),
      inline: true,
    })
  }

  const embed: DiscordEmbed = {
    title: `${emoji} Service ${statusText}`,
    color,
    fields,
    footer: {
      text: 'Pulse Monitor',
    },
    timestamp: payload.timestamp,
  }

  return {
    embeds: [embed],
  }
}

export const sendDiscord: AlertSender = async (channel, payload) => {
  const config = channel.config as unknown as DiscordConfig

  if (!config.webhookUrl) {
    return { success: false, error: 'No Discord webhook URL configured' }
  }

  try {
    const message = buildDiscordMessage(payload)

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const text = await response.text()
      return {
        success: false,
        error: `Discord returned ${response.status}: ${text}`,
      }
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}
