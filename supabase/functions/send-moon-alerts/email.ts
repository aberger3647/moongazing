import { titleCase, type DayData } from "./utils.ts";

export interface NearbyPlace {
  place_name: string;
  category: string;
  distance: number;
}

// Mirror the frontend's toMiles(): whole miles, so the email's distances match
// the "X miles away" wording shown in the app's Dark Sky Places list. The
// get_places RPC returns `distance` in meters.
function metersToMiles(meters: number): number {
  return Math.floor(meters * 0.000621371);
}

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Visual Crossing dates are calendar strings ("YYYY-MM-DD"); parse to a UTC date
// so the day math below doesn't drift with the server's timezone.
function parseYmd(s: string | undefined): Date | null {
  const m = s ? /^(\d{4})-(\d{2})-(\d{2})/.exec(s) : null;
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
}

function daysUntil(target: Date, today: Date): number {
  const start = Date.UTC(
    today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(),
  );
  return Math.round((target.getTime() - start) / 86_400_000);
}

// "Saturday, June 13": the date spelled out, no leading zeros.
function formatFriendlyDate(s: string | undefined): string {
  const d = parseYmd(s);
  if (!d) return s ?? "";
  return `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// A short phrase for when the optimal night falls relative to today, so the
// heading reflects the real day instead of always claiming "tonight".
function describeNight(s: string | undefined, today: Date): string {
  const target = parseYmd(s);
  if (!target) return "soon";
  const days = daysUntil(target, today);
  if (days <= 0) return "tonight";
  if (days === 1) return "tomorrow night";
  if (days <= 6) return `${WEEKDAYS[target.getUTCDay()]} night`;
  return `on ${formatFriendlyDate(s)}`;
}

export interface BuildAlertEmailArgs {
  location: string;
  dayData: DayData;
  places: NearbyPlace[];
  unsubscribeToken: string;
  baseUrl: string;
  /** The day the alert is sent, used to phrase how far off the optimal night is. */
  today: Date;
}

export function buildAlertEmail({
  location,
  dayData,
  places,
  unsubscribeToken,
  baseUrl,
  today,
}: BuildAlertEmailArgs): { subject: string; html: string } {
  const titled = titleCase(location);
  const subject = `Moon Gazing Alert for ${titled}`;
  const friendlyDate = formatFriendlyDate(dayData.datetime);
  const when = describeNight(dayData.datetime, today);

  // Mirrors the site's dark celestial look (src/App.tsx night-sky gradient,
  // the gold full moon, and the cream-pill CTA). Inline styles + a table shell
  // so it survives Gmail/Outlook; the site's custom fonts can't load in mail,
  // so we fall back to Quicksand → system sans.
  const font =
    "'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

  let placesBlock = "";
  if (places.length > 0) {
    const rows = places
      .map(
        (place) => `
                <div style="padding: 10px 0; border-bottom: 1px solid #2f2f5c;">
                  <div style="font-family: ${font}; font-size: 15px; font-weight: 600; color: #ffffff;">${place.place_name}</div>
                  <div style="font-family: ${font}; font-size: 13px; color: #a5b4fc; margin-top: 2px;">${place.category} • ${metersToMiles(place.distance)} miles away</div>
                </div>`,
      )
      .join("");
    placesBlock = `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #1b1b42; border: 1px solid #2f2f5c; border-radius: 10px; padding: 18px 20px;">
                    <div style="font-family: ${font}; font-size: 16px; font-weight: 600; color: #ffe8a6; margin: 0 0 6px;">🌌 Nearby Certified Dark Sky Places</div>${rows}
                  </td>
                </tr>
              </table>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${subject}</title>
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
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: #0f0f30; font-size: 1px; line-height: 1px;">A clear sky and a full moon over ${titled} on ${friendlyDate}. 🌕</div>
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
              <h2 style="font-family: ${font}; font-size: 23px; font-weight: 600; color: #ffe8a6; margin: 12px 0 14px;">Optimal Moon Gazing ${when}! 🌕</h2>
              <p style="font-family: ${font}; font-size: 16px; line-height: 1.65; color: #c7cdf2; margin: 0 0 16px;">The full moon will be visible in <strong style="color: #ffffff;">${titled}</strong> on <strong style="color: #ffffff;">${friendlyDate}</strong>.</p>
              <p style="font-family: ${font}; font-size: 16px; line-height: 1.65; color: #c7cdf2; margin: 0;">This is the perfect time to head out for some moongazing. Clear skies are forecasted, and the full moon will be at its brightest!</p>
              ${placesBlock}
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 28px auto 8px;">
                <tr>
                  <td align="center" bgcolor="#fefce8" style="border-radius: 9999px;">
                    <a href="${baseUrl}" style="display: inline-block; padding: 14px 34px; font-family: ${font}; font-size: 16px; font-weight: 700; color: #3730a3; border-radius: 9999px;">See the forecast →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding: 24px 40px 36px; border-top: 1px solid #2b2a55;">
              <p style="font-family: ${font}; font-size: 12px; line-height: 1.6; color: #8a90c4; margin: 0 0 10px; text-align: center;">You're receiving this email because you have an active moon gazing alert.</p>
              <p style="font-family: ${font}; font-size: 12px; line-height: 1.6; color: #8a90c4; margin: 0; text-align: center;">
                <a href="${baseUrl}/manage-alerts?token=${unsubscribeToken}" style="color: #ffe8a6; text-decoration: none;">Update preferences</a>
                &nbsp;•&nbsp;
                <a href="${baseUrl}" style="color: #ffe8a6; text-decoration: none;">Visit Moongaz.ing</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
