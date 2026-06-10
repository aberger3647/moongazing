// CORS headers — kept inline to match the function's original surface and
// because send-email is the one function that does not yet share _shared/cors.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export interface EmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface ResendPayload {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
}

export interface ResendSendResult {
  data?: unknown;
  error?: { message?: string } | null;
}

// Builds the Resend payload from an incoming EmailRequest. Pure; tested.
export function buildResendPayload(req: EmailRequest, from: string): ResendPayload {
  const payload: ResendPayload = { from, to: [req.to], subject: req.subject };
  if (req.html) payload.html = req.html;
  if (req.text) payload.text = req.text;
  return payload;
}

export interface SendEmailDeps {
  resendSend: ((payload: ResendPayload) => Promise<ResendSendResult>) | null;
  fromAddress?: string;
}

export function createHandler(deps: SendEmailDeps) {
  const from = deps.fromAddress ?? "Moon Alerts <alerts@alerts.moongaz.ing>";

  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    if (!deps.resendSend) {
      return new Response(JSON.stringify({ error: "Service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const body = (await req.json()) as EmailRequest;
      if (!body.to || !body.subject) {
        return new Response("Missing required fields: to, subject", {
          status: 400,
          headers: corsHeaders,
        });
      }

      const payload = buildResendPayload(body, from);
      const { data, error } = await deps.resendSend(payload);

      if (error) {
        console.error("Error sending email:", error);
        return new Response(
          JSON.stringify({ error: error.message ?? "Unknown error" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      return new Response("Internal server error", {
        status: 500,
        headers: corsHeaders,
      });
    }
  };
}
