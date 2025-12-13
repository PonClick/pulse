import { z } from 'zod'

export const serviceTypes = ['http', 'tcp', 'ping', 'dns', 'docker', 'heartbeat', 'ssl'] as const
export type ServiceType = (typeof serviceTypes)[number]

// Base schema for all services
const baseServiceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(500).optional(),
  groupId: z.string().uuid().optional().nullable(),
  intervalSeconds: z.number().min(10).max(3600).default(60),
  timeoutSeconds: z.number().min(1).max(60).default(10),
  retries: z.number().min(0).max(5).default(0),
})

// HTTP specific
export const httpServiceSchema = baseServiceSchema.extend({
  type: z.literal('http'),
  url: z.string().url('Please enter a valid URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']).default('GET'),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
  expectedStatus: z.array(z.number()).default([200, 201, 204]),
  keyword: z.string().optional(),
  verifySsl: z.boolean().default(true),
})

// TCP specific
export const tcpServiceSchema = baseServiceSchema.extend({
  type: z.literal('tcp'),
  hostname: z.string().min(1, 'Hostname is required'),
  port: z.number().min(1).max(65535),
})

// Ping specific
export const pingServiceSchema = baseServiceSchema.extend({
  type: z.literal('ping'),
  hostname: z.string().min(1, 'Hostname is required'),
})

// DNS specific
export const dnsServiceSchema = baseServiceSchema.extend({
  type: z.literal('dns'),
  hostname: z.string().min(1, 'Hostname is required'),
  dnsRecordType: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS']).default('A'),
  dnsServer: z.string().default('1.1.1.1'),
  expectedValue: z.string().optional(),
})

// Docker specific
export const dockerServiceSchema = baseServiceSchema.extend({
  type: z.literal('docker'),
  dockerHost: z.string().min(1, 'Docker host is required'),
  containerName: z.string().min(1, 'Container name is required'),
})

// Heartbeat specific
export const heartbeatServiceSchema = baseServiceSchema.extend({
  type: z.literal('heartbeat'),
  // Heartbeat services receive pings, so minimal config
})

// SSL specific
export const sslServiceSchema = baseServiceSchema.extend({
  type: z.literal('ssl'),
  hostname: z.string().min(1, 'Hostname is required'),
  port: z.number().min(1).max(65535).default(443),
  sslExpiryWarningDays: z.number().min(1).max(365).default(30),
})

// Union schema for all service types
export const createServiceSchema = z.discriminatedUnion('type', [
  httpServiceSchema,
  tcpServiceSchema,
  pingServiceSchema,
  dnsServiceSchema,
  dockerServiceSchema,
  heartbeatServiceSchema,
  sslServiceSchema,
])

// Update schema - all fields optional for PATCH operations
export const updateServiceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).optional(),
  groupId: z.string().uuid().optional().nullable(),
  intervalSeconds: z.number().min(10).max(3600).optional(),
  timeoutSeconds: z.number().min(1).max(60).optional(),
  retries: z.number().min(0).max(5).optional(),
  // HTTP
  url: z.string().url().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
  expectedStatus: z.array(z.number()).optional(),
  keyword: z.string().optional(),
  verifySsl: z.boolean().optional(),
  // TCP/Ping/DNS
  hostname: z.string().optional(),
  port: z.number().min(1).max(65535).optional(),
  // DNS
  dnsRecordType: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS']).optional(),
  dnsServer: z.string().optional(),
  expectedValue: z.string().optional(),
  // Docker
  dockerHost: z.string().optional(),
  containerName: z.string().optional(),
  // SSL
  sslExpiryWarningDays: z.number().min(1).max(365).optional(),
})

export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
export type HttpServiceInput = z.infer<typeof httpServiceSchema>
export type TcpServiceInput = z.infer<typeof tcpServiceSchema>
export type PingServiceInput = z.infer<typeof pingServiceSchema>
export type DnsServiceInput = z.infer<typeof dnsServiceSchema>
export type DockerServiceInput = z.infer<typeof dockerServiceSchema>
export type HeartbeatServiceInput = z.infer<typeof heartbeatServiceSchema>
export type SslServiceInput = z.infer<typeof sslServiceSchema>
