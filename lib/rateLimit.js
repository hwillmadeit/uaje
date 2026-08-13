// A deliberately simple in-memory fixed-window rate limiter — no Redis, no
// extra service to configure. This is a reasonable fit for a single-family
// app with low traffic.
//
// Honest limitation: on serverless platforms with multiple function
// instances (e.g. Vercel), this Map is per-instance, so the effective
// limit can be higher than `limit` under concurrent instances. If this
// app grows beyond a handful of users, swap this for Upstash Redis
// (`@upstash/ratelimit`) — same call signature, just a different backend.

const buckets = new Map();

export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count };
}
