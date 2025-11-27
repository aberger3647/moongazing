/* eslint-env node */

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const visualCrossingKey = process.env.VISUAL_CROSSING_API_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const resend = new Resend(resendApiKey);

// Optimal moongazing conditions
const OPTIMAL_CONDITIONS = {
  cloudCover: 30, // below this percentage
  visibility: 6, // miles or greater
  precipitation: 20, // below this percentage
};

// Get date 7 days from now (YYYY-MM-DD format)
function getDateIn7Days() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}

// Check if moon will be full on the given date
async function isMoonFull(date, lat, lng) {
  try {
    const params = new URLSearchParams({
      key: visualCrossingKey,
      unitGroup: 'us',
      contentType: 'json',
      elements: 'moonphase',
      include: 'days',
    });

    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lng}/${date}?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.days || data.days.length === 0) return false;

    const moonphase = data.days[0].moonphase;
    // Moon is full when moonphase is 0 or very close to 0/1
    return moonphase < 0.05 || moonphase > 0.95;
  } catch (err) {
    console.error('Error checking moon phase:', err);
    return false;
  }
}

// Get weather forecast for the date
async function getWeatherForecast(lat, lng, date) {
  try {
    const params = new URLSearchParams({
      key: visualCrossingKey,
      unitGroup: 'us',
      contentType: 'json',
      elements: 'cloudcover,visibility,precip',
      include: 'days',
    });

    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lng}/${date}?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.days || data.days.length === 0) return null;

    return data.days[0];
  } catch (err) {
    console.error('Error getting weather forecast:', err);
    return null;
  }
}

// Check if conditions are optimal
function areConditionsOptimal(weatherDay, isFull) {
  if (!isFull) return false;
  if (!weatherDay) return false;

  const cloudCover = weatherDay.cloudcover || 100;
  const visibility = weatherDay.visibility || 0;
  const precip = weatherDay.precip || 100;

  return (
    cloudCover < OPTIMAL_CONDITIONS.cloudCover &&
    visibility >= OPTIMAL_CONDITIONS.visibility &&
    precip < OPTIMAL_CONDITIONS.precipitation
  );
}

// Send alert email
async function sendAlertEmail(userEmail, locationName, date, conditions, unsubscribeToken) {
  const titleCaseLocation = titleCase(locationName);
  const baseUrl = 'https://moongaz.ing'; // Update with your domain
  const conditionDetails = `
    <ul>
      <li>Cloud Cover: ${conditions.cloudcover}%</li>
      <li>Visibility: ${conditions.visibility} miles</li>
      <li>Precipitation: ${conditions.precip}%</li>
    </ul>
  `;

  const html = `
    <h2>Optimal Moongazing Conditions Alert</h2>
    <p>Great news! Optimal conditions for moongazing have been forecasted for:</p>
    <p><strong>Location:</strong> ${titleCaseLocation}</p>
    <p><strong>Date:</strong> ${date}</p>
    <p><strong>Conditions:</strong></p>
    ${conditionDetails}
    <p>The moon will be full, and all other conditions are optimal for moongazing!</p>
    ${unsubscribeToken ? `<p><a href="${baseUrl}/manage-alerts?token=${unsubscribeToken}">Manage your alerts</a></p>` : ''}
  `;

  const text = `
Optimal Moongazing Conditions Alert

Location: ${titleCaseLocation}
Date: ${date}

Conditions:
- Cloud Cover: ${conditions.cloudcover}%
- Visibility: ${conditions.visibility} miles
- Precipitation: ${conditions.precip}%

The moon will be full, and all other conditions are optimal for moongazing!
  `;

  try {
    await resend.emails.send({
      from: 'Moon Alerts <alerts@alerts.moongaz.ing>',
      to: [userEmail],
      subject: `🌕 Optimal Moongazing Conditions on ${date} - ${titleCaseLocation}`,
      html,
      text,
    });
    return true;
  } catch (err) {
    console.error('Error sending email:', err);
    return false;
  }
}

export async function handler() {
  try {
    const forecastDate = getDateIn7Days();
    console.log(`Checking weather alerts for date: ${forecastDate}`);

    // Get all active alerts with related data
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select(`
        id,
        user_id,
        location_id,
        unsubscribe_token,
        users(email),
        user_locations(id, lat, lng, location_name)
      `)
      .eq('active', true);

    if (alertsError) throw new Error(`Failed to fetch alerts: ${alertsError.message}`);

    if (!alerts || alerts.length === 0) {
      console.log('No active alerts found');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No alerts to check' }),
      };
    }

    let alertsSent = 0;

    // Check each alert
    for (const alert of alerts) {
      try {
        const userEmail = alert.users?.email;
        const location = alert.user_locations;

        if (!userEmail || !location) {
          console.warn('Skipping alert due to missing user or location data', { alert });
          continue;
        }

        // Check if moon will be full
        const isFull = await isMoonFull(forecastDate, location.lat, location.lng);
        
        if (!isFull) {
          console.log(`Moon will not be full at ${location.location_name}`);
          continue;
        }

        // Get weather forecast
        const weather = await getWeatherForecast(location.lat, location.lng, forecastDate);

        if (!weather) {
          console.log(`Could not get weather for ${location.location_name}`);
          continue;
        }

        // Check if conditions are optimal
        if (areConditionsOptimal(weather, true)) {
          const sent = await sendAlertEmail(userEmail, location.location_name, forecastDate, weather, alert.unsubscribe_token);
          if (sent) {
            alertsSent++;
            // Update last_notified in alerts table
            await supabase
              .from('alerts')
              .update({ last_notified: new Date().toISOString() })
              .eq('id', alert.id);
          }
        } else {
          console.log(`Conditions not optimal at ${location.location_name}`);
        }
      } catch (err) {
        console.error(`Error processing location ${location.location_name}:`, err);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Checked ${alerts.length} alerts, sent ${alertsSent} alerts`,
      }),
    };
  } catch (err) {
    console.error('Unexpected error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
}
