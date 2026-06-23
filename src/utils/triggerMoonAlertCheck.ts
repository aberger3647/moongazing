// Kick off an immediate moon-alert evaluation for a single, just-created alert,
// identified by its unsubscribe_token. This lets a brand-new subscriber receive
// the moon-gazing email right away when the upcoming full moon is clear, instead
// of waiting for the next daily cron run (and possibly missing a short window if
// they signed up within a week of the full moon).
//
// Best-effort and fire-and-forget: the send-moon-alerts function still applies
// the renotify throttle, so this never double-sends, and any failure is swallowed
// so it cannot disrupt the signup flow.
export async function triggerMoonAlertCheck(token: string): Promise<void> {
  if (!token) return;

  try {
    const endpoint =
      import.meta.env.VITE_SEND_MOON_ALERTS_FUNCTION ||
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-moon-alerts`;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ token }),
    });
  } catch (err) {
    console.error("Failed to trigger immediate moon alert check:", err);
  }
}
