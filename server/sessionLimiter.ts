import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const TIER_SESSION_LIMITS: Record<string, number> = {
  basic_guard: 1,
  safety_pro: 1,
  constitutional_pro: 1,
  family_protection: 6,
  enterprise_fleet: 999,
};

const DEFAULT_LIMIT = 1;

async function getUserTier(userId: string): Promise<string> {
  try {
    const result = await pool.query(
      `SELECT subscription_tier FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    return result.rows[0]?.subscription_tier ?? "basic_guard";
  } catch {
    return "basic_guard";
  }
}

export async function enforceSessionLimit(
  userId: string,
  currentSid: string
): Promise<void> {
  try {
    const tier = await getUserTier(userId);
    const limit = TIER_SESSION_LIMITS[tier] ?? DEFAULT_LIMIT;

    if (limit >= 999) return;

    // Get all active sessions for this user, newest first
    const result = await pool.query(
      `SELECT sid, expire FROM sessions
       WHERE sess->>'userId' = $1
         AND expire > NOW()
       ORDER BY expire DESC`,
      [userId]
    );

    const sessions = result.rows;

    if (sessions.length <= limit) return;

    // Keep the `limit` newest — evict the rest
    // Always keep the current session if it's within the limit
    const currentIndex = sessions.findIndex((s) => s.sid === currentSid);

    let keepSids: string[];
    if (currentIndex !== -1 && currentIndex < limit) {
      keepSids = sessions.slice(0, limit).map((s) => s.sid);
    } else {
      // Current session isn't in the top N — bump it in by evicting the oldest of the top N
      const others = sessions.filter((s) => s.sid !== currentSid).slice(0, limit - 1);
      keepSids = [currentSid, ...others.map((s) => s.sid)];
    }

    const toEvict = sessions
      .filter((s) => !keepSids.includes(s.sid))
      .map((s) => s.sid);

    if (toEvict.length > 0) {
      await pool.query(`DELETE FROM sessions WHERE sid = ANY($1::varchar[])`, [
        toEvict,
      ]);
      console.log(
        `[SESSION_LIMIT] User ${userId} (tier: ${tier}, limit: ${limit}) — evicted ${toEvict.length} session(s)`
      );
    }
  } catch (err) {
    console.error("[SESSION_LIMIT] Error enforcing session limit:", err);
  }
}

export function sessionLimiterMiddleware() {
  return async (req: any, res: any, next: any) => {
    const userId: string | undefined =
      (req.session as any)?.userId || (req.session as any)?.user?.id;

    if (userId && !(req.session as any).__sessionLimitChecked) {
      (req.session as any).__sessionLimitChecked = true;
      // Run async — don't block the request
      enforceSessionLimit(userId, req.sessionID).catch(() => {});
    }

    next();
  };
}
