-- Migration: 004_ssl_monitor
-- Description: Add SSL certificate monitoring support
-- Date: 2025-12-12

-- Add SSL expiry warning days column to services table
ALTER TABLE services ADD COLUMN ssl_expiry_warning_days INTEGER DEFAULT 30;

-- Comment on column
COMMENT ON COLUMN services.ssl_expiry_warning_days IS 'Days before SSL certificate expiry to trigger warning alert';
