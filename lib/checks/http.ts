import type { Service, CheckResult } from './types'

export async function checkHttp(service: Service): Promise<CheckResult> {
  const start = Date.now()
  const timeoutMs = (service.timeout_seconds || 10) * 1000

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(service.url!, {
      method: service.method || 'GET',
      headers: service.headers as Record<string, string> || {},
      body: service.method !== 'GET' && service.method !== 'HEAD' ? service.body || undefined : undefined,
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeoutId)
    const responseTimeMs = Date.now() - start

    // Check status code
    const expectedStatus = service.expected_status || [200, 201, 204]
    const statusOk = expectedStatus.includes(response.status)

    // Check keyword if specified
    let keywordOk = true
    if (service.keyword && statusOk) {
      const text = await response.text()
      keywordOk = text.includes(service.keyword)
    }

    const isUp = statusOk && keywordOk

    return {
      status: isUp ? 'up' : 'down',
      responseTimeMs,
      statusCode: response.status,
      message: isUp
        ? 'OK'
        : !statusOk
          ? `Unexpected status: ${response.status}`
          : `Keyword "${service.keyword}" not found`,
    }
  } catch (error) {
    const responseTimeMs = Date.now() - start
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Handle specific error types
    if (errorMessage.includes('abort')) {
      return {
        status: 'down',
        responseTimeMs,
        message: `Timeout after ${service.timeout_seconds}s`,
      }
    }

    return {
      status: 'down',
      responseTimeMs,
      message: errorMessage,
    }
  }
}
