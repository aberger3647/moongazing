/* eslint-env node */

import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    if (!resend) {
      console.error('RESEND_API_KEY is not set');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Email service not configured' }),
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
        body: JSON.stringify({ error: error.message || 'Failed to send email' }),
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
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
}
