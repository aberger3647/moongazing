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

    const { alertId } = await req.json();
    if (!alertId) {
      return json({ error: "Alert ID required" }, 400);
    }

    // Deactivate the alert
    const { error: updateError } = await supabase
      .from("alerts")
      .update({ active: false })
      .eq("id", alertId);

    if (updateError) throw updateError;

    return json({ success: true, message: "You have been unsubscribed" });
  } catch (err) {
    console.error("Unsubscribe alert error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
