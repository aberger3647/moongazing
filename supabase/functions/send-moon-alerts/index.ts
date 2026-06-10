import { createClient } from "npm:@supabase/supabase-js@2.39.2";
import { Resend } from "npm:resend";
import { createHandler } from "./handler.ts";

// Failing closed on missing env at request time avoids the historical
// edge-runtime worker crash from a module-level throw.
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const visualCrossingKey = Deno.env.get("VISUAL_CROSSING_API_KEY");
const resendApiKey = Deno.env.get("RESEND_API_KEY");

const defaultSupabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;
const defaultResend = resendApiKey ? new Resend(resendApiKey) : null;

const misconfigured = (which: string) => {
  console.error(`send-moon-alerts: ${which} not set`);
  return new Response(
    JSON.stringify({ error: "Service not configured" }),
    { status: 500, headers: { "Content-Type": "application/json" } },
  );
};

Deno.serve(async (req) => {
  if (!defaultSupabase) return misconfigured("Supabase env");
  if (!visualCrossingKey) return misconfigured("VISUAL_CROSSING_API_KEY");
  if (!defaultResend) return misconfigured("RESEND_API_KEY");

  const handler = createHandler({
    supabase: defaultSupabase,
    fetch: globalThis.fetch,
    visualCrossingKey,
    sendEmail: async ({ to, subject, html }) => {
      const { data, error } = await defaultResend.emails.send({
        from: "Moon Alerts <alerts@alerts.moongaz.ing>",
        to: [to],
        subject,
        html,
      });
      if (error) {
        console.error("Error sending email:", error);
        throw new Error(`Error sending email: ${error.message}`);
      }
      return data;
    },
  });

  return await handler(req);
});
