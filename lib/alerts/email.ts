import { Resend } from 'resend'
import type { AlertChannel, AlertPayload, AlertSender } from './types'

interface EmailConfig {
  to: string | string[]
  from?: string
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export const sendEmail: AlertSender = async (channel, payload) => {
  if (!resend) {
    return { success: false, error: 'Resend API key not configured' }
  }

  const config = channel.config as unknown as EmailConfig

  if (!config.to) {
    return { success: false, error: 'No email recipient configured' }
  }

  const isDown = payload.status === 'down'
  const serviceName = payload.service.name
  const serviceUrl = payload.service.url || payload.service.hostname || 'N/A'

  const subject = isDown
    ? `🔴 Service Down: ${serviceName}`
    : `🟢 Service Recovered: ${serviceName}`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${isDown ? '#ef4444' : '#10b981'}; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">
          ${isDown ? '🔴 Service Down' : '🟢 Service Recovered'}
        </h1>
      </div>

      <div style="padding: 20px; background: #18181b; color: #fff;">
        <h2 style="margin: 0 0 20px; color: #fff;">${serviceName}</h2>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #a1a1aa;">Status</td>
            <td style="padding: 10px 0; color: ${isDown ? '#ef4444' : '#10b981'}; text-align: right;">
              ${isDown ? 'Down' : 'Up'}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #a1a1aa;">URL</td>
            <td style="padding: 10px 0; color: #fff; text-align: right;">${serviceUrl}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #a1a1aa;">Response Time</td>
            <td style="padding: 10px 0; color: #fff; text-align: right;">${payload.responseTimeMs}ms</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #a1a1aa;">Message</td>
            <td style="padding: 10px 0; color: #fff; text-align: right;">${payload.message}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #a1a1aa;">Time</td>
            <td style="padding: 10px 0; color: #fff; text-align: right;">
              ${new Date(payload.timestamp).toLocaleString()}
            </td>
          </tr>
          ${payload.incident?.duration_seconds ? `
          <tr>
            <td style="padding: 10px 0; color: #a1a1aa;">Downtime</td>
            <td style="padding: 10px 0; color: #fff; text-align: right;">
              ${formatDuration(payload.incident.duration_seconds)}
            </td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div style="padding: 15px; background: #09090b; color: #a1a1aa; text-align: center; font-size: 12px;">
        Sent by Pulse Server Monitor
      </div>
    </div>
  `

  try {
    const { error } = await resend.emails.send({
      from: config.from || 'Pulse <alerts@pulse.local>',
      to: Array.isArray(config.to) ? config.to : [config.to],
      subject,
      html,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}
