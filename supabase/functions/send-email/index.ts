import { Resend } from "npm:resend";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
if (!resendApiKey) throw new Error("RESEND_API_KEY not set");

const resend = new Resend(resendApiKey);

interface EmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { to, subject, html, text }: EmailRequest = await req.json();

    if (!to || !subject) {
      return new Response("Missing required fields: to, subject", {
        status: 400,
      });
    }

    const { data, error } = await resend.emails.send({
      from: "Moon Alerts <alerts@alerts.moongaz.ing>",
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Error sending email:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response("Internal server error", { status: 500 });
  }
});
