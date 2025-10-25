-- Update the get_places RPC to query dark_sky_places
DROP FUNCTION IF EXISTS get_places(double precision, double precision, double precision, integer);
DROP FUNCTION IF EXISTS get_places(numeric, numeric, integer, integer);
CREATE OR REPLACE FUNCTION get_places(p_lat double precision, p_lng double precision, p_radius double precision, p_limit_rows integer) RETURNS TABLE(id bigint, place_name text, category text, lat decimal, lng decimal, distance double precision) AS $$
SELECT id, place_name, category, lat, lng,
       (6371000 * acos(cos(radians(p_lat)) * cos(radians(lat)) * cos(radians(p_lng - lng)) + sin(radians(p_lat)) * sin(radians(lat)))) AS distance
FROM dark_sky_places
WHERE (6371000 * acos(cos(radians(p_lat)) * cos(radians(lat)) * cos(radians(p_lng - lng)) + sin(radians(p_lat)) * sin(radians(lat)))) < p_radius
ORDER BY distance
LIMIT p_limit_rows;
$$ LANGUAGE sql;

-- Drop all tables
do $$ declare r record;
begin
    for r in (select tablename from pg_tables where schemaname = 'public') loop
        execute 'drop table if exists ' || quote_ident(r.tablename) || ' cascade';
    end loop;
end $$;

-- Run schema.sql contents here (paste below)

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dark_sky_places table
CREATE TABLE IF NOT EXISTS dark_sky_places (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  place_name TEXT NOT NULL,
  category TEXT,
  coords TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lat, lng)
);

-- Create user_locations table
CREATE TABLE IF NOT EXISTS user_locations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  location_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lat, lng)
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id BIGINT NOT NULL REFERENCES user_locations(id) ON DELETE CASCADE,
  last_notified TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT TRUE,
  unsubscribe_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, location_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dark_sky_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - adjust as needed)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on dark_sky_places" ON dark_sky_places FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_locations" ON user_locations FOR ALL USING (true);
CREATE POLICY "Allow all operations on alerts" ON alerts FOR ALL USING (true);

-- Run places.sql contents here (paste below)
