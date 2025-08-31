// supabase/functions/get-places/index.ts
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.2";

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface PlaceWithDistance {
  id: number;
  place_name: string;
  category: string;
  lat: number;
  lng: number;
  distance: number;
}

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or SERVICE_ROLE_KEY not set in Edge Function secrets");
}

const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Read raw request body
    const bodyText = await req.text();
    console.log("[Edge] Raw request body:", bodyText);

    let payload;
    try {
      payload = JSON.parse(bodyText);
    } catch (err) {
      console.error("[Edge] JSON parse error:", err);
      return new Response(
        JSON.stringify({ error: { message: "Invalid JSON body", raw: bodyText } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lat, lng, radius = 482803, limit = 10 } = payload || {};
    console.log("Edge Function received:", { lat, lng, radius, limit });

    const { data, error } = await supabase.rpc('get_places', {
      p_lat: lat,
      p_lng: lng,
      p_radius: radius,
      p_limit_rows: limit,
    });

    if (error) {
      console.error("[Edge] RPC error:", error);
      return new Response(JSON.stringify({ error: { message: error.message } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const places = data as PlaceWithDistance[];
    console.log("[Edge] RPC returned", places?.length ?? 0, "rows");

    return new Response(JSON.stringify({ data: places }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error("[Edge] Function error:", err);
    return new Response(JSON.stringify({ error: { message: err.message || 'Unknown error' } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
