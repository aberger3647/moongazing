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
    const alertId = body.alertId;

    if (!alertId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Alert ID required' }),
      };
    }

    // Deactivate the alert
    const { error: updateError } = await supabase
      .from('alerts')
      .update({ active: false })
      .eq('id', alertId);

    if (updateError) {
      throw updateError;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'You have been unsubscribed' }),
    };
  } catch (err) {
    console.error('Unsubscribe alert error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
