# Cartigma Ranking API (staging)

Independent Cloudflare Worker + D1 backend for registered leaderboard players.
No production Cloudflare resources are provisioned by committing these files.
The existing casual game remains entirely local.

## Secrets
Set these with `wrangler secret put`, never in source control:
- `AUTH_PEPPER`: at least 32 random bytes, used with password hashing
- `GAME_SECRET`: at least 32 independent random bytes, HMAC daily target
- `TURNSTILE_SECRET` (recommended): Cloudflare Turnstile secret, required to
  enable user registration once a sitekey has been configured
- `RESEND_API_KEY` and `RESET_FROM_EMAIL` (optional): password reset email.
  Password recovery is disabled until both values exist.

## Provisioning (explicit separate operation)
1. Create `cartigma-ranking-staging` with `wrangler d1 create`.
2. Replace the placeholder D1 UUID in `wrangler.toml` with the actual UUID.
3. Apply `schema.sql` using `wrangler d1 execute ... --remote --file schema.sql`.
4. Set secrets. Deploy to a staging workers.dev URL; use a custom `api.cartigma.f404x.net` hostname only after review.
5. Configure `APP_ORIGIN` to the exact frontend origin. API cookies work best on the custom subdomain, not across the workers.dev site.
6. Test login hash CPU use on Workers Free (10ms CPU cap). If this limit is exceeded, do **not** weaken password security; migrate authentication to a suitable service or a paid Worker.

### Public routes
- GET `/v1/health`
- GET `/v1/leaderboards` (one compact response: all 3 difficulties and all 3 periods)

### Auth routes
- POST `/v1/auth/register`, `/v1/auth/login`, `/v1/auth/logout`
- GET `/v1/auth/me`
- POST `/v1/auth/request-reset`, `/v1/auth/reset`, `/v1/auth/delete`

### Game routes
- POST `/v1/games/start` (guest allowed; provides a one-time play token)
- POST `/v1/games/guess`, `/v1/games/reveal`, `/v1/games/finish`
- POST `/v1/games/save` (requires authenticated account)

For each difficulty and UTC day, an account may save just one completed daily
challenge. Freeplay cannot enter the ranking. Only the server sees target
countries and computes scores.

### Spam/cooldown behavior
Leaderboard GET has an IP-based approximate 1 request / 60s limiter via Cloudflare
Rate Limiting binding. HTTP 429 includes Retry-After. Browser client stores a
5-minute cache and reuses it during cooldown, on 429, and while offline. This
reduces **normal client** calls but does not prevent malicious requests from
reaching the Worker. The limiter runs within the Worker and those rejected
invocations still count toward the 100k/day free tier. To protect that budget
against hostile traffic, add a Cloudflare WAF rate-limiting rule **before**
the Worker (subject to zone/plan availability). The limiter is approximate
per data center and shared-NAT users can be throttled together.

## Authentication hardening
The password KDF uses HMAC-SHA-256 with a private server-side pepper followed
by PBKDF2-HMAC-SHA-256 with a per-user random 16-byte salt and versioned
parameters. Cloudflare's PBKDF2 limit and Free CPU cap make full OWASP-grade
work factors difficult; benchmark on the actual runtime and upgrade before
enabling public account registration if needed. Sessions store only SHA-256
token hashes, are HttpOnly/Secure/SameSite=Lax, and expire after 14 days.

This is an integration branch; there is no automatic deploy to the main site.
