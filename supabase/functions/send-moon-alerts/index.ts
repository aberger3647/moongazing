import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.2";
import { formatDate, titleCase } from "./utils.ts";
import { Resend } from "npm:resend";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Supabase URL or SERVICE_ROLE_KEY not set in Edge Function secrets",
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Use Deno.serve for Edge runtime
Deno.serve(async (_req) => {
  // 1. Get active alerts
  const { data: alerts, error } = await supabase
    .from("alerts")
    .select(`
      id,
      user_id,
      location_id,
      last_notified,
      users(email),
      user_locations(lat, lng, location_name)
    `)
    .eq("active", true);

  if (error) {
    console.error("Supabase fetch alerts error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  if (!alerts?.length) return new Response("No alerts", { status: 200 });

  interface LocationRow {
    lat?: number;
    lng?: number;
    location_name?: string;
  }
  interface UserRow {
    email?: string;
  }
  interface AlertRow {
    id: number | string;
    user_locations?: LocationRow;
    users?: UserRow;
    unsubscribe_token?: string;
  }

  for (const alert of alerts as AlertRow[]) {
    try {
      const location: LocationRow = alert.user_locations || {};
      const user: UserRow = alert.users || {};
      const lat = location.lat;
      const lng = location.lng;
      const location_name = location.location_name;

      if (!lat || !lng || !user?.email) {
        console.warn("Skipping alert due to missing data", { alert });
        continue;
      }

      // 2. Fetch forecast from Visual Crossing (use global fetch in Deno)
      const vcKey = Deno.env.get("VISUAL_CROSSING_API_KEY");
      if (!vcKey) {
        console.error("VISUAL_CROSSING_API_KEY not set");
        continue;
      }

      const today = new Date();
const startDate = formatDate(today); // YYYY-MM-DD
const sevenDaysLater = new Date(today);
sevenDaysLater.setDate(today.getDate() + 7);
const endDate = formatDate(sevenDaysLater);

const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lng}/${startDate}/${endDate}?key=${vcKey}&include=days`;


      const forecastRes = await fetch(
       url,
      );
      const forecast = await forecastRes.json();

      // 3. Check for optimal moon conditions
      const day7 = forecast?.days?.[6]; // 7 days ahead
      if (!day7) {
        console.warn("No day7 in forecast for", { lat, lng });
        continue;
      }

      interface DayData {
        datetime?: string;
        conditions?: string;
        moonphase?: number;
      }

      const day7Typed = day7 as DayData;

      if (
      (day7Typed.conditions || "").includes("Clear") &&
      day7Typed.moonphase === 1
      ) {
      // 4. Get nearby dark sky places
      const { data: nearbyPlaces } = await supabase.rpc('get_places', {
          p_lat: lat,
          p_lng: lng,
          p_radius: 50000, // 50km
          p_limit_rows: 5,
        });

        // 5. Send email
        await sendEmail(user.email || "", location_name || "", day7Typed, nearbyPlaces || [], alert.unsubscribe_token || "");

        // 5. Update last_notified
        await supabase
          .from("alerts")
          .update({ last_notified: new Date().toISOString() })
          .eq("id", alert.id);
      }
    } catch (err) {
      console.error("Error processing alert", err);
      // continue processing remaining alerts
    }
  }

  return new Response("Done", { status: 200 });
});

// Example email sender using Postmark
async function sendEmail(
  to: string,
  location: string,
  dayData: { datetime?: string },
  nearbyPlaces: any[],
  unsubscribeToken?: string,
) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) throw new Error("RESEND_API_KEY not set");

  const resent = new Resend(resendApiKey);
  const baseUrl = "https://moongaz.ing"; // Update with your domain

  const subject = `Moon Gazing Alert for ${titleCase(location)}`;
  let htmlBody = `
  <div style="font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f9f9f9; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%); color: #ffffff; padding: 40px 20px; text-align: center;">
      <h1 style="font-family: 'Herculanum', serif; font-size: 36px; margin: 0; font-weight: normal;">Moongaz.ing</h1>
    </div>
    <div style="padding: 30px 20px;">
      <h2 style="font-family: 'Herculanum', serif; font-size: 24px; color: #1e1b4b; margin-top: 0;">Optimal Moon Gazing! 🌕</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 15px 0;">The full moon will be visible in <strong>${titleCase(location)}</strong> on <strong>${dayData.datetime}</strong>.</p>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 15px 0;">This is the perfect time to head out for some moongazing. Clear skies are forecasted, and the full moon will be at its brightest!</p>`;

  if (nearbyPlaces.length > 0) {
    htmlBody += `
      <div style="background-color: #f5f3ff; border-left: 4px solid #3730a3; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <h3 style="font-family: 'Herculanum', serif; color: #1e1b4b; margin: 0 0 12px 0; font-size: 18px;">🌌 Nearby Certified Dark Sky Places</h3>`;
    for (const place of nearbyPlaces) {
      htmlBody += `
        <div style="color: #4b5563; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e0d9ff;">
          <div style="font-weight: 600; color: #1e1b4b;">${place.place_name}</div>
          <div style="color: #8b8b8b; font-size: 13px;">${place.category} • ${(place.distance / 1000).toFixed(1)} km away</div>
        </div>`;
    }
    htmlBody += `
      </div>`;
  }

  htmlBody += `
    </div>
    <div style="background-color: #f5f3ff; padding: 20px; text-align: center; font-size: 12px; color: #8b8b8b; border-top: 1px solid #e0d9ff;">
      <p style="margin: 8px 0;">You're receiving this email because you have an active moon gazing alert.</p>
      <p style="margin: 8px 0;"><a href="${baseUrl}/manage-alerts?token=${unsubscribeToken}" style="color: #3730a3; text-decoration: none;">Update preferences</a> • <a href="${baseUrl}" style="color: #3730a3; text-decoration: none;">Visit Moongaz.ing</a></p>
    </div>
  </div>
  </div>`;

  const { data, error } = await resent.emails.send({
    from: "Moon Alerts <alerts@alerts.moongaz.ing>",
    to: [to],
    subject,
    html: htmlBody,
  });
  if (error) {
    console.error("Error sending email:", error);
    throw new Error(`Error sending email: ${error.message}`);
  } else {
    console.log("Email sent:", data);
  }
  return data;
}
