import sgMail from "@sendgrid/mail";

export interface MailOptions {
  to: string;
  from?: string;
  fromName?: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: MailOptions): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    console.warn("[MAILER] No SENDGRID_API_KEY configured — emails will not be sent");
    return false;
  }

  sgMail.setApiKey(apiKey);

  const fromAddress = options.from || "hello@carenalert.com";
  const fromName = options.fromName || "C.A.R.E.N.™ ALERT";

  try {
    await sgMail.send({
      to: options.to,
      from: { email: fromAddress, name: fromName },
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    });
    console.log(`[MAILER] SendGrid: email sent to ${options.to} — "${options.subject}"`);
    return true;
  } catch (error: any) {
    const detail = error?.response?.body?.errors?.[0]?.message || error?.message || String(error);
    console.error(`[MAILER] SendGrid failed to send to ${options.to}: ${detail}`);
    return false;
  }
}
