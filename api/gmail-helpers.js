// Gmail API helper functions for server-side operations
// This file can be used for more secure Gmail operations

export const config = {
  runtime: 'edge'
};

// Helper function to refresh access token
export async function refreshGmailToken(refreshToken: string) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.VITE_GMAIL_CLIENT_ID || '',
        client_secret: process.env.VITE_GMAIL_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    return await response.json();
  } catch (error) {
    console.error('Error refreshing Gmail token:', error);
    throw error;
  }
}

// Helper function to send email via Gmail API
export async function sendGmailEmail(accessToken: string, emailData: {
  to: string;
  subject: string;
  body: string;
  html?: string;
}) {
  try {
    // Construct the email in RFC 2822 format
    const emailLines = [
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      emailData.html || emailData.body
    ];
    
    const email = emailLines.join('\r\n');
    const encodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedEmail
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending Gmail email:', error);
    throw error;
  }
}
