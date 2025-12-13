import type { AlertChannel, AlertPayload, AlertSender } from './types'

interface WebhookConfig {
  url: string
  method?: 'POST' | 'GET'
  headers?: Record<string, string>
}

export const sendWebhook: AlertSender = async (channel, payload) => {
  const config = channel.config as unknown as WebhookConfig

  if (!config.url) {
    return { success: false, error: 'No webhook URL configured' }
  }

  try {
    const body = {
      event: payload.status === 'down' ? 'service.down' : 'service.up',
      service: {
        id: payload.service.id,
        name: payload.service.name,
        type: payload.service.type,
        url: payload.service.url || payload.service.hostname,
      },
      status: payload.status,
      message: payload.message,
      responseTimeMs: payload.responseTimeMs,
      timestamp: payload.timestamp,
      incident: payload.incident ? {
        id: payload.incident.id,
        startedAt: payload.incident.started_at,
        endedAt: payload.incident.ended_at,
        durationSeconds: payload.incident.duration_seconds,
      } : undefined,
    }

    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Webhook returned ${response.status}: ${response.statusText}`,
      }
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}
