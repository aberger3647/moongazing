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
async function sendAlertEmail(userEmail, locationName, date, conditions) {
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
    <p><strong>Location:</strong> ${locationName}</p>
    <p><strong>Date:</strong> ${date}</p>
    <p><strong>Conditions:</strong></p>
    ${conditionDetails}
    <p>The moon will be full, and all other conditions are optimal for moongazing!</p>
  `;

  const text = `
Optimal Moongazing Conditions Alert

Location: ${locationName}
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
      subject: `🌕 Optimal Moongazing Conditions on ${date} - ${locationName}`,
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

    // Get all user locations
    const { data: userLocations, error: locError } = await supabase
      .from('user_locations')
      .select('id, user_id, lat, lng, location_name');

    if (locError) throw new Error(`Failed to fetch user locations: ${locError.message}`);

    if (!userLocations || userLocations.length === 0) {
      console.log('No user locations found');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No user locations to check' }),
      };
    }

    // Get all users
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email');

    if (userError) throw new Error(`Failed to fetch users: ${userError.message}`);

    const userMap = new Map(users.map(u => [u.id, u.email]));
    let alertsSent = 0;

    // Check each location
    for (const location of userLocations) {
      try {
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
          // Send email to user
          const userEmail = userMap.get(location.user_id);
          if (userEmail) {
            const sent = await sendAlertEmail(userEmail, location.location_name, forecastDate, weather);
            if (sent) {
              alertsSent++;
              // Update last_notified in alerts table
              await supabase
                .from('alerts')
                .update({ last_notified: new Date().toISOString() })
                .match({ location_id: location.id });
            }
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
        message: `Checked ${userLocations.length} locations, sent ${alertsSent} alerts`,
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
