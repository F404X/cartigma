# Cartigma Ranking API (production and staging)

Independent Cloudflare Worker + D1 backend for registered leaderboard players.
The casual game remains fully local when this API is offline. Production and staging use **different Workers, D1 databases and secrets**; merging code alone does not configure Cloudflare.

## Secrets
Set these with `wrangler secret put`, never in source control:
- `AUTH_PEPPER`: at least 32 random bytes, used with password hashing
- `GAME_SECRET`: at least 32 independent random bytes, HMAC daily target
- `TURNSTILE_SECRET` (recommended): Cloudflare Turnstile secret, required to
  enable user registration once a sitekey has been configured
- `RESEND_API_KEY` and `RESET_FROM_EMAIL` (optional): password reset email.
  Password recovery is disabled until both values exist.

## Production deployment from main

The public site at `https://cartigma.f404x.net` calls `https://api.cartigma.f404x.net`.
The Worker domain is a **Cloudflare Worker Custom Domain**, not the GitHub Pages hostname. It is attached automatically by Wrangler only when Cloudflare credentials have the required permissions and the `f404x.net` zone is in the same account.

The workflow [`ranking-production.yml`](../.github/workflows/ranking-production.yml) runs on relevant changes to `main` and on manual dispatch. It:
1. Runs tests before deploying.
2. Reuses (or creates once) the `cartigma-ranking` production D1 database and applies the idempotent SQL schema. It never deletes a production D1 database.
3. Deploys `cartigma-ranking` on the custom domain using `wrangler.production.toml` and `APP_ORIGIN=https://cartigma.f404x.net`.
4. Creates independent `AUTH_PEPPER` and `GAME_SECRET` Worker secrets **only if missing**, never overwriting valid existing values. Rotating `AUTH_PEPPER` without rehashing existing passwords makes accounts inaccessible.
5. Checks `/v1/health`, leaderboard JSON, anonymous session endpoint and browser CORS preflight. An incomplete D1 schema or missing secrets returns HTTP 503 rather than an incorrectly healthy response.

### One-time GitHub/Cloudflare requirements

- Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as secrets in GitHub repository settings or its `ranking-production` environment. If these secrets exist only in `ranking-staging`, they are **not automatically visible** to the production environment.
- Scope the token to the correct Cloudflare account/zone and give it Workers edit/deploy, D1 edit, and zone/Workers Routes permissions needed to attach the custom domain. Ensure `f404x.net` is active in that account and no conflicting DNS or Worker routing blocks `api.cartigma.f404x.net`.
- Optional but recommended: create a Turnstile widget for `cartigma.f404x.net`, configure GitHub variable `CARTIGMA_TURNSTILE_SITE_KEY` and secret `CARTIGMA_TURNSTILE_SECRET` together. The workflow fails if only one is set. The site key is public; never commit the secret. If a secret already exists on the Worker, the workflow preserves it; rotate intentionally through Wrangler if necessary. Turnstile is not automatically provisioned by GitHub.
- Set WAF/rate protections for `api.cartigma.f404x.net` on Cloudflare. Authentication/game endpoints already have Worker-side rate limits, but the public leaderboard deliberately has no per-IP cooldown.
- Run the GitHub Action **Deploy Cartigma ranking API (production)** and verify its summary. A green static Pages deploy does not prove the API has been deployed.
- Benchmark the PBKDF2 authentication on the actual Cloudflare plan. If account registration/login exceeds CPU limits on Workers Free, use an appropriate paid plan or auth service; **do not weaken password hashing** to hide the issue.

Diagnostics: `GET https://api.cartigma.f404x.net/v1/health` must return HTTP 200 with all checks true, and `/v1/leaderboards` must return a JSON object with `boards.normal.week`. `/v1/auth/me` must return `{"user":null}` to an unauthenticated request, with `Access-Control-Allow-Origin: https://cartigma.f404x.net` when that origin is supplied. HTTP 503 means a missing binding, secret or schema. A DNS/SSL failure points to an unconfigured custom domain; a browser CORS failure usually means the Worker is on staging or `APP_ORIGIN` is wrong.

### Staging (separate from production)

`wrangler.toml` and [`ranking-deploy.yml`](../.github/workflows/ranking-deploy.yml) configure the isolated staging Worker at `cartigma-ranking-staging.foxythefox2017xd.workers.dev`. It does **not** serve the production API domain; its `APP_ORIGIN` intentionally matches the staging preview.

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

### Account match history

- GET `/v1/me/games` lists completed matches for the signed-in account, newest first. Follow `nextCursor` with `?before=` to load another page.
- GET `/v1/me/games/:id` returns the saved dossier for a completed match owned by the account. It includes the evidence and country profile snapshot, original guesses, duration and result even after the live game expires.

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

Production deploys independently from the static site after credentials and Cloudflare zone permissions are configured.
