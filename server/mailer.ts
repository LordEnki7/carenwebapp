import nodemailer from 'nodemailer';

export interface MailOptions {
  to: string;
  from?: string;
  fromName?: string;
  subject: string;
  html: string;
  text?: string;
}

function createTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  console.warn('[MAILER] No SMTP credentials configured — emails will not be sent');
  return null;
}

export async function sendEmail(options: MailOptions): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) return false;

  const fromAddress = options.from || process.env.SMTP_USER || 'info@carenalert.com';
  const fromName = options.fromName || 'C.A.R.E.N.™ ALERT';

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log(`[MAILER] Email sent to ${options.to} — "${options.subject}"`);
    return true;
  } catch (error: any) {
    console.error(`[MAILER] Failed to send to ${options.to}:`, error.message);
    return false;
  }
}
