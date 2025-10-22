/* eslint-env node */

const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  throw new Error('RESEND_API_KEY not set');
}

const resend = new Resend(resendApiKey);

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    const { to, subject, html, text } = JSON.parse(event.body);

    if (!to || !subject) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: to, subject' }),
      };
    }

    const { data, error } = await resend.emails.send({
      from: 'Moon Alerts <alerts@alerts.moongaz.ing>',
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Error sending email:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (err) {
    console.error('Unexpected error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
