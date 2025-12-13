# Phase 10: Enhanced Service Management

> **Status:** Planning
> **Created:** 2025-12-13
> **Last Updated:** 2025-12-13

---

## Executive Summary

Phase 10 transforms Pulse from a basic monitoring tool into a comprehensive infrastructure management dashboard. Based on best practices from [Datadog](https://www.datadoghq.com/blog/datadog-resource-catalog/), [New Relic](https://docs.newrelic.com/docs/new-relic-solutions/best-practices-guides/full-stack-observability/infrastructure-monitoring-best-practices-guide/), and [Uptime Kuma](https://github.com/louislam/uptime-kuma/issues/2692), we're adding:

1. **Tags System** - Flexible, colorful categorization
2. **Extended Metadata** - Server, project, docs, git, owner, environment
3. **Table View** - Dense data comparison alongside card view
4. **Servers Entity** - Infrastructure-centric grouping

---

## Research Findings

### Best Practices Sources

| Source | Key Insight |
|--------|-------------|
| [Datadog Resource Catalog](https://docs.datadoghq.com/infrastructure/resource_catalog/) | Team and service tags provide context for incidents |
| [Lagnis Uptime Monitoring 2025](https://lagnis.com/blog/uptime-monitoring-best-practices-2025/) | Categorize by priority: critical, important, informational |
| [UX Planet Dashboard Design](https://uxplanet.org/10-rules-for-better-dashboard-design-ef68189d734c) | < 5 seconds to find information |
| [Table vs Card UX](https://medium.com/design-bootcamp/when-to-use-which-component-a-case-study-of-card-view-vs-table-view-7f5a6cff557b) | Tables for comparison & bulk actions, cards for rich content |
| [Uptime Kuma Tags](https://cloudpap.com/blog/edit-tags-in-uptime-kuma/) | Tags for filtering, groups for hierarchy |

### Industry Standard Metadata Fields

Based on Datadog, New Relic, and Splunk:

```
- owner/team        → Incident escalation & accountability
- environment       → prod/staging/dev filtering
- region/zone       → Geographic organization
- service           → Application grouping
- documentation_url → Quick access to runbooks
- repository_url    → Source code reference
- priority          → Alert escalation rules
```

---

## Feature Specifications

### 1. Tags System

#### Database Schema

```sql
-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#6b7280',  -- Hex color
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Junction table for many-to-many
CREATE TABLE service_tags (
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (service_id, tag_id)
);

-- Indexes for performance
CREATE INDEX idx_tags_user ON tags(user_id);
CREATE INDEX idx_tags_slug ON tags(user_id, slug);
CREATE INDEX idx_service_tags_service ON service_tags(service_id);
CREATE INDEX idx_service_tags_tag ON service_tags(tag_id);
```

#### Tag Features

| Feature | Description |
|---------|-------------|
| Color picker | 12 preset colors + custom hex |
| Auto-slug | Generate URL-safe slug from name |
| Bulk tagging | Select multiple services → add/remove tags |
| Tag filtering | Filter dashboard by one or multiple tags |
| Tag statistics | Show count of services per tag |
| Status page integration | Filter public status by tags |

#### Preset Tag Colors

```typescript
const TAG_COLORS = [
  { name: 'gray', hex: '#6b7280' },
  { name: 'red', hex: '#ef4444' },
  { name: 'orange', hex: '#f97316' },
  { name: 'amber', hex: '#f59e0b' },
  { name: 'yellow', hex: '#eab308' },
  { name: 'lime', hex: '#84cc16' },
  { name: 'green', hex: '#22c55e' },
  { name: 'emerald', hex: '#10b981' },
  { name: 'cyan', hex: '#06b6d4' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'violet', hex: '#8b5cf6' },
  { name: 'pink', hex: '#ec4899' },
]
```

#### UI Components

```
components/
├── tags/
│   ├── tag-badge.tsx          # Colored tag pill
│   ├── tag-selector.tsx       # Multi-select dropdown
│   ├── tag-manager.tsx        # CRUD modal for tags
│   ├── tag-filter.tsx         # Dashboard filter component
│   └── index.ts
```

---

### 2. Extended Service Metadata

#### Database Changes

```sql
-- Add new columns to services table
ALTER TABLE services ADD COLUMN environment VARCHAR(20) DEFAULT 'production';
ALTER TABLE services ADD COLUMN priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE services ADD COLUMN owner VARCHAR(100);
ALTER TABLE services ADD COLUMN team VARCHAR(100);
ALTER TABLE services ADD COLUMN project_url TEXT;
ALTER TABLE services ADD COLUMN docs_url TEXT;
ALTER TABLE services ADD COLUMN git_url TEXT;
ALTER TABLE services ADD COLUMN runbook_url TEXT;
ALTER TABLE services ADD COLUMN notes TEXT;
ALTER TABLE services ADD COLUMN server_id UUID REFERENCES servers(id) ON DELETE SET NULL;

-- Add index for environment filtering
CREATE INDEX idx_services_environment ON services(environment);
CREATE INDEX idx_services_priority ON services(priority);
CREATE INDEX idx_services_server ON services(server_id);
```

#### Metadata Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `environment` | enum | Deployment stage | `production`, `staging`, `development`, `testing` |
| `priority` | enum | Alert importance | `critical`, `high`, `normal`, `low` |
| `owner` | string | Responsible person | `max@lessclick.nl` |
| `team` | string | Responsible team | `Platform Team` |
| `project_url` | url | Project folder/management | `https://github.com/org/project` |
| `docs_url` | url | Documentation link | `https://docs.example.com/service` |
| `git_url` | url | Source repository | `https://github.com/org/repo` |
| `runbook_url` | url | Incident procedures | `https://wiki/runbooks/service` |
| `notes` | text | Free-form notes | Implementation details, quirks |
| `server_id` | uuid | Host server reference | FK to servers table |

#### Environment Colors

```typescript
const ENVIRONMENTS = {
  production: { label: 'Production', color: '#ef4444', icon: 'server' },
  staging: { label: 'Staging', color: '#f59e0b', icon: 'flask' },
  development: { label: 'Development', color: '#3b82f6', icon: 'code' },
  testing: { label: 'Testing', color: '#8b5cf6', icon: 'test-tube' },
}
```

#### Priority Levels

```typescript
const PRIORITIES = {
  critical: { label: 'Critical', color: '#ef4444', escalation: 'immediate' },
  high: { label: 'High', color: '#f97316', escalation: '5min' },
  normal: { label: 'Normal', color: '#6b7280', escalation: '15min' },
  low: { label: 'Low', color: '#3b82f6', escalation: '1hour' },
}
```

---

### 3. Table View

#### Design Rationale

Per [UX research](https://medium.com/design-bootcamp/when-to-use-which-component-a-case-study-of-card-view-vs-table-view-7f5a6cff557b):
- **Tables** excel at comparison, bulk actions, dense data
- **Cards** excel at visual scanning, rich content, mobile

We'll offer both with a toggle.

#### Table Columns

| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| Status | 40px | Yes | Up/Down/Pending icon |
| Name | flex | Yes | Service name + type icon |
| Response | 80px | Yes | Latest response time |
| Uptime | 80px | Yes | 24h uptime percentage |
| Environment | 100px | Yes | Environment badge |
| Server | 120px | Yes | Server name |
| Tags | 150px | No | Tag badges (max 3 + overflow) |
| Last Check | 120px | Yes | Relative time |
| Actions | 80px | No | Edit/Delete buttons |

#### Table Features

- **Sortable columns** - Click header to sort
- **Sticky header** - Always visible while scrolling
- **Row selection** - Checkbox for bulk actions
- **Row hover** - Highlight + quick actions
- **Expandable rows** - Click to show metadata
- **Pagination** - 25/50/100 per page options
- **Column visibility** - Toggle columns on/off

#### Component Structure

```
components/
├── dashboard/
│   ├── view-toggle.tsx        # Card/Table toggle
│   ├── service-table.tsx      # Table view component
│   ├── service-table-row.tsx  # Individual row
│   ├── table-header.tsx       # Sortable header
│   └── table-pagination.tsx   # Pagination controls
```

---

### 4. Servers Entity

#### Database Schema

```sql
CREATE TABLE servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  hostname VARCHAR(255),
  ip_address VARCHAR(45),  -- IPv4 or IPv6
  location VARCHAR(100),   -- e.g., "Amsterdam, NL"
  provider VARCHAR(50),    -- e.g., "Hetzner", "AWS", "On-premise"
  description TEXT,
  ssh_user VARCHAR(50),
  ssh_port INTEGER DEFAULT 22,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_servers_user ON servers(user_id);
```

#### Server Features

| Feature | Description |
|---------|-------------|
| Server list page | View all servers with service count |
| Server detail | List all services on that server |
| Quick filters | Filter dashboard by server |
| Server health | Aggregate status of all services |
| SSH quick connect | Copy SSH command to clipboard |

#### UI Pages

```
app/
├── servers/
│   ├── page.tsx           # Server list
│   └── [id]/
│       └── page.tsx       # Server detail with services
```

---

## Implementation Plan

### Phase 10.1: Database Migration (Day 1)

```
Tasks:
1. [ ] Create migration file for tags tables
2. [ ] Create migration file for servers table
3. [ ] Create migration file for services metadata columns
4. [ ] Generate updated TypeScript types
5. [ ] Update Zod validation schemas
```

### Phase 10.2: Tags System (Days 2-3)

```
Tasks:
1. [ ] Create tags API routes (CRUD)
2. [ ] Create service_tags API routes
3. [ ] Build TagBadge component
4. [ ] Build TagSelector (multi-select)
5. [ ] Build TagManager modal
6. [ ] Add tags to AddServiceModal
7. [ ] Add tags to EditServiceModal
8. [ ] Add tag filtering to dashboard
9. [ ] Update useServices hook for tags
```

### Phase 10.3: Extended Metadata (Day 4)

```
Tasks:
1. [ ] Update AddServiceModal with metadata fields
2. [ ] Update EditServiceModal with metadata fields
3. [ ] Add environment/priority badges to ServiceCard
4. [ ] Add metadata display to service detail page
5. [ ] Add quick links (docs, git, runbook) icons
```

### Phase 10.4: Table View (Days 5-6)

```
Tasks:
1. [ ] Build ViewToggle component
2. [ ] Build ServiceTable component
3. [ ] Build TableHeader with sorting
4. [ ] Build TableRow with expand/collapse
5. [ ] Add pagination component
6. [ ] Persist view preference (localStorage)
7. [ ] Mobile: auto-switch to card view
```

### Phase 10.5: Servers Entity (Days 7-8)

```
Tasks:
1. [ ] Create servers API routes (CRUD)
2. [ ] Build servers list page
3. [ ] Build server detail page
4. [ ] Build AddServerModal
5. [ ] Add server selector to AddServiceModal
6. [ ] Add server filter to dashboard
7. [ ] Add server column to table view
```

### Phase 10.6: Polish & Testing (Day 9-10)

```
Tasks:
1. [ ] Write Playwright E2E tests
2. [ ] Test bulk tagging workflow
3. [ ] Test table sorting/pagination
4. [ ] Mobile responsive testing
5. [ ] Update documentation
6. [ ] Update STATUS.md
```

---

## API Endpoints

### Tags API

```
GET    /api/tags              # List all tags
POST   /api/tags              # Create tag
GET    /api/tags/:id          # Get single tag
PUT    /api/tags/:id          # Update tag
DELETE /api/tags/:id          # Delete tag

POST   /api/services/:id/tags # Add tags to service
DELETE /api/services/:id/tags # Remove tags from service
```

### Servers API

```
GET    /api/servers           # List all servers
POST   /api/servers           # Create server
GET    /api/servers/:id       # Get single server (with services)
PUT    /api/servers/:id       # Update server
DELETE /api/servers/:id       # Delete server
```

---

## UI Mockups

### Dashboard with Tags Filter

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔍 Search...  │ Status ▼ │ Type ▼ │ Env ▼ │ Server ▼ │ 📊 │ 📋 │   │
├─────────────────────────────────────────────────────────────────────┤
│ Tags: [production] [api] [critical] [×clear]                        │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│ │ ● N8N API   │ │ ● Redis     │ │ ○ Postgres  │ │ ● Nginx     │    │
│ │ prod │ api  │ │ prod │ cache│ │ prod │ db   │ │ prod │ web  │    │
│ │ 142ms  100% │ │ 2ms    99.9%│ │ DOWN   85%  │ │ 5ms   100%  │    │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Table View

```
┌────┬─────────────────────┬──────────┬────────┬──────────┬──────────┐
│ ✓  │ Name                │ Response │ Uptime │ Env      │ Tags     │
├────┼─────────────────────┼──────────┼────────┼──────────┼──────────┤
│ ☐  │ ● N8N API           │ 142ms    │ 100%   │ 🔴 prod  │ api, ... │
│ ☐  │ ● Redis Cache       │ 2ms      │ 99.9%  │ 🔴 prod  │ cache    │
│ ☐  │ ○ PostgreSQL        │ timeout  │ 85%    │ 🔴 prod  │ db       │
│ ☐  │ ● Nginx Proxy       │ 5ms      │ 100%   │ 🟡 stage │ web      │
└────┴─────────────────────┴──────────┴────────┴──────────┴──────────┘
│ ◀ │ Page 1 of 2 │ ▶ │                      │ Showing 25 │ ▼ │
```

### Service Card with Metadata

```
┌─────────────────────────────────────────┐
│ ● N8N Automation Platform               │
│ [production] [critical]                 │
│ ─────────────────────────────────────── │
│ Response: 142ms    Uptime: 100%         │
│ ▂▃▅▆▇█▇▆▅▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂ (24h)        │
│ ─────────────────────────────────────── │
│ 🏷️ api  automation  workflow            │
│ 🖥️ vps-prod-01  📄 Docs  📂 Git         │
└─────────────────────────────────────────┘
```

---

## File Changes Summary

### New Files

```
app/
├── servers/
│   ├── page.tsx
│   └── [id]/page.tsx
├── api/
│   ├── tags/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   └── servers/
│       ├── route.ts
│       └── [id]/route.ts

components/
├── tags/
│   ├── tag-badge.tsx
│   ├── tag-selector.tsx
│   ├── tag-manager.tsx
│   ├── tag-filter.tsx
│   └── index.ts
├── servers/
│   ├── server-card.tsx
│   ├── server-selector.tsx
│   ├── add-server-modal.tsx
│   └── index.ts
├── dashboard/
│   ├── view-toggle.tsx
│   ├── service-table.tsx
│   └── table-pagination.tsx

lib/
├── hooks/
│   ├── use-tags.ts
│   └── use-servers.ts

supabase/migrations/
├── 005_tags_system.sql
├── 006_servers_table.sql
└── 007_service_metadata.sql
```

### Modified Files

```
components/
├── dashboard/
│   ├── service-card.tsx      # Add tags, env, server display
│   ├── service-grid.tsx      # Add view toggle integration
│   └── sidebar.tsx           # Add Servers nav item
├── services/
│   ├── add-service-modal.tsx # Add metadata fields
│   └── edit-service-modal.tsx

lib/
├── hooks/use-services.ts     # Add tag/server filtering
├── validations/service.ts    # Add metadata validation
└── supabase/database.types.ts
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Tag creation time | < 3 seconds |
| Filter response time | < 500ms |
| Table render (100 services) | < 1 second |
| Mobile usability score | > 90 (Lighthouse) |

---

## Dependencies

No new npm packages required. Using existing:
- `@supabase/ssr` - Database
- `lucide-react` - Icons
- `zod` - Validation
- Tailwind CSS - Styling

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex tag filtering | Slow queries | Add proper indexes, limit tag count |
| Table performance | Slow with many services | Virtual scrolling, pagination |
| Migration breaks existing data | Data loss | Backup before migration, test locally |

---

## References

- [Datadog Resource Catalog](https://docs.datadoghq.com/infrastructure/resource_catalog/)
- [New Relic Infrastructure Best Practices](https://docs.newrelic.com/docs/new-relic-solutions/best-practices-guides/full-stack-observability/infrastructure-monitoring-best-practices-guide/)
- [Uptime Monitoring Best Practices 2025](https://lagnis.com/blog/uptime-monitoring-best-practices-2025/)
- [Table vs Card UX Patterns](https://medium.com/design-bootcamp/when-to-use-which-component-a-case-study-of-card-view-vs-table-view-7f5a6cff557b)
- [Dashboard UX Design Tips](https://uxplanet.org/10-rules-for-better-dashboard-design-ef68189d734c)
