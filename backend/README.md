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
All game routes require a signed-in account.

- POST `/v1/games/start` starts a Daily or Freeplay round for a difficulty.
- POST `/v1/games/resume` looks up the signed-in player's case by current UTC day, mode and difficulty.
- POST `/v1/games/state`, `/v1/games/guess`, `/v1/games/reveal`, `/v1/games/overlay` and `/v1/games/finish` take the game ID and validate its owner.
- POST `/v1/games/save` is idempotent. New completions save the result and update the leaderboard in the same database transaction.

An account can play one Daily case and repeated Freeplay rounds per difficulty. Both modes contribute to the best verified score per account, difficulty and UTC day. The ranking adds the improvement over the previous best. Ties on points go to the lower total time of the successful daily results counted in that period. A faster win with the same score can replace that day's result without adding points. Visitors without an account play locally. The server selects the target and calculates the score, with the same evidence, feedback and prices as the browser. Applying the schema adds the new rules version and millisecond start time to new sessions. Existing sessions retain their original clue order.

### Leaderboard access and request economy
The leaderboard has **no IP cooldown or Worker-side rate limit**. A blocked
request would still consume a Workers Free invocation. The browser can show the last public board immediately. It fetches fresh
data when opened, after a verified result and once a minute while visible.
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
