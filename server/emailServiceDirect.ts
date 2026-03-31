import { sendEmail } from './mailer';

export { sendEmail };

interface DirectEmailParams {
  email: string;
  firstName?: string;
  lastName?: string;
}

export async function sendDirectWelcomeEmail({ email, firstName, lastName }: DirectEmailParams): Promise<boolean> {
  const userName = firstName || email.split('@')[0];

  return sendEmail({
    to: email,
    from: 'info@carenalert.com',
    fromName: 'C.A.R.E.N.™ Support Team',
    subject: 'Welcome to C.A.R.E.N.™ - Your Legal Protection is Active',
    text: `Welcome to C.A.R.E.N.™, ${userName}! Your account is now active. Visit https://carenalert.com/dashboard to get started. Questions? Email support@carenalert.com`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #ffffff; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #00d4ff; font-size: 2.5rem; margin: 0;">C.A.R.E.N.™</h1>
        <p style="color: #94a3b8; font-size: 1.1rem; margin: 5px 0 0 0;">Citizen Assistance for Roadside Emergencies and Navigation</p>
      </div>
      <div style="background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #00d4ff; margin: 0 0 20px 0;">Welcome, ${userName}!</h2>
        <p style="color: #e2e8f0; line-height: 1.6; margin: 0 0 15px 0;">Your account has been successfully created and your legal protection is now <strong style="color: #10b981;">ACTIVE</strong>.</p>
      </div>
      <div style="margin-bottom: 30px;">
        <h3 style="color: #00d4ff; margin: 0 0 20px 0;">🛡️ Your Protection Includes:</h3>
        <div style="background: rgba(15, 23, 42, 0.8); border-radius: 8px; padding: 20px;">
          <ul style="color: #e2e8f0; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li><strong style="color: #10b981;">GPS-Enabled Legal Rights</strong> - Automatic location-based legal information</li>
            <li><strong style="color: #10b981;">Voice-Controlled Recording</strong> - Hands-free emergency documentation</li>
            <li><strong style="color: #10b981;">Instant Attorney Access</strong> - Connect with legal professionals immediately</li>
            <li><strong style="color: #10b981;">Emergency Notifications</strong> - Automatic contact alerting with GPS coordinates</li>
          </ul>
        </div>
      </div>
      <div style="text-align: center; margin: 40px 0;">
        <a href="https://carenalert.com/dashboard" style="background: linear-gradient(135deg, #00d4ff 0%, #0ea5e9 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; display: inline-block;">Access Your Dashboard</a>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #00d4ff; font-weight: bold; margin: 0;">Stay Safe and Protected,</p>
        <p style="color: #94a3b8; margin: 5px 0 0 0;">The C.A.R.E.N.™ Team</p>
      </div>
    </div>
    `,
  });
}

export async function sendDirectGoogleWelcomeEmail({ email, firstName }: DirectEmailParams): Promise<boolean> {
  const userName = firstName || email.split('@')[0];

  return sendEmail({
    to: email,
    from: 'info@carenalert.com',
    fromName: 'C.A.R.E.N.™ Support Team',
    subject: 'Welcome to C.A.R.E.N.™ - Google Account Connected Successfully',
    text: `Welcome to C.A.R.E.N.™, ${userName}! Your Google account has been connected and your legal protection is now active. Visit https://carenalert.com/dashboard to get started.`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #ffffff; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #00d4ff; font-size: 2.5rem; margin: 0;">C.A.R.E.N.™</h1>
        <p style="color: #94a3b8; font-size: 1.1rem; margin: 5px 0 0 0;">Citizen Assistance for Roadside Emergencies and Navigation</p>
      </div>
      <div style="background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #00d4ff; margin: 0 0 20px 0;">Google Account Connected!</h2>
        <p style="color: #e2e8f0; line-height: 1.6; margin: 0 0 15px 0;">Welcome, ${userName}! Your Google account has been successfully connected and your legal protection is now <strong style="color: #10b981;">ACTIVE</strong>.</p>
      </div>
      <div style="text-align: center; margin: 40px 0;">
        <a href="https://carenalert.com/dashboard" style="background: linear-gradient(135deg, #00d4ff 0%, #0ea5e9 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; display: inline-block;">Access Your Dashboard</a>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #00d4ff; font-weight: bold; margin: 0;">Stay Safe and Protected,</p>
        <p style="color: #94a3b8; margin: 5px 0 0 0;">The C.A.R.E.N.™ Team</p>
      </div>
    </div>
    `,
  });
}
