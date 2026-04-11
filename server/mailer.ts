import { MailtrapClient } from "mailtrap";

export interface MailOptions {
  to: string;
  from?: string;
  fromName?: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: MailOptions): Promise<boolean> {
  if (!process.env.MAILTRAP_TOKEN) {
    console.warn('[MAILER] No MAILTRAP_TOKEN configured — emails will not be sent');
    return false;
  }

  const client = new MailtrapClient({ token: process.env.MAILTRAP_TOKEN });

  const fromAddress = options.from || 'info@carenalert.com';
  const fromName = options.fromName || 'C.A.R.E.N.™ ALERT';

  try {
    await client.send({
      from: { email: fromAddress, name: fromName },
      to: [{ email: options.to }],
      subject: options.subject,
      html: options.html,
      text: options.text || '',
      category: 'Director Outreach',
    });
    console.log(`[MAILER] Mailtrap: email sent to ${options.to} — "${options.subject}"`);
    return true;
  } catch (error: any) {
    console.error(`[MAILER] Mailtrap failed to send to ${options.to}:`, error.message || error);
    return false;
  }
}
