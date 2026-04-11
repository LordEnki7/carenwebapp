import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

export interface MailOptions {
  to: string;
  from?: string;
  fromName?: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendViaSendGrid(options: MailOptions): Promise<boolean> {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    const fromAddress = options.from || 'info@carenalert.com';
    const fromName = options.fromName || 'C.A.R.E.N.™ ALERT';
    await sgMail.send({
      to: options.to,
      from: { email: fromAddress, name: fromName },
      subject: options.subject,
      html: options.html,
      text: options.text || '',
    });
    console.log(`[MAILER] SendGrid: email sent to ${options.to} — "${options.subject}"`);
    return true;
  } catch (error: any) {
    console.error(`[MAILER] SendGrid failed to send to ${options.to}:`, error?.response?.body || error.message);
    return false;
  }
}

async function sendViaSMTP(options: MailOptions): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('[MAILER] No SMTP credentials configured');
    return false;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
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
    console.log(`[MAILER] SMTP: email sent to ${options.to} — "${options.subject}"`);
    return true;
  } catch (error: any) {
    console.error(`[MAILER] SMTP failed to send to ${options.to}:`, error.message);
    return false;
  }
}

export async function sendEmail(options: MailOptions): Promise<boolean> {
  if (process.env.SENDGRID_API_KEY) {
    return sendViaSendGrid(options);
  }
  return sendViaSMTP(options);
}
