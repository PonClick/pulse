-- Migration: 003_maintenance_windows
-- Description: Add maintenance windows support for scheduled downtime
-- Date: 2025-12-12

-- Create maintenance_windows table
CREATE TABLE maintenance_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure end_time is after start_time
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Index for efficient querying of active maintenance windows
CREATE INDEX idx_maintenance_windows_service ON maintenance_windows(service_id);
CREATE INDEX idx_maintenance_windows_time ON maintenance_windows(start_time, end_time);
CREATE INDEX idx_maintenance_windows_active ON maintenance_windows(service_id, start_time, end_time);

-- Function to check if a service is in maintenance
CREATE OR REPLACE FUNCTION is_service_in_maintenance(p_service_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM maintenance_windows
    WHERE service_id = p_service_id
      AND NOW() BETWEEN start_time AND end_time
  );
END;
$$ LANGUAGE plpgsql;

-- Optional: Add trigger for updated_at
CREATE TRIGGER update_maintenance_windows_updated_at
  BEFORE UPDATE ON maintenance_windows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment on table
COMMENT ON TABLE maintenance_windows IS 'Scheduled maintenance windows for services - alerts are suppressed during these periods';
