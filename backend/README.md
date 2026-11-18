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

For each difficulty and UTC day, an account may begin one ranked attempt,
independently of daily/free mode. Logged-in players start ranked automatically;
without an account, the original browser-only game runs with no API. Only the server sees target
countries and computes scores.

### Leaderboard access and request economy
The leaderboard has **no IP cooldown or Worker-side rate limit**. A blocked
request would still consume a Workers Free invocation. The browser keeps the
public board in localStorage for 15 minutes and reuses it while offline or
when the API is unavailable, without polling or a manual refresh button.
Authentication and game mutation endpoints still have separate, stricter
abuse protection. To protect the Workers quota itself, configure Cloudflare
WAF rules in front of the Worker on the production hostname.

### Password rules
New passwords (registration and reset) require **at least 8 characters**,
including a lowercase letter, an uppercase letter and a digit, using only
ASCII letters and digits. Existing passwords are still accepted at login.
The salted, peppered password hashing method is unchanged.

## Authentication hardening
The password KDF uses HMAC-SHA-256 with a private server-side pepper followed
by PBKDF2-HMAC-SHA-256 with a per-user random 16-byte salt and versioned
parameters. Cloudflare's PBKDF2 limit and Free CPU cap make full OWASP-grade
work factors difficult; benchmark on the actual runtime and upgrade before
enabling public account registration if needed. Sessions store only SHA-256
token hashes, are HttpOnly/Secure/SameSite=Lax, and expire after 14 days.

This is an integration branch; there is no automatic deploy to the main site.
