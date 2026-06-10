import { SupabaseClient } from "npm:@supabase/supabase-js@2.39.2";
import { json, preflight, resolveUserFromToken } from "../_shared/supabase.ts";

export interface FormattedAlert {
  id: number | string;
  location_name: string;
  active: boolean;
  unsubscribe_token: string;
}

// Pure mapper from a raw Supabase alert row to the wire format.
export function formatAlert(raw: any): FormattedAlert {
  return {
    id: raw.id,
    location_name: raw?.user_locations?.location_name || "Unknown",
    active: !!raw.active,
    unsubscribe_token: raw.unsubscribe_token,
  };
}

export interface ManageAlertsDeps {
  supabase: SupabaseClient | null;
}

export function createHandler(deps: ManageAlertsDeps) {
  return async (req: Request): Promise<Response> => {
    const pre = preflight(req);
    if (pre) return pre;

    try {
      if (!deps.supabase) {
        console.error("Supabase not configured");
        return json({ error: "Service not configured" }, 500);
      }

      const token = new URL(req.url).searchParams.get("token");
      if (!token) return json({ error: "Management token required" }, 400);

      const resolved = await resolveUserFromToken(deps.supabase, token);
      if (!resolved.ok) return resolved.response;

      const { data: alerts, error: alertsError } = await deps.supabase
        .from("alerts")
        .select(
          "id, location_id, active, unsubscribe_token, user_locations(location_name)",
        )
        .eq("user_id", resolved.userId)
        .eq("active", true);

      if (alertsError) throw alertsError;

      return json({ alerts: ((alerts || []) as any[]).map(formatAlert) });
    } catch (err) {
      console.error("Manage alerts error:", err);
      return json({ error: "Internal server error" }, 500);
    }
  };
}
