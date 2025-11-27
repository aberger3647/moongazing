/* eslint-env node */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function handler(event) {
  try {
    if (!supabase) {
      console.error('Supabase not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Service not configured' }),
      };
    }

    const token = event.queryStringParameters?.token;

    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Management token required' }),
      };
    }

    // Find the user by their management token (one of their alert tokens)
    const { data: alert, error: fetchError } = await supabase
      .from('alerts')
      .select('user_id')
      .eq('unsubscribe_token', token)
      .single();

    if (fetchError || !alert) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Invalid or expired management token' }),
      };
    }

    // Get all active alerts for this user
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('id, location_id, active, unsubscribe_token, user_locations(location_name)')
      .eq('user_id', alert.user_id)
      .eq('active', true);

    if (alertsError) {
      throw alertsError;
    }

    // Format the response
    const formattedAlerts = alerts.map(a => ({
      id: a.id,
      location_name: a.user_locations?.location_name || 'Unknown',
      active: a.active,
      unsubscribe_token: a.unsubscribe_token,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ alerts: formattedAlerts }),
    };
  } catch (err) {
    console.error('Manage alerts error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
