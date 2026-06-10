import { SupabaseClient } from "npm:@supabase/supabase-js@2.39.2";
import { json, preflight, resolveUserFromToken } from "../_shared/supabase.ts";

export interface UnsubscribeAllDeps {
  supabase: SupabaseClient | null;
}

export function createHandler(deps: UnsubscribeAllDeps) {
  return async (req: Request): Promise<Response> => {
    const pre = preflight(req);
    if (pre) return pre;

    try {
      if (!deps.supabase) {
        console.error("Supabase not configured");
        return json({ error: "Service not configured" }, 500);
      }

      const { token } = await req.json();
      if (!token) return json({ error: "Management token required" }, 400);

      const resolved = await resolveUserFromToken(deps.supabase, token);
      if (!resolved.ok) return resolved.response;

      const { data: updated, error: updateError } = await deps.supabase
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
  };
}
