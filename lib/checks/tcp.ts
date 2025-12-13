import type { Service, CheckResult } from './types'
import * as net from 'net'

export async function checkTcp(service: Service): Promise<CheckResult> {
  const start = Date.now()
  const timeoutMs = (service.timeout_seconds || 10) * 1000

  return new Promise<CheckResult>((resolve) => {
    const socket = new net.Socket()

    const cleanup = (): void => {
      socket.removeAllListeners()
      socket.destroy()
    }

    socket.setTimeout(timeoutMs)

    socket.connect(service.port!, service.hostname!, () => {
      const responseTimeMs = Date.now() - start
      cleanup()
      resolve({
        status: 'up',
        responseTimeMs,
        message: 'Connection successful',
      })
    })

    socket.on('error', (err: Error) => {
      const responseTimeMs = Date.now() - start
      cleanup()
      resolve({
        status: 'down',
        responseTimeMs,
        message: err.message,
      })
    })

    socket.on('timeout', () => {
      const responseTimeMs = Date.now() - start
      cleanup()
      resolve({
        status: 'down',
        responseTimeMs,
        message: `Timeout after ${service.timeout_seconds}s`,
      })
    })
  })
}
