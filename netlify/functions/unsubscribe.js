/* eslint-env node */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables not set');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function handler(event) {
  try {
    const token = event.queryStringParameters?.token;

    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Unsubscribe token required' }),
      };
    }

    // Find the alert with this token
    const { data: alert, error: fetchError } = await supabase
      .from('alerts')
      .select('id, user_id, location_id')
      .eq('unsubscribe_token', token)
      .single();

    if (fetchError || !alert) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Invalid or expired unsubscribe token' }),
      };
    }

    // Deactivate the alert
    const { error: updateError } = await supabase
      .from('alerts')
      .update({ active: false })
      .eq('id', alert.id);

    if (updateError) {
      throw updateError;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'You have been unsubscribed' }),
    };
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
