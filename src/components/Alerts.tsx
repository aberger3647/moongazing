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
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 600px; max-width: 600px; background-color: #13132e; border: 1px solid #2b2a55; border-radius: 16px; overflow: hidden;">
          <tr>
            <td class="px" align="center" style="padding: 44px 40px 12px;">
              <div style="width: 64px; height: 64px; margin: 0 auto 18px; border-radius: 50%; background-color: #ffe8a6; background-image: radial-gradient(circle at 36% 30%, #fff7df 0%, #ffe8a6 50%, #f4dc9f 100%); box-shadow: 0 0 28px rgba(255, 232, 166, 0.45), 0 0 56px rgba(255, 232, 166, 0.22);"></div>
              <div style="font-family: ${font}; font-size: 32px; font-weight: 600; letter-spacing: 0.5px; color: #f3f2ff;">Moongaz.ing</div>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding: 12px 40px 4px;">
              <h2 style="font-family: ${font}; font-size: 23px; font-weight: 600; color: #ffe8a6; margin: 12px 0 14px;">You're all set 🌙</h2>
              <p style="font-family: ${font}; font-size: 16px; line-height: 1.65; color: #c7cdf2; margin: 0 0 16px;">You'll be the first to know when the skies over <strong style="color: #ffffff;">${titledLocation}</strong> are clear for moon gazing.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
                <tr>
                  <td style="background-color: #1b1b42; border-left: 4px solid #ffe8a6; border-radius: 10px; padding: 18px 20px;">
                    <div style="font-family: ${font}; font-size: 12px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; color: #a5b4fc; margin: 0 0 10px;">We'll email you when</div>
                    <div style="font-family: ${font}; font-size: 15px; line-height: 2; color: #e6e9ff;">🌕&nbsp;&nbsp;The moon is full and bright<br>☁️&nbsp;&nbsp;Clear skies are in the forecast<br>🌌&nbsp;&nbsp;A certified dark sky place is nearby</div>
                  </td>
                </tr>
              </table>
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
    <>
      <h2 className="font-herculanum text-3xl mb-3">Email Alerts</h2>
      <div className="flex flex-col items-center space-y-4">
        <p className="text-center">
          Email me when moon-gazing conditions are optimal for{" "}
          {titleCase(location)}:
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4 items-center">
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hello@email.com"
            className="text-indigo-950 py-2 px-4 bg-indigo-100 rounded-xl"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="font-herculanum text-xl bg-yellow-50 text-indigo-800 py-2 px-4 w-32 rounded-full disabled:opacity-50"
          >
            {loading ? "Sending..." : "Subscribe"}
          </button>
        </form>
        {message && <p ref={messageRef} className="text-center text-sm text-white -mt-3">{message}</p>}
      </div>
    </>
  );
};
