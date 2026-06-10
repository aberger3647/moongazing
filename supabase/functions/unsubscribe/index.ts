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

    const token = new URL(req.url).searchParams.get("token");
    if (!token) {
      return json({ error: "Unsubscribe token required" }, 400);
    }

    // Find the alert with this token
    const { data: alert, error: fetchError } = await supabase
      .from("alerts")
      .select("id, user_id, location_id")
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
