// supabase/functions/get-places/index.ts
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.2";

// Get secrets from Edge Function environment
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or SERVICE_ROLE_KEY not set in Edge Function secrets");
}

const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

try {
    const { lat, lng, radiusMeters = 5000, limit = 10 } = await req.json();

    // Call the updated Postgres function with renamed parameters
    const { data, error } = await supabase.rpc('get_places', {
      p_lat: lat,
      p_lng: lng,
      p_radius_meters: radiusMeters,
      p_limit_rows: limit
    });

    if (error) {
      return new Response(JSON.stringify({ error: { message: error.message } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: { message: err.message || 'Unknown error' } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
