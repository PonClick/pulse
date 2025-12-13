# Pulse

Self-hosted server monitoring dashboard. A clean, modern alternative to Uptime Kuma.

## Features

- **Multiple check types**: HTTP, TCP, Ping, DNS, Docker containers
- **Real-time dashboard**: Service status cards with sparkline graphs
- **Alert system**: Webhooks and email notifications (via Resend)
- **Incident management**: Automatic incident creation and resolution tracking
- **Self-hosted**: Run entirely on your own infrastructure
- **Dark theme**: Beautiful zinc-based dark UI

## Quick Start

### Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/maxponcin/pulse.git
cd pulse

# Start with Docker Compose
docker compose up -d

# Access at http://localhost:3000
```

### Development

```bash
# Install dependencies
npm install

# Start local Supabase (requires Docker)
npm run db:start

# Start development server
npm run dev

# Access at http://localhost:3000
```

## Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
# For development with local Supabase
npm run db:status  # Shows credentials after starting

# For Docker deployment
POSTGRES_PASSWORD=your-secure-password
RESEND_API_KEY=your-resend-key  # Optional, for email alerts
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  API Routes     │────▶│   PostgreSQL    │
│  (App Router)   │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │ polling (30s)         ▼
        │               ┌─────────────────┐
        └──────────────▶│  Health Check   │
                        │  Worker (cron)  │
                        └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │ Alert Senders   │
                        │ (webhook/email) │
                        └─────────────────┘
```

## Check Types

| Type | Description | Configuration |
|------|-------------|---------------|
| HTTP | HTTP/HTTPS endpoint monitoring | URL, method, expected status |
| TCP | TCP port connectivity | Hostname, port |
| Ping | ICMP ping | Hostname |
| DNS | DNS record resolution | Hostname, record type |
| Docker | Container status via Docker API | Container name, Docker host |
| Heartbeat | Passive check (external ping) | Heartbeat URL |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/services` | GET, POST | List/create services |
| `/api/services/[id]` | GET, PUT, DELETE | Manage service |
| `/api/services/[id]/heartbeats` | GET | Get heartbeat history |
| `/api/incidents` | GET | List incidents |
| `/api/alert-channels` | GET, POST | Manage alert channels |
| `/api/cron/check` | GET | Trigger health checks |
| `/api/health` | GET | App health check |

## Commands

```bash
# Development
npm run dev           # Start Next.js dev server
npm run build         # Production build
npm run start         # Start production server

# Database (local Supabase)
npm run db:start      # Start local Supabase
npm run db:stop       # Stop local Supabase
npm run db:status     # Show credentials
npm run db:types      # Regenerate TypeScript types
npm run db:migrate    # Apply migrations
npm run db:reset      # Reset database (deletes data!)

# Quality
npm run type-check    # TypeScript check
npm run lint          # ESLint
npm run test          # Jest tests
```

## Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| pulse | 3000 | Next.js application |
| postgres | 5432 | PostgreSQL database |
| cron | - | Health check scheduler |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL (Supabase local)
- **Language**: TypeScript (strict mode)
- **UI**: Custom components with Lucide icons

## License

MIT
