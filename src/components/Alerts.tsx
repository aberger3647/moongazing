import { useState, useRef, useEffect } from "react";
import { sendEmail } from "../utils";
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
        }, { onConflict: ['user_id', 'lat', 'lng'] })
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
      const unsubscribeLink = unsubscribeToken 
        ? `${window.location.origin}/unsubscribe?token=${unsubscribeToken}`
        : '';
      const manageAlertsLink = unsubscribeToken
        ? `${window.location.origin}/manage-alerts?token=${unsubscribeToken}`
        : '';

      // Send confirmation email
      const emailResult = await sendEmail({
        to: email,
        subject: `Moon Gazing Alert Subscription for ${titleCase(location)}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background-color: #f9f9f9;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              }
              .header {
                background: linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%);
                color: #ffffff;
                padding: 40px 20px;
                text-align: center;
              }
              .header h1 {
                font-family: 'Herculanum', serif;
                font-size: 36px;
                margin: 0;
                font-weight: normal;
              }
              .content {
                padding: 30px 20px;
              }
              .content h2 {
                font-family: 'Herculanum', serif;
                font-size: 24px;
                color: #1e1b4b;
                margin-top: 0;
              }
              .content p {
                color: #4b5563;
                font-size: 16px;
                line-height: 1.6;
                margin: 15px 0;
              }
              .location-highlight {
                background-color: #f5f3ff;
                border-left: 4px solid #3730a3;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
              }
              .location-highlight strong {
                color: #1e1b4b;
                font-size: 18px;
              }
              .footer {
                background-color: #f5f3ff;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #8b8b8b;
                border-top: 1px solid #e0d9ff;
              }
              .footer a {
                color: #3730a3;
                text-decoration: none;
              }
              .footer p {
                margin: 8px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Moongaz.ing</h1>
              </div>
              <div class="content">
                <h2>Alert Subscription Confirmed! 🌙</h2>
                <p>You've been successfully subscribed to moon gazing alerts for:</p>
                <div class="location-highlight">
                  <strong>${titleCase(location)}</strong>
                </div>
                <p>You'll receive emails when conditions are optimal for moon gazing, including:</p>
                <ul style="color: #4b5563; font-size: 16px; line-height: 1.8;">
                  <li>Clear skies forecast</li>
                  <li>Full moon visibility</li>
                  <li>Nearby certified dark sky places</li>
                </ul>
                <p>Thank you for joining the Moongaz.ing community!</p>
              </div>
              <div class="footer">
                <p>${manageAlertsLink ? `<a href="${manageAlertsLink}">Manage all your alerts</a>` : ''}</p>
                ${unsubscribeLink ? `<p><a href="${unsubscribeLink}">Unsubscribe from ${titleCase(location)}</a></p>` : ''}
                <p><a href="${window.location.origin}">Visit Moongaz.ing</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
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
