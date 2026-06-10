import { SupabaseClient } from "npm:@supabase/supabase-js@2.39.2";
import { corsHeaders } from "../_shared/cors.ts";

export interface PlaceWithDistance {
  id: number;
  place_name: string;
  category: string;
  lat: number;
  lng: number;
  distance: number;
}

export interface GetPlacesDeps {
  supabase: SupabaseClient | null;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export function createHandler(deps: GetPlacesDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!deps.supabase) {
      return jsonResponse(
        { error: { message: "Service not configured" } },
        500,
      );
    }

    try {
      const bodyText = await req.text();
      let payload: any;
      try {
        payload = JSON.parse(bodyText);
      } catch {
        return jsonResponse(
          { error: { message: "Invalid JSON body", raw: bodyText } },
          400,
        );
      }

      const { lat, lng, radius = 482803, limit = 10 } = payload || {};

      const { data, error } = await deps.supabase.rpc("get_places", {
        p_lat: lat,
        p_lng: lng,
        p_radius: radius,
        p_limit_rows: limit,
      });

      if (error) {
        return jsonResponse({ error: { message: error.message } }, 500);
      }

      return jsonResponse({ data: data as PlaceWithDistance[] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[Edge] Function error:", err);
      return jsonResponse({ error: { message } }, 500);
    }
  };
}
