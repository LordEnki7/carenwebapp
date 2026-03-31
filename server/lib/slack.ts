const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_REAL;

async function sendSlackMessage(blocks: object[], text: string) {
  if (!SLACK_WEBHOOK) {
    console.log("[SLACK] No webhook configured, skipping notification");
    return;
  }
  try {
    const res = await fetch(SLACK_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, blocks }),
    });
    if (!res.ok) console.error("[SLACK] Failed to send:", await res.text());
    else console.log("[SLACK] Notification sent:", text);
  } catch (err) {
    console.error("[SLACK] Error sending notification:", err);
  }
}

export async function notifyNewSignup(name: string, email: string, platform: string) {
  await sendSlackMessage(
    [
      {
        type: "header",
        text: { type: "plain_text", text: "🎉 New Tester Signup!", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Name:*\n${name}` },
          { type: "mrkdwn", text: `*Email:*\n${email}` },
          { type: "mrkdwn", text: `*Platform:*\n${platform}` },
          { type: "mrkdwn", text: `*Time:*\n${new Date().toLocaleString()}` },
        ],
      },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: "C.A.R.E.N.™ Early Access Program" }],
      },
    ],
    `🎉 New tester signup: ${name} (${email}) on ${platform}`
  );
}

export async function notifySOS(userName: string, location: string, alertType: string, urgency: string) {
  await sendSlackMessage(
    [
      {
        type: "header",
        text: { type: "plain_text", text: "🚨 SOS EMERGENCY ALERT", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*User:*\n${userName}` },
          { type: "mrkdwn", text: `*Type:*\n${alertType}` },
          { type: "mrkdwn", text: `*Urgency:*\n${urgency}` },
          { type: "mrkdwn", text: `*Location:*\n${location || "Unknown"}` },
          { type: "mrkdwn", text: `*Time:*\n${new Date().toLocaleString()}` },
        ],
      },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: "⚠️ C.A.R.E.N.™ Emergency Response System" }],
      },
    ],
    `🚨 SOS Alert from ${userName} — ${alertType} (${urgency}) at ${location}`
  );
}

export async function notifyNewPayment(planName: string, amount: string, email?: string) {
  await sendSlackMessage(
    [
      {
        type: "header",
        text: { type: "plain_text", text: "💳 New Subscription Payment!", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Plan:*\n${planName}` },
          { type: "mrkdwn", text: `*Amount:*\n${amount}` },
          { type: "mrkdwn", text: `*Customer:*\n${email || "Unknown"}` },
          { type: "mrkdwn", text: `*Time:*\n${new Date().toLocaleString()}` },
        ],
      },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: "💰 C.A.R.E.N.™ Revenue — Stripe" }],
      },
    ],
    `💳 New payment: ${planName} — ${amount} from ${email || "unknown"}`
  );
}
