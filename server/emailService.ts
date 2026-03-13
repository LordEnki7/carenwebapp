import { sendEmail } from './mailer';

interface WelcomeEmailParams {
  email: string;
  firstName?: string;
  lastName?: string;
}

export async function sendWelcomeEmail({ email, firstName, lastName }: WelcomeEmailParams): Promise<boolean> {
  const userName = firstName || email.split('@')[0];

  return sendEmail({
    to: email,
    from: 'info@carenalert.com',
    fromName: 'C.A.R.E.N.™ Support Team',
    subject: 'Welcome to C.A.R.E.N.™ - Your Legal Protection is Active',
    text: `Welcome to C.A.R.E.N.™, ${userName}!

Your account has been successfully created and your legal protection is now active.

C.A.R.E.N.™ (Citizen Assistance for Roadside Emergencies and Navigation) is here to protect you during traffic stops and emergency situations with:

✓ GPS-enabled legal rights information for your location
✓ Voice-controlled emergency recording
✓ Instant attorney communication
✓ Emergency contact notification
✓ Roadside assistance integration

Get started:
• Access your dashboard to explore features
• Set up your emergency contacts
• Review your state's legal rights
• Practice voice commands for emergency situations

Questions? Contact us at support@carenalert.com

Stay safe and protected,
The C.A.R.E.N.™ Team

---
This email was sent to ${email}. If you didn't create this account, please contact support@carenalert.com`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #ffffff; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #00d4ff; font-size: 2.5rem; margin: 0; text-shadow: 0 0 20px rgba(0, 212, 255, 0.3);">C.A.R.E.N.™</h1>
        <p style="color: #94a3b8; font-size: 1.1rem; margin: 5px 0 0 0;">Citizen Assistance for Roadside Emergencies and Navigation</p>
      </div>
      <div style="background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
        <h2 style="color: #00d4ff; margin: 0 0 20px 0; font-size: 1.5rem;">Welcome, ${userName}!</h2>
        <p style="color: #e2e8f0; line-height: 1.6; margin: 0 0 15px 0; font-size: 1.1rem;">Your account has been successfully created and your legal protection is now <strong style="color: #10b981;">ACTIVE</strong>.</p>
      </div>
      <div style="margin-bottom: 30px;">
        <h3 style="color: #00d4ff; margin: 0 0 20px 0;">🛡️ Your Protection Includes:</h3>
        <div style="background: rgba(15, 23, 42, 0.8); border-radius: 8px; padding: 20px;">
          <ul style="color: #e2e8f0; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li><strong style="color: #10b981;">GPS-Enabled Legal Rights</strong> - Automatic location-based legal information</li>
            <li><strong style="color: #10b981;">Voice-Controlled Recording</strong> - Hands-free emergency documentation</li>
            <li><strong style="color: #10b981;">Instant Attorney Access</strong> - Connect with legal professionals immediately</li>
            <li><strong style="color: #10b981;">Emergency Notifications</strong> - Automatic contact alerting with GPS coordinates</li>
            <li><strong style="color: #10b981;">Roadside Assistance</strong> - Integration with major providers</li>
          </ul>
        </div>
      </div>
      <div style="text-align: center; margin: 40px 0;">
        <a href="https://carenalert.com/dashboard" style="background: linear-gradient(135deg, #00d4ff 0%, #0ea5e9 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 1.1rem;">Access Your Dashboard</a>
      </div>
      <div style="border-top: 1px solid rgba(0, 212, 255, 0.3); padding-top: 30px; text-align: center;">
        <p style="color: #94a3b8; font-size: 0.9rem; margin: 0 0 10px 0;">Questions? Email us at <a href="mailto:support@carenalert.com" style="color:#00d4ff;">support@carenalert.com</a></p>
        <p style="color: #64748b; font-size: 0.8rem; margin: 0;">This email was sent to ${email}. If you didn't create this account, please contact support@carenalert.com</p>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #00d4ff; font-weight: bold; margin: 0;">Stay Safe and Protected,</p>
        <p style="color: #94a3b8; margin: 5px 0 0 0;">The C.A.R.E.N.™ Team</p>
      </div>
    </div>
    `,
  });
}

export async function sendGoogleWelcomeEmail({ email, firstName }: WelcomeEmailParams): Promise<boolean> {
  const userName = firstName || email.split('@')[0];

  return sendEmail({
    to: email,
    from: 'info@carenalert.com',
    fromName: 'C.A.R.E.N.™ Support Team',
    subject: 'Welcome to C.A.R.E.N.™ - Google Account Connected Successfully',
    text: `Welcome to C.A.R.E.N.™, ${userName}!

Your Google account has been successfully connected and your legal protection is now active.

You can now sign in quickly using your Google account while enjoying all the protection features C.A.R.E.N.™ offers.

Access your dashboard: https://carenalert.com/dashboard

Stay safe and protected,
The C.A.R.E.N.™ Team`,
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
