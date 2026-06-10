import { json, preflight, resolveUserFromToken, supabase } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

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
    const resolved = await resolveUserFromToken(supabase, token);
    if (!resolved.ok) return resolved.response;

    // Get all active alerts for this user
    const { data: alerts, error: alertsError } = await supabase
      .from("alerts")
      .select(
        "id, location_id, active, unsubscribe_token, user_locations(location_name)",
      )
      .eq("user_id", resolved.userId)
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
