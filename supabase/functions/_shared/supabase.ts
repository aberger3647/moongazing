import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.39.2";
import { corsHeaders } from "./cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Service-role client shared across edge functions; null when env is missing.
export const supabase: SupabaseClient | null = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// JSON response helper that always includes CORS headers.
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Returns a CORS preflight response for OPTIONS requests, otherwise null.
export const preflight = (req: Request): Response | null =>
  req.method === "OPTIONS"
    ? new Response("ok", { headers: corsHeaders })
    : null;

// Resolves the owning user_id from one of their per-alert unsubscribe tokens.
// Returns a discriminated result so callers can return the error response as-is.
export const resolveUserFromToken = async (
  client: SupabaseClient,
  token: string,
): Promise<
  { ok: true; userId: string } | { ok: false; response: Response }
> => {
  const { data, error } = await client
    .from("alerts")
    .select("user_id")
    .eq("unsubscribe_token", token)
    .single();

  if (error || !data) {
    return {
      ok: false,
      response: json({ error: "Invalid or expired management token" }, 404),
    };
  }
  return { ok: true, userId: data.user_id as string };
};
