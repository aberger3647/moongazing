import { createClient } from "npm:@supabase/supabase-js@2.39.2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (!supabase) {
      console.error("Supabase not configured");
      return json({ error: "Service not configured" }, 500);
    }

    const token = new URL(req.url).searchParams.get("token");
    if (!token) {
      return json({ error: "Management token required" }, 400);
    }

    // Find the user by their management token (one of their alert tokens)
    const { data: alert, error: fetchError } = await supabase
      .from("alerts")
      .select("user_id")
      .eq("unsubscribe_token", token)
      .single();

    if (fetchError || !alert) {
      return json({ error: "Invalid or expired management token" }, 404);
    }

    // Get all active alerts for this user
    const { data: alerts, error: alertsError } = await supabase
      .from("alerts")
      .select(
        "id, location_id, active, unsubscribe_token, user_locations(location_name)",
      )
      .eq("user_id", alert.user_id)
      .eq("active", true);

    if (alertsError) throw alertsError;

    const formattedAlerts = ((alerts || []) as any[]).map((a) => ({
      id: a.id,
      location_name: a.user_locations?.location_name || "Unknown",
      active: a.active,
      unsubscribe_token: a.unsubscribe_token,
    }));

    return json({ alerts: formattedAlerts });
  } catch (err) {
    console.error("Manage alerts error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
