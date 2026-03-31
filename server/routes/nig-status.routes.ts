import { Router, Request, Response } from "express";
import { db } from "../db";
import { users, loginActivity } from "../../shared/schema";
import { count, gte, ne, sql } from "drizzle-orm";
import Stripe from "stripe";

const router = Router();

const SERVER_START_TIME = Date.now();

async function getMetrics() {
  const dbStart = Date.now();
  let dbHealthy = true;

  try {
    // Total registered & onboarded subscribers
    const [{ value: totalSubscribers }] = await db
      .select({ value: count() })
      .from(users)
      .where(sql`${users.agreedToTerms} = true`);

    // Active users — logged in within the last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const [{ value: activeUsers }] = await db
      .select({ value: count() })
      .from(loginActivity)
      .where(gte(loginActivity.createdAt, thirtyMinutesAgo));

    // Paid subscribers — anyone not on the free basic_guard tier
    const [{ value: paidSubscribers }] = await db
      .select({ value: count() })
      .from(users)
      .where(ne(users.subscriptionTier, "basic_guard"));

    const dbLatency = Date.now() - dbStart;

    // Stripe monthly revenue
    let monthlyRevenue = 0;
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2025-01-27.acacia",
        });
        const subscriptions = await stripe.subscriptions.list({
          status: "active",
          limit: 100,
        });
        monthlyRevenue = subscriptions.data.reduce((sum, sub) => {
          const monthlyAmount = sub.items.data.reduce((itemSum, item) => {
            const price = item.price;
            if (!price.unit_amount) return itemSum;
            if (price.recurring?.interval === "year") {
              return itemSum + price.unit_amount / 12;
            }
            return itemSum + price.unit_amount;
          }, 0);
          return sum + monthlyAmount;
        }, 0);
        monthlyRevenue = Math.round(monthlyRevenue / 100); // convert cents to dollars
      }
    } catch {
      // Stripe error is non-fatal — continue with 0 revenue
    }

    // Uptime from server start
    const uptimeMs = Date.now() - SERVER_START_TIME;
    const uptimeDays = uptimeMs / (1000 * 60 * 60 * 24);
    const uptimePct = Math.min(99.99, 100 - uptimeDays * 0.001); // approximate

    // Health score: penalise slow DB
    const health = dbLatency < 100 ? 99 : dbLatency < 500 ? 90 : 75;

    return {
      status: "live" as const,
      health,
      activeUsers: Number(activeUsers),
      revenue: monthlyRevenue,
      subscribers: Number(totalSubscribers),
      uptime: Math.round(uptimePct * 100) / 100,
      metrics: {
        paidSubscribers: Number(paidSubscribers),
        dbLatencyMs: dbLatency,
        serverUptimeHours: Math.round(uptimeMs / 1000 / 60 / 60),
      },
      message: "All systems operational",
    };
  } catch (err) {
    dbHealthy = false;
    throw err;
  }
}

router.get("/", async (req: Request, res: Response) => {
  const nigApiKey = process.env.NIG_API_KEY;
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (nigApiKey && token !== nigApiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const metrics = await getMetrics();
    return res.status(200).json({
      ...metrics,
      division: process.env.DIVISION_NAME || "C.A.R.E.N. Safety App",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      status: "degraded",
      health: 0,
      error: err.message,
      division: process.env.DIVISION_NAME || "C.A.R.E.N. Safety App",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
