import { SupabaseClient } from "npm:@supabase/supabase-js@2.39.2";
import { json, preflight } from "../_shared/supabase.ts";

export interface UnsubscribeDeps {
  supabase: SupabaseClient | null;
}

export function createHandler(deps: UnsubscribeDeps) {
  return async (req: Request): Promise<Response> => {
    const pre = preflight(req);
    if (pre) return pre;

    try {
      if (!deps.supabase) {
        console.error("Supabase not configured");
        return json({ error: "Service not configured" }, 500);
      }

      const token = new URL(req.url).searchParams.get("token");
      if (!token) return json({ error: "Unsubscribe token required" }, 400);

      const { data: alert, error: fetchError } = await deps.supabase
        .from("alerts")
        .select("id")
        .eq("unsubscribe_token", token)
        .single();

      if (fetchError || !alert) {
        return json({ error: "Invalid or expired unsubscribe token" }, 404);
      }

      const { error: updateError } = await deps.supabase
        .from("alerts")
        .update({ active: false })
        .eq("id", (alert as any).id);

      if (updateError) throw updateError;

      return json({ success: true, message: "You have been unsubscribed" });
    } catch (err) {
      console.error("Unsubscribe error:", err);
      return json({ error: "Internal server error" }, 500);
    }
  };
}
