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

  const fromAddress = options.from || 'hello@carenalert.com';
  const fromName = options.fromName || 'C.A.R.E.N Alert™';

  try {
    await client.send({
      from: { email: fromAddress, name: fromName },
      to: [{ email: options.to }],
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      category: 'Director Outreach',
    });
    console.log(`[MAILER] Mailtrap bulk: email sent to ${options.to} — "${options.subject}"`);
    return true;
  } catch (error: any) {
    const detail = error?.response?.body?.errors?.[0]?.message || error?.message || String(error);
    console.error(`[MAILER] Mailtrap bulk failed to send to ${options.to}: ${detail}`);
    return false;
  }
}
