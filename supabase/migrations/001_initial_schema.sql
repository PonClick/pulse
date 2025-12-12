-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE TABLE heartbeats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  response_time_ms INTEGER,
  status_code INTEGER,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_heartbeats_service_created
ON heartbeats(service_id, created_at DESC);

-- Incidents table
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  cause TEXT,
  resolution TEXT,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ
);

-- Alert channels table
CREATE TABLE alert_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service to alert channel relation
CREATE TABLE service_alert_channels (
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  alert_channel_id UUID REFERENCES alert_channels(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, alert_channel_id)
);

-- Enable Row Level Security
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_alert_channels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services
CREATE POLICY "Users can view own services" ON services
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own services" ON services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services" ON services
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own services" ON services
  FOR DELETE USING (auth.uid() = user_id);

-- Public services can be viewed by anyone
CREATE POLICY "Public services are viewable by all" ON services
  FOR SELECT USING (is_public = true);

-- RLS Policies for heartbeats
CREATE POLICY "Users can view heartbeats for own services" ON heartbeats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = heartbeats.service_id
      AND services.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert heartbeats for own services" ON heartbeats
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = heartbeats.service_id
      AND services.user_id = auth.uid()
    )
  );

-- Public service heartbeats can be viewed by anyone
CREATE POLICY "Public service heartbeats are viewable by all" ON heartbeats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = heartbeats.service_id
      AND services.is_public = true
    )
  );

-- RLS Policies for incidents
CREATE POLICY "Users can view incidents for own services" ON incidents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = incidents.service_id
      AND services.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert incidents for own services" ON incidents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = incidents.service_id
      AND services.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update incidents for own services" ON incidents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = incidents.service_id
      AND services.user_id = auth.uid()
    )
  );

-- Public service incidents can be viewed by anyone
CREATE POLICY "Public service incidents are viewable by all" ON incidents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = incidents.service_id
      AND services.is_public = true
    )
  );

-- RLS Policies for alert_channels
CREATE POLICY "Users can view own alert channels" ON alert_channels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert channels" ON alert_channels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert channels" ON alert_channels
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alert channels" ON alert_channels
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for service_alert_channels
CREATE POLICY "Users can view service alert channels for own services" ON service_alert_channels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = service_alert_channels.service_id
      AND services.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert service alert channels for own services" ON service_alert_channels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = service_alert_channels.service_id
      AND services.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete service alert channels for own services" ON service_alert_channels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = service_alert_channels.service_id
      AND services.user_id = auth.uid()
    )
  );

-- Service status view
CREATE VIEW service_status AS
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
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
