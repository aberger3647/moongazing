import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.2";




const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); 
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or SERVICE_ROLE_KEY not set in Edge Function secrets");
}
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders });

  try {
    const { lat, lng, radiusMeters = 5000, limit = 10 } = await req.json();
  
    const query = `
      SELECT
        id,
        place_name,
        category,
        lat,
        lng,
        ST_Distance(
          location,
          ST_MakePoint(${lng}, ${lat})::geography
        ) AS distance
      FROM places
      WHERE ST_DWithin(
        location,
        ST_MakePoint(${lng}, ${lat})::geography,
        ${radiusMeters}
      )
      ORDER BY distance
      LIMIT ${limit};
    `;
  
    const { data, error } = await supabase.rpc('sql', { sql: query });
  
if (error) {
  return new Response(JSON.stringify({ error: { message: error.message } }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

    return new Response(JSON.stringify({ data, error }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: { message: err.message || 'Unknown error' } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
