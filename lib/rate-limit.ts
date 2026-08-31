/* Per-address rate limiting for the contact endpoint.

   In memory, and therefore per instance: on Vercel each warm serverless
   instance keeps its own table and a cold start begins at zero. So this is
   a speed bump, not a guarantee. It stops one client hammering the form —
   which is the realistic failure mode for a marketing site with a single
   public POST — and does nothing against a flood spread across addresses.
   The durable version is the same interface backed by Vercel KV or
   Upstash; see the note in README before reaching for it.

   The table is bounded. Keyed on something the caller controls, it would
   otherwise grow without limit under exactly the attack it exists to
   blunt, and the defence becomes the leak. */

/** Requests allowed per address per window.

    Sized for an address rather than a person, which is the distinction
    that matters here: the buyer is a firm, and a firm's partners share one
    office address. Several of them submitting in the same hour is a
    plausible good day, not an attack, so the ceiling has room for it.
    Failures that are our fault do not count against it — see release(). */
const LIMIT = 8;
const WINDOW_MS = 60 * 60 * 1000;

/** Ceiling on tracked addresses, ~a few hundred KB at full stretch. */
const MAX_KEYS = 5000;

const hits = new Map<string, number[]>();

export interface Verdict {
  ok: boolean;
  /** Seconds until the oldest hit ages out. Sent as Retry-After. */
  retryAfter: number;
}

/* Evict expired entries first, since they cost nothing to lose. If the
   table is still over its ceiling, drop whoever has been quiet longest —
   an address mid-burst is the one worth remembering. */
function evict(now: number) {
  for (const [key, times] of hits) {
    if (!times.length || now - times[times.length - 1] >= WINDOW_MS) hits.delete(key);
  }
  if (hits.size <= MAX_KEYS) return;
  const byAge = [...hits.entries()].sort((a, b) => a[1][a[1].length - 1] - b[1][b[1].length - 1]);
  for (const [key] of byAge.slice(0, hits.size - MAX_KEYS)) hits.delete(key);
}

export function rateLimit(key: string, now: number = Date.now()): Verdict {
  const times = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (times.length >= LIMIT) {
    hits.set(key, times);
    return { ok: false, retryAfter: Math.ceil((WINDOW_MS - (now - times[0])) / 1000) };
  }

  times.push(now);
  hits.set(key, times);
  if (hits.size > MAX_KEYS) evict(now);
  return { ok: true, retryAfter: 0 };
}

/* Vercel sets x-forwarded-for to the client address and overwrites
   anything the caller sent, so the first entry is trustworthy there. It is
   not trustworthy off Vercel, which is why this is one layer of several
   rather than the whole defence.

   Everything unattributable shares the "unknown" bucket. That is the
   conservative direction to fail, but it does mean a deployment sitting
   behind no proxy at all would put every visitor on earth in one bucket —
   worth knowing before this is hosted anywhere but Vercel. `next dev`
   attributes requests normally, so local work is unaffected. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/* Hand back the slot a request took. For failures the caller is not
   responsible for: a missing API key or a bad gateway is our problem, and
   charging a visitor five attempts for it would spend their quota on our
   outage and then hide the real error behind a 429. */
export function release(key: string) {
  const times = hits.get(key);
  if (!times?.length) return;
  times.pop();
  if (times.length) hits.set(key, times);
  else hits.delete(key);
}

/** Exported for the route's comments and for tests to stay in step. */
export const RATE_LIMIT = { LIMIT, WINDOW_MS } as const;
