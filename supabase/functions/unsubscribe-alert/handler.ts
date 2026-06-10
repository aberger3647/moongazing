import { SupabaseClient } from "npm:@supabase/supabase-js@2.39.2";
import { json, preflight, resolveUserFromToken } from "../_shared/supabase.ts";

export interface UnsubscribeAlertDeps {
  supabase: SupabaseClient | null;
}

export function createHandler(deps: UnsubscribeAlertDeps) {
  return async (req: Request): Promise<Response> => {
    const pre = preflight(req);
    if (pre) return pre;

    try {
      if (!deps.supabase) {
        console.error("Supabase not configured");
        return json({ error: "Service not configured" }, 500);
      }

      const { token, alertId } = await req.json();
      if (!token) return json({ error: "Management token required" }, 400);
      if (!alertId) return json({ error: "Alert ID required" }, 400);

      const resolved = await resolveUserFromToken(deps.supabase, token);
      if (!resolved.ok) return resolved.response;

      // Scope the update to the owning user so a leaked token can't deactivate
      // another user's alert.
      const { data: updated, error: updateError } = await deps.supabase
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
  };
}
