import type { Service, CheckResult } from './types'
import dns from 'dns/promises'

type DnsRecordType = 'A' | 'AAAA' | 'MX' | 'TXT' | 'CNAME' | 'NS'

export async function checkDns(service: Service): Promise<CheckResult> {
  const start = Date.now()
  const hostname = service.hostname
  const recordType = (service.dns_record_type as DnsRecordType) || 'A'
  const expectedValue = service.expected_value

  if (!hostname) {
    return {
      status: 'down',
      responseTimeMs: 0,
      message: 'No hostname specified',
    }
  }

  // Configure custom DNS server if specified
  const resolver = new dns.Resolver()
  if (service.dns_server) {
    resolver.setServers([service.dns_server])
  }

  try {
    let records: string[]

    switch (recordType) {
      case 'A':
        records = await resolver.resolve4(hostname)
        break
      case 'AAAA':
        records = await resolver.resolve6(hostname)
        break
      case 'MX':
        const mxRecords = await resolver.resolveMx(hostname)
        records = mxRecords.map(r => `${r.priority} ${r.exchange}`)
        break
      case 'TXT':
        const txtRecords = await resolver.resolveTxt(hostname)
        records = txtRecords.map(r => r.join(''))
        break
      case 'CNAME':
        records = await resolver.resolveCname(hostname)
        break
      case 'NS':
        records = await resolver.resolveNs(hostname)
        break
      default:
        records = await resolver.resolve4(hostname)
    }

    const responseTimeMs = Date.now() - start

    // Check if expected value matches
    if (expectedValue) {
      const found = records.some(r =>
        r.toLowerCase().includes(expectedValue.toLowerCase())
      )
      if (!found) {
        return {
          status: 'down',
          responseTimeMs,
          message: `Expected "${expectedValue}" not found in records: ${records.join(', ')}`,
        }
      }
    }

    return {
      status: 'up',
      responseTimeMs,
      message: `${recordType}: ${records.join(', ')}`,
    }
  } catch (error) {
    const responseTimeMs = Date.now() - start
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Handle specific DNS errors
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ENODATA')) {
      return {
        status: 'down',
        responseTimeMs,
        message: `No ${recordType} records found for ${hostname}`,
      }
    }

    if (errorMessage.includes('ETIMEOUT')) {
      return {
        status: 'down',
        responseTimeMs,
        message: 'DNS query timed out',
      }
    }

    return {
      status: 'down',
      responseTimeMs,
      message: errorMessage,
    }
  }
}
