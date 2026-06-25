import { useState, useRef, useEffect } from "react";
import { sendEmail, triggerMoonAlertCheck } from "../utils";
import { supabase } from "../supabaseClient";
import { titleCase } from "../utils";

interface AlertsProps {
  location: string;
  lat?: number;
  lng?: number;
}

export const Alerts = ({ location, lat, lng }: AlertsProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const messageRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (message && messageRef.current) {
      setTimeout(() => {
        messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !lat || !lng) return;

    setLoading(true);
    setMessage("");

    try {
      // Get or create user
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      let userId = existingUser?.id;

      if (!userId) {
        const { data: newUser, error: userError } = await supabase
          .from("users")
          .insert({ email })
          .select("id")
          .single();

        if (userError) throw userError;
        userId = newUser.id;
      }

      // Get or create user location
      const { data: locationData, error: locationError } = await supabase
        .from("user_locations")
        .upsert({
          user_id: userId,
          lat,
          lng,
          location_name: location
        }, { onConflict: 'user_id,lat,lng' })
        .select("id")
        .single();

      if (locationError) throw locationError;
      const locationId = locationData.id;

      // Check if alert already exists for this email and location
      const { data: existingAlert } = await supabase
        .from("alerts")
        .select("id")
        .eq("user_id", userId)
        .eq("location_id", locationId)
        .eq("active", true)
        .single();

      if (existingAlert) {
        setMessage("You're already subscribed to alerts for this location.");
        setLoading(false);
        return;
      }

      // Create or reactivate alert
      const { data: alertData, error: alertError } = await supabase
        .from("alerts")
        .upsert({
          user_id: userId,
          location_id: locationId,
          active: true
        }, { onConflict: 'user_id,location_id' })
        .select('unsubscribe_token')
        .single();

      if (alertError) throw alertError;

      const unsubscribeToken = alertData?.unsubscribe_token;

      // Evaluate this brand-new alert immediately so the subscriber gets the
      // moon alert right away if the upcoming full moon is clear, instead of
      // waiting for the next daily cron run. Fire-and-forget — it's throttled
      // server-side and must not delay or break the signup flow.
      if (unsubscribeToken) {
        void triggerMoonAlertCheck(unsubscribeToken);
      }

      const unsubscribeLink = unsubscribeToken
        ? `${window.location.origin}/unsubscribe?token=${unsubscribeToken}`
        : '';
      const manageAlertsLink = unsubscribeToken
        ? `${window.location.origin}/manage-alerts?token=${unsubscribeToken}`
        : '';

      // Send confirmation email — same dark celestial look as the site and the
      // alert email (supabase/functions/send-moon-alerts/email.ts). The site's
      // custom fonts can't load in mail, so we fall back to Quicksand → system.
      const titledLocation = titleCase(location);
      const font =
        "'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
      // Herculanum is the site's display face for the wordmark; mirrors the alert
      // email (supabase/functions/send-moon-alerts/email.ts). Apple Mail resolves
      // it as a system font, the @font-face serves it to other capable clients,
      // and the rest fall back to a serif.
      const displayFont =
        "'Herculanum', 'Herculanum LT Std', 'Trajan Pro', ui-serif, Georgia, 'Times New Roman', serif";
      const origin = window.location.origin;
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Moon Gazing Alerts</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');
    @font-face {
      font-family: 'Herculanum';
      src: url('${origin}/Herculanum.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    body { margin: 0 !important; padding: 0 !important; background-color: #0f0f30; }
    a { text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; }
      .px { padding-left: 24px !important; padding-right: 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f30;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: #0f0f30; font-size: 1px; line-height: 1px;">You're subscribed to moon gazing alerts for ${titledLocation}. 🌙</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f0f30; background-image: linear-gradient(180deg, #07071c 0%, #0f0f30 42%, #181747 74%, #232255 100%);">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 600px; max-width: 600px; background-color: #13132e; border-radius: 16px; overflow: hidden;">
          <tr>
            <td class="px" align="center" style="padding: 44px 40px 12px;">
              <div style="width: 72px; height: 72px; margin: 0 auto 18px; border-radius: 50%; background-color: #f3e5a6; box-shadow: 0 0 28px rgba(255, 232, 166, 0.45), 0 0 56px rgba(255, 232, 166, 0.22);">
                <img src="${origin}/full_moon.png" width="72" height="72" alt="Full moon" style="display: block; width: 72px; height: 72px; border-radius: 50%; background-color: #f3e5a6;">
              </div>
              <div style="font-family: ${displayFont}; font-size: 34px; font-weight: 600; letter-spacing: 1px; color: #f3f2ff;">Moongaz.ing</div>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding: 12px 40px 4px;">
              <h2 style="font-family: ${font}; font-size: 23px; font-weight: 600; color: #ffe8a6; margin: 12px 0 14px;">Alert Subscription Confirmed! 🌙</h2>
              <p style="font-family: ${font}; font-size: 16px; line-height: 1.65; color: #c7cdf2; margin: 0 0 16px;">You've been successfully subscribed to moon gazing alerts for <strong style="color: #ffffff;">${titledLocation}</strong>.</p>
              <p style="font-family: ${font}; font-size: 16px; line-height: 1.65; color: #c7cdf2; margin: 0 0 16px;">You'll receive emails when conditions are optimal for moon gazing, including:</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
                <tr>
                  <td style="background-color: #1b1b42; border: 1px solid #2f2f5c; border-radius: 10px; padding: 18px 20px;">
                    <div style="font-family: ${font}; font-size: 15px; line-height: 2; color: #e6e9ff;">☁️&nbsp;&nbsp;Clear skies forecast<br>🌕&nbsp;&nbsp;Full moon visibility<br>🌌&nbsp;&nbsp;Nearby certified dark sky places</div>
                  </td>
                </tr>
              </table>
              <p style="font-family: ${font}; font-size: 16px; line-height: 1.65; color: #c7cdf2; margin: 0;">Thank you for joining the Moongaz.ing community!</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 28px auto 8px;">
                <tr>
                  <td align="center" bgcolor="#fefce8" style="border-radius: 9999px;">
                    <a href="${window.location.origin}" style="display: inline-block; padding: 14px 34px; font-family: ${font}; font-size: 16px; font-weight: 700; color: #3730a3; border-radius: 9999px;">Visit Moongaz.ing →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding: 24px 40px 36px; border-top: 1px solid #2b2a55; text-align: center;">
              ${manageAlertsLink ? `<p style="font-family: ${font}; font-size: 12px; line-height: 1.6; color: #8a90c4; margin: 0 0 8px;"><a href="${manageAlertsLink}" style="color: #ffe8a6; text-decoration: none;">Manage all your alerts</a></p>` : ''}
              ${unsubscribeLink ? `<p style="font-family: ${font}; font-size: 12px; line-height: 1.6; color: #8a90c4; margin: 0 0 8px;"><a href="${unsubscribeLink}" style="color: #ffe8a6; text-decoration: none;">Unsubscribe from ${titledLocation}</a></p>` : ''}
              <p style="font-family: ${font}; font-size: 12px; line-height: 1.6; color: #8a90c4; margin: 0;"><a href="${window.location.origin}" style="color: #ffe8a6; text-decoration: none;">Visit Moongaz.ing</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const emailResult = await sendEmail({
        to: email,
        subject: `Moon Gazing Alert Subscription for ${titledLocation}`,
        html,
      });

      if (emailResult.success) {
        setMessage("Subscription confirmed! You'll receive alerts via email.");
        setEmail("");
      } else {
        setMessage("Subscription saved! We'll send you a confirmation email shortly.");
      }
    } catch (error: any) {
      console.error("Error subscribing:", error);
      setMessage("Error subscribing. Please try again.");
    }

    setLoading(false);
  };

  return (
    <section className="panel animate-rise-in p-6 sm:p-8">
      <h2 className="font-herculanum text-2xl sm:text-3xl text-center">Email Alerts</h2>
      <p className="mt-1.5 max-w-[52ch] text-ink-soft">
        Email me when moon-gazing conditions are optimal for {titleCase(location)}:
      </p>
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="alert-email" className="sr-only">
          Email address
        </label>
        <input
          id="alert-email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="hello@email.com"
          className="input sm:flex-1"
          required
        />
        <button type="submit" disabled={loading} className="btn btn-primary shrink-0">
          {loading ? "Sending…" : "Subscribe"}
        </button>
      </form>
      {message && (
        <p ref={messageRef} role="status" className="mt-3 text-sm text-ink-soft">
          {message}
        </p>
      )}
    </section>
  );
};
