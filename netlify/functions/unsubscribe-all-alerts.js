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

    const body = JSON.parse(event.body || '{}');
    const alertIds = body.alertIds;

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Alert IDs required' }),
      };
    }

    // Deactivate all alerts
    const { error: updateError } = await supabase
      .from('alerts')
      .update({ active: false })
      .in('id', alertIds);

    if (updateError) {
      throw updateError;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'You have been unsubscribed from all alerts' }),
    };
  } catch (err) {
    console.error('Unsubscribe all alerts error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
