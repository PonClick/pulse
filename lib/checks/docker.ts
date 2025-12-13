import type { Service, CheckResult } from './types'

/**
 * Check Docker container status via Docker socket or TCP
 * Requires access to Docker socket or remote Docker API
 */
export async function checkDocker(service: Service): Promise<CheckResult> {
  const start = Date.now()
  const containerName = service.container_name
  const dockerHost = service.docker_host || 'http://localhost:2375'

  if (!containerName) {
    return {
      status: 'down',
      responseTimeMs: 0,
      message: 'No container name specified',
    }
  }

  try {
    // Try to get container status via Docker API
    const url = `${dockerHost}/containers/${containerName}/json`

    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      (service.timeout_seconds || 10) * 1000
    )

    const response = await fetch(url, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const responseTimeMs = Date.now() - start

    if (!response.ok) {
      if (response.status === 404) {
        return {
          status: 'down',
          responseTimeMs,
          message: `Container "${containerName}" not found`,
        }
      }
      return {
        status: 'down',
        responseTimeMs,
        message: `Docker API error: ${response.status}`,
      }
    }

    const container = await response.json()
    const state = container.State

    // Check if container is running
    if (state.Running) {
      // Check if container is healthy (if health check is configured)
      if (state.Health) {
        const healthStatus = state.Health.Status
        if (healthStatus === 'healthy') {
          return {
            status: 'up',
            responseTimeMs,
            message: 'Container running and healthy',
          }
        } else if (healthStatus === 'unhealthy') {
          return {
            status: 'down',
            responseTimeMs,
            message: 'Container running but unhealthy',
          }
        }
        // starting status
        return {
          status: 'up',
          responseTimeMs,
          message: `Container running (health: ${healthStatus})`,
        }
      }

      return {
        status: 'up',
        responseTimeMs,
        message: 'Container running',
      }
    }

    // Container not running
    const exitCode = state.ExitCode
    return {
      status: 'down',
      responseTimeMs,
      message: `Container stopped (exit code: ${exitCode})`,
    }
  } catch (error) {
    const responseTimeMs = Date.now() - start
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('abort')) {
      return {
        status: 'down',
        responseTimeMs,
        message: 'Docker API timeout',
      }
    }

    if (errorMessage.includes('ECONNREFUSED')) {
      return {
        status: 'down',
        responseTimeMs,
        message: 'Cannot connect to Docker daemon',
      }
    }

    return {
      status: 'down',
      responseTimeMs,
      message: errorMessage,
    }
  }
}
