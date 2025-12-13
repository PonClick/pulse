import * as tls from 'tls'
import type { Service, CheckResult } from './types'

export interface SSLCheckResult extends CheckResult {
  certificate?: {
    subject: string
    issuer: string
    validFrom: string
    validTo: string
    daysUntilExpiry: number
    serialNumber: string
  }
}

/**
 * Check SSL certificate validity and expiry
 */
export async function checkSsl(service: Service): Promise<SSLCheckResult> {
  const start = Date.now()
  const timeoutMs = (service.timeout_seconds || 10) * 1000
  const hostname = service.hostname || ''
  const port = service.port || 443
  const expiryWarningDays = service.ssl_expiry_warning_days ?? 30

  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: hostname,
        port: port,
        servername: hostname,
        rejectUnauthorized: false, // We want to check even invalid certs
        timeout: timeoutMs,
      },
      () => {
        const responseTimeMs = Date.now() - start
        const cert = socket.getPeerCertificate()

        if (!cert || Object.keys(cert).length === 0) {
          socket.end()
          resolve({
            status: 'down',
            responseTimeMs,
            message: 'No certificate found',
          })
          return
        }

        const validFrom = new Date(cert.valid_from)
        const validTo = new Date(cert.valid_to)
        const now = new Date()
        const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        // Check if certificate is currently valid
        const isValid = now >= validFrom && now <= validTo

        // Check if certificate is expiring soon
        const isExpiringSoon = daysUntilExpiry <= expiryWarningDays

        socket.end()

        if (!isValid) {
          resolve({
            status: 'down',
            responseTimeMs,
            message: now < validFrom
              ? `Certificate not yet valid (starts ${validFrom.toISOString()})`
              : `Certificate expired on ${validTo.toISOString()}`,
            certificate: {
              subject: cert.subject?.CN || 'Unknown',
              issuer: cert.issuer?.CN || 'Unknown',
              validFrom: validFrom.toISOString(),
              validTo: validTo.toISOString(),
              daysUntilExpiry,
              serialNumber: cert.serialNumber || 'Unknown',
            },
          })
          return
        }

        if (isExpiringSoon) {
          resolve({
            status: 'down',
            responseTimeMs,
            message: `Certificate expires in ${daysUntilExpiry} days (warning threshold: ${expiryWarningDays} days)`,
            certificate: {
              subject: cert.subject?.CN || 'Unknown',
              issuer: cert.issuer?.CN || 'Unknown',
              validFrom: validFrom.toISOString(),
              validTo: validTo.toISOString(),
              daysUntilExpiry,
              serialNumber: cert.serialNumber || 'Unknown',
            },
          })
          return
        }

        resolve({
          status: 'up',
          responseTimeMs,
          message: `Certificate valid for ${daysUntilExpiry} days`,
          certificate: {
            subject: cert.subject?.CN || 'Unknown',
            issuer: cert.issuer?.CN || 'Unknown',
            validFrom: validFrom.toISOString(),
            validTo: validTo.toISOString(),
            daysUntilExpiry,
            serialNumber: cert.serialNumber || 'Unknown',
          },
        })
      }
    )

    socket.on('error', (error) => {
      const responseTimeMs = Date.now() - start
      socket.destroy()
      resolve({
        status: 'down',
        responseTimeMs,
        message: error.message || 'Connection failed',
      })
    })

    socket.on('timeout', () => {
      const responseTimeMs = Date.now() - start
      socket.destroy()
      resolve({
        status: 'down',
        responseTimeMs,
        message: `Timeout after ${service.timeout_seconds}s`,
      })
    })
  })
}
