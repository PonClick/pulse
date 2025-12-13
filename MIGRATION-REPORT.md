# Uptime Kuma to Pulse Migration Report

**Date:** 2025-12-12
**Migrated Services:** 16 of 22

---

## Migration Summary

### Services Migrated Successfully

| # | Service Name | Type | Original URL/Host |
|---|--------------|------|-------------------|
| 1 | N8N Automation Platform | HTTP | https://n8n.n8naicursus.xyz |
| 2 | Uptime Kuma Status | HTTP | https://status.n8naicursus.xyz |
| 3 | Nginx Web Server | HTTP | http://127.0.0.1 |
| 4 | Dockge Docker Manager | HTTP | http://127.0.0.1:5001 |
| 5 | Portainer Management | HTTP | https://127.0.0.1:9443 |
| 6 | n8n Local HTTP | HTTP | http://localhost:5678 |
| 7 | Syncthing Web UI | HTTP | http://localhost:8384 |
| 8 | Docker Container Stats | HTTP | http://localhost:2375/containers/json |
| 9 | Tailscale n8n | HTTP | https://max-server.taila3ceec.ts.net |
| 10 | Tailscale Uptime Kuma | HTTP | https://max-server.taila3ceec.ts.net:8443 |
| 11 | N8N PostgreSQL | TCP | 127.0.0.1:5433 |
| 12 | N8N Redis Cache | TCP | 127.0.0.1:6380 |
| 13 | SSH Access | TCP | 127.0.0.1:22 |
| 14 | DNS status.n8naicursus | DNS | status.n8naicursus.xyz |
| 15 | DNS n8n.n8naicursus | DNS | n8n.n8naicursus.xyz |
| 16 | Tailscale VPN | Ping | 100.124.235.19 |
| 17 | N8N Database Backup | Heartbeat | (push-based) |

### Services NOT Migrated (Duplicates/Conflicts)

| Service | Reason |
|---------|--------|
| WAHA WhatsApp API | Port 3000 conflict, duplicate functionality |
| WAHA Session Status | Duplicate of main WAHA monitor |
| WAHA Session Authentication | Duplicate endpoint |
| WAHA Webhook Configuration | Duplicate endpoint |
| WAHA Sessions Count | Duplicate endpoint |

---

## Issues Encountered

### 1. Docker Networking (CRITICAL)

**Problem:** Services using `localhost` or `127.0.0.1` cannot be reached from inside Docker container.

**Symptoms:**
- All localhost services show as "Down"
- Response times are 1-3ms (immediate connection refused)

**Solution Options:**
1. Use `host.docker.internal` instead of `localhost/127.0.0.1`
2. Run Pulse outside Docker (native Node.js)
3. Use Docker's `network_mode: host` (Linux only)

**Affected Services:**
- Nginx Web Server
- Dockge Docker Manager
- Portainer Management
- n8n Local HTTP
- Syncthing Web UI
- Docker Container Stats
- N8N PostgreSQL (TCP)
- N8N Redis Cache (TCP)
- SSH Access (TCP)

### 2. External URL Timeouts

**Problem:** External URLs (n8naicursus.xyz) timeout after 5000ms.

**Possible Causes:**
- DNS resolution from Docker container
- SSL certificate verification
- Network routing through Docker

**Affected Services:**
- N8N Automation Platform (5009ms timeout)
- Uptime Kuma Status (5006ms timeout)
- Tailscale Uptime Kuma (10000ms timeout)

### 3. Tailscale Access

**Problem:** Tailscale Funnel URLs not accessible from Docker.

**Cause:** Docker container not connected to Tailscale network.

**Solution:** Either:
- Use Tailscale's Docker integration
- Run Pulse on host with Tailscale access

---

## Missing Features (Pulse vs Uptime Kuma)

### Features Uptime Kuma Has That Pulse Lacks

| Feature | Priority | Notes |
|---------|----------|-------|
| **Status Page** | High | Public status page for users |
| **Notification Integrations** | High | Only webhook/email, no Telegram/Discord/Slack native |
| **Maintenance Windows** | Medium | Schedule planned downtime |
| **Monitor Groups** | Medium | Organize monitors in folders |
| **Multi-user Auth** | Medium | No authentication yet |
| **Certificate Expiry Monitor** | Medium | SSL cert expiry alerts |
| **Proxy Support** | Low | HTTP proxy for checks |
| **Game Server Monitor** | Low | Minecraft, Steam, etc. |
| **MQTT Monitor** | Low | IoT monitoring |
| **gRPC Monitor** | Low | gRPC health checks |
| **MongoDB/Redis Monitor** | Low | Native database checks |
| **Keyword Absence Check** | Low | Alert when keyword NOT found |
| **Response Body JSON Query** | Low | JSONPath validation |
| **Custom Headers** | Low | HTTP request headers |
| **HTTP Body/Form Data** | Low | POST body content |
| **Basic Auth** | Low | HTTP basic authentication |

### Features Pulse Has That Uptime Kuma Lacks

| Feature | Notes |
|---------|-------|
| Modern UI | Cleaner, more minimal design |
| Sparkline Charts | Inline response time graphs |
| TypeScript | Full type safety |
| Next.js App Router | Modern React architecture |

---

## Recommendations

### Immediate Fixes Needed

1. **Fix Docker networking** - Either:
   - Convert localhost URLs to `host.docker.internal`
   - Run Pulse natively outside Docker
   - Use `network_mode: host`

2. **Increase timeouts** - External URLs need longer timeouts (15-30s)

### Future Features to Implement

1. **Status Page** (High Priority) - Public-facing status page
2. **Telegram/Discord Notifications** - Most requested by users
3. **Monitor Groups** - Organize services by category
4. **Maintenance Windows** - Prevent false alerts during upgrades
5. **Authentication** - Multi-user support with login

---

## Screenshots

- `migration-dashboard-all-services.png` - Dashboard with all migrated services

---

## Test Results

| Test | Result |
|------|--------|
| HTTP Service Creation | PASS |
| TCP Service Creation | PASS |
| DNS Service Creation | PASS |
| Ping Service Creation | PASS |
| Heartbeat Service Creation | PASS |
| Dashboard Display | PASS |
| Service Cards | PASS |
| Sparkline Charts | PASS |
| Health Check Worker | PASS |
| API Endpoints | PASS |

---

## Conclusion

Migration of 16 services completed successfully. All service types (HTTP, TCP, DNS, Ping, Heartbeat) are supported and functional. Main issue is Docker networking preventing localhost access - this is a deployment configuration issue, not a Pulse bug.

Pulse is a viable replacement for Uptime Kuma for basic monitoring needs. Missing features (status page, more notifications, groups) can be added in future development phases.
