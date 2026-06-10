import { Resend } from "npm:resend";
import { createHandler } from "./handler.ts";

// Initialize at module scope but DON'T throw if the key is missing — that
// crashes the edge-runtime worker. Fail closed at request time instead.
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = resendApiKey ? new Resend(resendApiKey) : null;

Deno.serve(
  createHandler({
    resendSend: resend
      ? (payload) =>
        resend.emails.send(payload as Parameters<typeof resend.emails.send>[0])
      : null,
  }),
);
