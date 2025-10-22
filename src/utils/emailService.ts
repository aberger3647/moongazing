interface SendEmailParams {
  to: string;
  subject: string;
html?: string;
text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/sendEmail', {
    method: 'POST',
  headers: {
  'Content-Type': 'application/json',
  },
      body: JSON.stringify({ to, subject, html, text }),
});

const data = await response.json();

    if (response.ok && data?.success) {
  return { success: true };
} else {
  console.error('Error sending email:', data?.error);
return { success: false, error: data?.error || 'Failed to send email' };
}
} catch (err) {
console.error('Unexpected error sending email:', err);
return { success: false, error: 'Unexpected error occurred' };
}
}
