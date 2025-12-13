import type { Service, CheckResult } from './types'
import ping from 'ping'

export async function checkPing(service: Service): Promise<CheckResult> {
  const start = Date.now()
  const timeoutSeconds = service.timeout_seconds || 10

  try {
    const result = await ping.promise.probe(service.hostname!, {
      timeout: timeoutSeconds,
    })

    // ping library: time can be number (ms) or string 'unknown'
    const timeValue = result.time as unknown
    const responseTimeMs = typeof timeValue === 'number'
      ? Math.round(timeValue)
      : Date.now() - start

    if (result.alive) {
      return {
        status: 'up',
        responseTimeMs,
        message: 'Host is reachable',
      }
    }

    return {
      status: 'down',
      responseTimeMs: Date.now() - start,
      message: result.output || 'Host unreachable',
    }
  } catch (error) {
    const responseTimeMs = Date.now() - start
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      status: 'down',
      responseTimeMs,
      message: errorMessage,
    }
  }
}
