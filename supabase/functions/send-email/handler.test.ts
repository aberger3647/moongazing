import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildResendPayload, createHandler } from "./handler.ts";
import { makeRequest } from "../_shared/testing.ts";

Deno.test("buildResendPayload wraps the recipient and forwards the from address", () => {
  const payload = buildResendPayload(
    { to: "a@b.com", subject: "hi", html: "<p>x</p>" },
    "From <from@x.com>",
  );
  assertEquals(payload, {
    from: "From <from@x.com>",
    to: ["a@b.com"],
    subject: "hi",
    html: "<p>x</p>",
  });
});

Deno.test("buildResendPayload omits html/text when not provided", () => {
  const payload = buildResendPayload(
    { to: "a@b.com", subject: "hi" },
    "From <from@x.com>",
  );
  assertEquals(payload.html, undefined);
  assertEquals(payload.text, undefined);
});

Deno.test("buildResendPayload includes both html and text when both provided", () => {
  const payload = buildResendPayload(
    { to: "a@b.com", subject: "hi", html: "<p>x</p>", text: "x" },
    "From <from@x.com>",
  );
  assertEquals(payload.html, "<p>x</p>");
  assertEquals(payload.text, "x");
});

Deno.test("returns 200 'ok' for OPTIONS preflight", async () => {
  const handler = createHandler({
    resendSend: () => Promise.resolve({ data: null }),
  });
  const res = await handler(makeRequest("OPTIONS", "https://x/send-email"));
  assertEquals(res.status, 200);
  assertEquals(await res.text(), "ok");
});

Deno.test("returns 405 for non-POST methods", async () => {
  const handler = createHandler({
    resendSend: () => Promise.resolve({ data: null }),
  });
  const res = await handler(makeRequest("GET", "https://x/send-email"));
  assertEquals(res.status, 405);
});

Deno.test("returns 500 when Resend is not configured", async () => {
  const handler = createHandler({ resendSend: null });
  const res = await handler(
    makeRequest("POST", "https://x/send-email", {
      to: "a@b.com",
      subject: "hi",
    }),
  );
  assertEquals(res.status, 500);
});

Deno.test("returns 400 when 'to' is missing", async () => {
  const handler = createHandler({
    resendSend: () => Promise.resolve({ data: null }),
  });
  const res = await handler(
    makeRequest("POST", "https://x/send-email", { subject: "hi" }),
  );
  assertEquals(res.status, 400);
});

Deno.test("returns 400 when 'subject' is missing", async () => {
  const handler = createHandler({
    resendSend: () => Promise.resolve({ data: null }),
  });
  const res = await handler(
    makeRequest("POST", "https://x/send-email", { to: "a@b.com" }),
  );
  assertEquals(res.status, 400);
});

Deno.test("returns 200 + success on a happy path send", async () => {
  let receivedPayload: any = null;
  const handler = createHandler({
    resendSend: (payload) => {
      receivedPayload = payload;
      return Promise.resolve({ data: { id: "resend-1" } });
    },
  });
  const res = await handler(
    makeRequest("POST", "https://x/send-email", {
      to: "person@example.com",
      subject: "hi",
      html: "<p>hi</p>",
    }),
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.success, true);
  assertEquals(body.data.id, "resend-1");
  assert(receivedPayload?.to.includes("person@example.com"));
});

Deno.test("returns 500 with the Resend error message when the API errors", async () => {
  const errSpy = console.error;
  console.error = () => {};
  try {
    const handler = createHandler({
      resendSend: () =>
        Promise.resolve({ error: { message: "domain not verified" } }),
    });
    const res = await handler(
      makeRequest("POST", "https://x/send-email", {
        to: "a@b.com",
        subject: "hi",
      }),
    );
    assertEquals(res.status, 500);
    assertEquals((await res.json()).error, "domain not verified");
  } finally {
    console.error = errSpy;
  }
});
