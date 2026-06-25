import { daysUntil, parseYmd, titleCase, type DayData } from "./utils.ts";

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
  const friendlyDate = formatFriendlyDate(dayData.datetime);
  const when = describeNight(dayData.datetime, today);
  // On the night itself the subject leads with "Tonight" so the day-of reminder
  // stands out from the earlier advance heads-up sharing the same inbox thread.
  const optimalDate = parseYmd(dayData.datetime);
  const isTonight = optimalDate ? daysUntil(optimalDate, today) <= 0 : false;
  const subject = isTonight
    ? `Tonight: Moon Gazing in ${titled}`
    : `Moon Gazing Alert for ${titled}`;

  // Mirrors the site's dark celestial look (src/App.tsx night-sky gradient,
  // the gold full moon, and the cream-pill CTA). Inline styles + a table shell
  // so it survives Gmail/Outlook; the site's custom fonts can't load in mail,
  // so we fall back to Quicksand → system sans.
  const font =
    "'Quicksand', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
  // Herculanum is the site's display face for the wordmark. It ships as a macOS/
  // iOS system font, so Apple Mail resolves the name directly; the @font-face in
  // the <style> block lets other capable clients load it from the site, and the
  // rest fall back to a serif (Gmail/Outlook ignore @font-face and web fonts).
  const displayFont =
    "'Herculanum', 'Herculanum LT Std', 'Trajan Pro', ui-serif, Georgia, 'Times New Roman', serif";

  // Deep-link the CTA to this alert's location so "See the forecast" opens that
  // place's forecast (the frontend reads ?location=) instead of the bare home page.
  const forecastUrl = location
    ? `${baseUrl}/?location=${encodeURIComponent(location)}`
    : baseUrl;

  let placesBlock = "";
  if (places.length > 0) {
    const lastIndex = places.length - 1;
    const rows = places
      .map(
        (place, i) => `
                <div style="padding: 10px 0;${i < lastIndex ? " border-bottom: 1px solid #2f2f5c;" : ""}">
                  <div style="font-family: ${font}; font-size: 15px; font-weight: 600; color: #ffffff;">${place.place_name}</div>
                  <div style="font-family: ${font}; font-size: 13px; color: #a5b4fc; margin-top: 2px;">${place.category} • ${metersToMiles(place.distance)} miles away</div>
                </div>`,
      )
      .join("");
    placesBlock = `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #1b1b42; border: 1px solid #2f2f5c; border-radius: 10px; padding: 18px 20px;">
                    <div style="font-family: ${font}; font-size: 16px; font-weight: 600; color: #ffe8a6; margin: 0 0 6px;">Where to Gaze</div>${rows}
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
    @font-face {
      font-family: 'Herculanum';
      src: url('${baseUrl}/Herculanum.ttf') format('truetype');
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
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: #0f0f30; font-size: 1px; line-height: 1px;">A clear sky and a full moon over ${titled} on ${friendlyDate}.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f0f30; background-image: linear-gradient(180deg, #07071c 0%, #0f0f30 42%, #181747 74%, #232255 100%);">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width: 600px; max-width: 600px; background-color: #13132e; border-radius: 16px; overflow: hidden;">
          <tr>
            <td class="px" align="center" style="padding: 44px 40px 12px;">
              <div style="width: 72px; height: 72px; margin: 0 auto 18px; border-radius: 50%; box-shadow: 0 0 28px rgba(255, 232, 166, 0.45), 0 0 56px rgba(255, 232, 166, 0.22);">
                <img src="${baseUrl}/full_moon.png" width="72" height="72" alt="Full moon" style="display: block; width: 72px; height: 72px; border-radius: 50%;">
              </div>
              <div style="font-family: ${displayFont}; font-size: 34px; font-weight: 600; letter-spacing: 1px; color: #f3f2ff;">Moongaz.ing</div>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding: 12px 40px 4px;">
              <h2 style="font-family: ${font}; font-size: 23px; font-weight: 600; color: #ffe8a6; margin: 12px 0 14px; text-align: center;">Optimal moon gazing ${when}</h2>
              <p style="font-family: ${font}; font-size: 16px; line-height: 1.65; color: #c7cdf2; margin: 0 0 16px;">The full moon will be visible in <strong style="color: #ffffff;">${titled}</strong> on <strong style="color: #ffffff;">${friendlyDate}</strong>.</p>
              <p style="font-family: ${font}; font-size: 16px; line-height: 1.65; color: #c7cdf2; margin: 0;">Clear skies are forecast and the moon will be at its brightest.</p>
              ${placesBlock}
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 28px auto 8px;">
                <tr>
                  <td align="center" bgcolor="#fefce8" style="border-radius: 9999px;">
                    <a href="${forecastUrl}" style="display: inline-block; padding: 14px 34px; font-family: ${font}; font-size: 16px; font-weight: 700; color: #3730a3; border-radius: 9999px;">See the forecast →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding: 24px 40px 36px; border-top: 1px solid #2b2a55;">
              <p style="font-family: ${font}; font-size: 12px; line-height: 1.6; color: #8a90c4; margin: 0 0 10px; text-align: center;">You're receiving this because you have an active moon gazing alert.</p>
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
