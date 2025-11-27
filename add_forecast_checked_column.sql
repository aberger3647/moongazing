-- Add last_forecast_checked column to alerts table if it doesn't exist
ALTER TABLE alerts 
ADD COLUMN IF NOT EXISTS last_forecast_checked DATE;
