-- Rename places to dark_sky_places
ALTER TABLE places RENAME TO dark_sky_places;

-- Update the get_places RPC to query dark_sky_places
CREATE OR REPLACE FUNCTION get_places(p_lat decimal, p_lng decimal, p_radius integer, p_limit_rows integer) RETURNS TABLE(id bigint, place_name text, category text, lat decimal, lng decimal, distance double precision) AS $$
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
CREATE POLICY \"Allow all operations on users\" ON users FOR ALL USING (true);
CREATE POLICY \"Allow all operations on dark_sky_places\" ON dark_sky_places FOR ALL USING (true);
CREATE POLICY \"Allow all operations on user_locations\" ON user_locations FOR ALL USING (true);
CREATE POLICY \"Allow all operations on alerts\" ON alerts FOR ALL USING (true);

-- Run places.sql contents here (paste below)

INSERT INTO "public"."dark_sky_placeRROR:  42601: syntax error at or near ""id""

LINE 1: INSERT INTO "public"."dark_sky_places" OVERRIDING SYSTEM VALUE ("id", "category", "place_name", "coords", "lat", "lng", "location") VALUES ('1', 'Sanctuaries', '!Ae!Hai Kalahari Heritage Park', '-27.4327193,20.3638621', '-27.4327193', '20.3638621', '0101000020E6100000FEC00B11265D344017D929B1C66E3BC0'), ('2', 'Parks', 'Aenos National Park', '38.1406036,20.656048', '38.1406036', '20.65s" OVERRIDING SYSTEM VALUE ("id", "category", "place_name", "coords", "lat", "lng", "location") VALUES ('1', 'Sanctuaries', '!Ae!Hai Kalahari Heritage Park', '-27.4327193,20.3638621', '-27.4327193', '20.3638621', '0101000020E6100000FEC00B11265D344017D929B1C66E3BC0'), ('2', 'Parks', 'Aenos National Park', '38.1406036,20.656048', '38.1406036', '20.656048', '0101000020E6100000309B00C3F2A7344095D97B4CFF114340'), ('3', 'Parks', 'Albanyà', '42.3050773,2.7115363', '42.3050773', '2.7115363', '0101000020E6100000B35593F139B105404120E1C50C274540'), ('4', 'Reserves', 'Alpes Azur Mercantour', '44.1521572,6.9992229', '44.1521572', '6.9992229', '0101000020E610000039A8B34934FF1B40EBEC1AE379134640'), ('5', 'Parks', 'AMC Maine Woods', '45.4912817,-69.3946364', '45.4912817', '-69.3946364', '0101000020E6100000EAF307B9415951C0C84F9951E2BE4640'), ('6', 'Parks', 'Antelope Island State Park', '41.0894784,-112.1130089', '41.0894784', '-112.1130089', '0101000020E61000000B6AAE893B075CC065D93807748B4440'), ('7', 'Parks', 'Anza-Borrego Desert State Park', '33.2559237,-116.4038851', '33.2559237', '-116.4038851', '0101000020E6100000DEF5E340D9195DC0BAE2981BC2A04040'), ('8', 'Reserves', 'Aoraki Mackenzie', '-43.5949749,169.8616369', '-43.5949749', '169.8616369', '0101000020E6100000DC508C87923B65406EB8342328CC45C0'), ('9', 'Sanctuaries', 'Aotea Great Barrier Island', '-37.6612545,166.6167645', '-37.6612545', '166.6167645', '0101000020E6100000AE9AE788BCD364409AEAC9FCA3D442C0'), ('10', 'Parks', 'Arches National Park', '38.7320195,-109.7257232', '38.7320195', '-109.7257232', '0101000020E6100000B47CB83F726E5BC06344A2D0B25D4340'), ('11', 'Sanctuaries', 'Arkaroola Wilderness Sanctuary', '-30.3116867,139.3358408', '-30.3116867', '139.3358408', '0101000020E610000033953435BF6A6140211917B3CA4F3EC0'), ('12', 'Reserves', 'Bannau Brycheiniog National Park (Brecon Beacons)', '51.8631966,-3.4275401', '51.8631966', '-3.4275401', '0101000020E61000001CD4D9249A6B0BC05B82E7397DEE4940'), ('13', 'Sanctuaries', 'Beaver Island State Wildlife Research Area', '45.6748267,-85.8084372', '45.6748267', '-85.8084372', '0101000020E6100000ABB7616FBD7355C0DA7BA7B860D64640'), ('14', 'Communities', 'Bee Cave', '30.6589749,-105.3130123', '30.6589749', '-105.3130123', '0101000020E6100000BAEFBD6408545AC087623C94B2A83E40'), ('15', 'Communities', 'Beverly Shores, Indiana', '41.7064441,-87.1319772', '41.7064441', '-87.1319772', '0101000020E610000054747F5072C855C0E0F9A0C26CDA4440'), ('16', 'Parks', 'Big Bend National Park', '29.3342458,-103.2873843', '29.3342458', '-103.2873843', '0101000020E610000091781E8164D259C04BD3FB2191553D40'), ('17', 'Parks', 'Big Bend Ranch State Park', '29.269868,-103.7661333', '29.269868', '-103.7661333', '0101000020E61000001AF8F65308F159C0A73CBA1116453D40'), ('18', 'Parks', 'Big Cypress National Preserve', '25.9006137,-81.322254', '25.9006137', '-81.322254', '0101000020E610000055C03DCF9F5454C05ED4939E8EE63940'), ('19', 'Communities', 'Big Park / Village of Oak Creek, Arizona', '34.77991,-111.755117', '34.77991', '-111.755117', '0101000020E6100000D5E940D653F05BC064E94317D4634140'), ('20', 'Communities', 'Bisei Town, Ibara City', '34.6724314,133.5445685', '34.6724314', '133.5445685', '0101000020E6100000D13DEB1A6DB16040D9E66B3B12564140'), ('21', 'Parks', 'Black Canyon of the Gunnison National Park', '38.5748599,-107.7351729', '38.5748599', '-107.7351729', '0101000020E6100000F399A2120DEF5AC013245B0295494340'), ('22', 'Sanctuaries', 'Black Gap Wildlife Management Area', '29.5668414,-102.9428952', '29.5668414', '-102.9428952', '0101000020E61000008BE31B6558BC59C0D4049B841C913D40'), ('23', 'Communities', 'Blanco, Texas', '30.0990345,-98.4225428', '30.0990345', '-98.4225428', '0101000020E610000042CAF4F00A9B58C0FBAC32535A193E40'), ('24', 'Parks', 'Bodmin Moor Dark Sky Landscape', '50.5547953,-4.6090771', '50.5547953', '-4.6090771', '0101000020E610000058F844E8B16F12C0BDBC4A8803474940'), ('25', 'Communities', 'Bon Accord, Alberta', '53.8416343,-113.4155463', '53.8416343', '-113.4155463', '0101000020E6100000531E824F985A5CC08FD838ACBAEB4A40'), ('26', 'Communities', 'Bor…[+31KB]
