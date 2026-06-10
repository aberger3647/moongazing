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

    const { token, alertId } = await req.json();
    if (!token) {
      return json({ error: "Management token required" }, 400);
    }
    if (!alertId) {
      return json({ error: "Alert ID required" }, 400);
    }

    // Resolve the owning user from the management token (one of their alert tokens)
    const { data: tokenAlert, error: tokenError } = await supabase
      .from("alerts")
      .select("user_id")
      .eq("unsubscribe_token", token)
      .single();

    if (tokenError || !tokenAlert) {
      return json({ error: "Invalid or expired management token" }, 404);
    }

    // Deactivate the alert only if it belongs to that user
    const { data: updated, error: updateError } = await supabase
      .from("alerts")
      .update({ active: false })
      .eq("id", alertId)
      .eq("user_id", tokenAlert.user_id)
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
