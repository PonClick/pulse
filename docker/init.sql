-- Pulse Database Schema (Standalone PostgreSQL)
-- This schema is for self-hosted deployments without Supabase auth

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  url VARCHAR(500),
  hostname VARCHAR(255),
  port INTEGER,
  method VARCHAR(10) DEFAULT 'GET',
  headers JSONB DEFAULT '{}',
  body TEXT,
  expected_status INTEGER[] DEFAULT '{200,201,204}',
  keyword VARCHAR(255),
  json_path VARCHAR(255),
  expected_value VARCHAR(255),
  dns_record_type VARCHAR(10),
  dns_server VARCHAR(255) DEFAULT '1.1.1.1',
  docker_host VARCHAR(255),
  container_name VARCHAR(255),
  interval_seconds INTEGER DEFAULT 60,
  timeout_seconds INTEGER DEFAULT 10,
  retries INTEGER DEFAULT 0,
  verify_ssl BOOLEAN DEFAULT true,
  ssl_expiry_alert_days INTEGER DEFAULT 14,
  is_active BOOLEAN DEFAULT true,
  is_paused BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[],
  next_check TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Heartbeats table
CREATE TABLE IF NOT EXISTS heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  response_time_ms INTEGER,
  status_code INTEGER,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_heartbeats_service_created
ON heartbeats(service_id, created_at DESC);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  cause TEXT,
  resolution TEXT,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ
);

-- Alert channels table
CREATE TABLE IF NOT EXISTS alert_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service to alert channel relation
CREATE TABLE IF NOT EXISTS service_alert_channels (
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  alert_channel_id UUID REFERENCES alert_channels(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, alert_channel_id)
);

-- Service status view
CREATE OR REPLACE VIEW service_status AS
SELECT
  s.id,
  s.name,
  s.type,
  s.is_public,
  h.status,
  h.response_time_ms,
  h.created_at as last_check,
  (
    SELECT COUNT(*) FILTER (WHERE status = 'up') * 100.0 / NULLIF(COUNT(*), 0)
    FROM heartbeats
    WHERE service_id = s.id
    AND created_at > NOW() - INTERVAL '24 hours'
  ) as uptime_24h
FROM services s
LEFT JOIN LATERAL (
  SELECT * FROM heartbeats
  WHERE service_id = s.id
  ORDER BY created_at DESC
  LIMIT 1
) h ON true;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for services updated_at
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for faster service lookups
CREATE INDEX IF NOT EXISTS idx_services_next_check ON services(next_check) WHERE is_active = true AND is_paused = false;
CREATE INDEX IF NOT EXISTS idx_incidents_service_id ON incidents(service_id);
CREATE INDEX IF NOT EXISTS idx_incidents_ended_at ON incidents(ended_at) WHERE ended_at IS NULL;
