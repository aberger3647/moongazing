import { titleCase, type DayData } from "./utils.ts";

export interface NearbyPlace {
  place_name: string;
  category: string;
  distance: number;
}

export interface BuildAlertEmailArgs {
  location: string;
  dayData: DayData;
  places: NearbyPlace[];
  unsubscribeToken: string;
  baseUrl: string;
}

export function buildAlertEmail({
  location,
  dayData,
  places,
  unsubscribeToken,
  baseUrl,
}: BuildAlertEmailArgs): { subject: string; html: string } {
  const titled = titleCase(location);
  const subject = `Moon Gazing Alert for ${titled}`;

  let html = `
  <div style="font-family: 'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f9f9f9; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%); color: #ffffff; padding: 40px 20px; text-align: center;">
      <h1 style="font-family: 'Herculanum', serif; font-size: 36px; margin: 0; font-weight: normal;">Moongaz.ing</h1>
    </div>
    <div style="padding: 30px 20px;">
      <h2 style="font-family: 'Herculanum', serif; font-size: 24px; color: #1e1b4b; margin-top: 0;">Optimal Moon Gazing! 🌕</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 15px 0;">The full moon will be visible in <strong>${titled}</strong> on <strong>${dayData.datetime}</strong>.</p>
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 15px 0;">This is the perfect time to head out for some moongazing. Clear skies are forecasted, and the full moon will be at its brightest!</p>`;

  if (places.length > 0) {
    html += `
      <div style="background-color: #f5f3ff; border-left: 4px solid #3730a3; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <h3 style="font-family: 'Herculanum', serif; color: #1e1b4b; margin: 0 0 12px 0; font-size: 18px;">🌌 Nearby Certified Dark Sky Places</h3>`;
    for (const place of places) {
      html += `
        <div style="color: #4b5563; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e0d9ff;">
          <div style="font-weight: 600; color: #1e1b4b;">${place.place_name}</div>
          <div style="color: #8b8b8b; font-size: 13px;">${place.category} • ${(place.distance / 1000).toFixed(1)} km away</div>
        </div>`;
    }
    html += `
      </div>`;
  }

  html += `
    </div>
    <div style="background-color: #f5f3ff; padding: 20px; text-align: center; font-size: 12px; color: #8b8b8b; border-top: 1px solid #e0d9ff;">
      <p style="margin: 8px 0;">You're receiving this email because you have an active moon gazing alert.</p>
      <p style="margin: 8px 0;"><a href="${baseUrl}/manage-alerts?token=${unsubscribeToken}" style="color: #3730a3; text-decoration: none;">Update preferences</a> • <a href="${baseUrl}" style="color: #3730a3; text-decoration: none;">Visit Moongaz.ing</a></p>
    </div>
  </div>
  </div>`;

  return { subject, html };
}
