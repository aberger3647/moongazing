import { json, preflight, resolveUserFromToken, supabase } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    if (!supabase) {
      console.error("Supabase not configured");
      return json({ error: "Service not configured" }, 500);
    }

    const { token } = await req.json();
    if (!token) {
      return json({ error: "Management token required" }, 400);
    }

    // Resolve the owning user from the management token (one of their alert tokens)
    const resolved = await resolveUserFromToken(supabase, token);
    if (!resolved.ok) return resolved.response;

    // Deactivate all of that user's currently-active alerts; report how many.
    const { data: updated, error: updateError } = await supabase
      .from("alerts")
      .update({ active: false })
      .eq("user_id", resolved.userId)
      .eq("active", true)
      .select("id");

    if (updateError) throw updateError;

    const count = updated?.length ?? 0;
    return json({
      success: true,
      count,
      message: count > 0
        ? "You have been unsubscribed from all alerts"
        : "You had no active alerts",
    });
  } catch (err) {
    console.error("Unsubscribe all alerts error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
