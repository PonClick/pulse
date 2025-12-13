import { NextResponse } from 'next/server'

/**
 * Health check endpoint for container orchestration
 * GET /api/health
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
  })
}
