import { json, preflight, resolveUserFromToken, supabase } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    if (!supabase) {
      console.error("Supabase not configured");
      return json({ error: "Service not configured" }, 500);
    }

    const { token, alertId } = await req.json();
    if (!token) {
      return json({ error: "Management token required" }, 400);
    }
    if (!alertId) {
      return json({ error: "Alert ID required" }, 400);
    }

    // Resolve the owning user from the management token (one of their alert tokens)
    const resolved = await resolveUserFromToken(supabase, token);
    if (!resolved.ok) return resolved.response;

    // Deactivate the alert only if it belongs to that user
    const { data: updated, error: updateError } = await supabase
      .from("alerts")
      .update({ active: false })
      .eq("id", alertId)
      .eq("user_id", resolved.userId)
      .select("id");

    if (updateError) throw updateError;
    if (!updated || updated.length === 0) {
      return json({ error: "Alert not found for this user" }, 404);
    }

    return json({ success: true, message: "You have been unsubscribed" });
  } catch (err) {
    console.error("Unsubscribe alert error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
