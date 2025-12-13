import type { AlertChannel, AlertPayload, AlertSender } from './types'

interface SlackConfig {
  webhookUrl: string
}

interface SlackBlock {
  type: string
  text?: {
    type: string
    text: string
    emoji?: boolean
  }
  elements?: Array<{
    type: string
    text?: string
    emoji?: boolean
  }>
  fields?: Array<{
    type: string
    text: string
  }>
}

interface SlackMessage {
  blocks?: SlackBlock[]
  attachments?: Array<{
    color: string
    blocks: SlackBlock[]
  }>
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}

function buildSlackMessage(payload: AlertPayload): SlackMessage {
  const isDown = payload.status === 'down'
  const emoji = isDown ? ':red_circle:' : ':large_green_circle:'
  const statusText = isDown ? 'DOWN' : 'RECOVERED'
  const color = isDown ? '#ef4444' : '#10b981'

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} Service ${statusText}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Service:*\n${payload.service.name}`,
        },
        {
          type: 'mrkdwn',
          text: `*Type:*\n${payload.service.type.toUpperCase()}`,
        },
        {
          type: 'mrkdwn',
          text: `*Status:*\n${statusText}`,
        },
        {
          type: 'mrkdwn',
          text: `*Response Time:*\n${payload.responseTimeMs}ms`,
        },
      ],
    },
  ]

  // Add URL/hostname if available
  const target = payload.service.url || payload.service.hostname
  if (target) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Target:* \`${target}\``,
      },
    })
  }

  // Add message/reason
  if (payload.message) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Message:*\n${payload.message}`,
      },
    })
  }

  // Add incident info for recovery
  if (!isDown && payload.incident?.duration_seconds) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Downtime Duration:* ${formatDuration(payload.incident.duration_seconds)}`,
      },
    })
  }

  // Add timestamp
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Detected at ${new Date(payload.timestamp).toLocaleString()}`,
      },
    ],
  })

  return {
    attachments: [
      {
        color,
        blocks,
      },
    ],
  }
}

export const sendSlack: AlertSender = async (channel, payload) => {
  const config = channel.config as unknown as SlackConfig

  if (!config.webhookUrl) {
    return { success: false, error: 'No Slack webhook URL configured' }
  }

  try {
    const message = buildSlackMessage(payload)

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
        error: `Slack returned ${response.status}: ${text}`,
      }
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}
