import { json, preflight, supabase } from "../_shared/supabase.ts";

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
      return json({ error: "Unsubscribe token required" }, 400);
    }

    // Find the alert with this token
    const { data: alert, error: fetchError } = await supabase
      .from("alerts")
      .select("id")
      .eq("unsubscribe_token", token)
      .single();

    if (fetchError || !alert) {
      return json({ error: "Invalid or expired unsubscribe token" }, 404);
    }

    // Deactivate the alert
    const { error: updateError } = await supabase
      .from("alerts")
      .update({ active: false })
      .eq("id", alert.id);

    if (updateError) throw updateError;

    return json({ success: true, message: "You have been unsubscribed" });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
