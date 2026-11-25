# StockSim

StockSim is a mobile web app for practicing investing with virtual money, without putting real savings at risk.

## Product Vision

We're building StockSim for college students and young adults aged 18-28 who are curious about investing but don't know where to start. Our goal is to give beginners a safe place to make investing decisions, see how those decisions affect a portfolio, and learn the concepts behind them. The app is intended to be mobile-first and explain unfamiliar terms without assuming prior investing experience.

## Proposed Experience

The original proposal includes:

- Starting with $10,000 in simulated cash.
- Browsing stock and ETF prices, charts, and company information.
- Practicing buying and selling stocks with virtual money.
- Tracking holdings, portfolio value, gains, and losses.
- Learning investing concepts through short, contextual lessons.
- An optional leaderboard and achievement badges.


## Project Origin

StockSim was proposed by Abhishek. In principle, many people are afraid of losing real money, so they never try investing at all. StockSim lets them practice with virtual cash first, without that fear.

See the [original StockSim proposal](https://github.com/Zho29/project-proposal/blob/main/README.md) for the initial concept and proposed scope.

## Team

Sprint 0 roles:

- Hanzalah Siraj - Product Owner, GitHub: [hanza-siraj](https://github.com/hanza-siraj)
- Abhishek Subedi - Scrum Master, GitHub: [zho29](https://github.com/zho29)
- Brittany (Yutong) Liu - GitHub: [brittany660016](https://github.com/brittany660016)
- Sam Fiallos - GitHub: [samthropic](https://github.com/samthropic)

Sprint 1 roles:

- Sam Fiallos - Product Owner, GitHub: [samthropic](https://github.com/samthropic)
- Brittany (Yutong) Liu - Scrum Master, GitHub: [brittany660016](https://github.com/brittany660016)
- Hanzalah Siraj - GitHub: [hanza-siraj](https://github.com/hanza-siraj)
- Abhishek Subedi - GitHub: [zho29](https://github.com/zho29)

Sprint 2 roles:

- Abhishek Subedi - Product Owner, GitHub: [zho29](https://github.com/zho29)
- Hanzalah Siraj - Scrum Master, GitHub: [hanza-siraj](https://github.com/hanza-siraj)
- Sam Fiallos - GitHub: [samthropic](https://github.com/samthropic)
- Brittany (Yutong) Liu - GitHub: [brittany660016](https://github.com/brittany660016)

## Contributing

Read our [contribution guide](CONTRIBUTING.md) for the team's process and contribution rules.

## Project Links

- [Shared project repository](https://github.com/agile-students-fall2026/StockSim)
- [Original proposal](https://github.com/Zho29/project-proposal/blob/main/README.md)

## Run the frontend locally

Use Node.js 24 or newer. From the repository root:

```bash
cd front-end
npm ci
npm run dev -- --host 127.0.0.1
```

Keep the backend running in a second terminal (see below). Open
http://localhost:5173, create an account, then log in to visit `/market` and the
other app sections. Run checks from `front-end/`:

```bash
node --test tests/*.test.js
npm run lint
npm run build
```

### Market demo (#69–#71)

- `/market`: browse fictional practice investments. Submit a company name or ticker
  with Enter or Search to call the backend company-search API. Search results are
  informational only, with no prices or trading links.
- `/market/NOVA`: inspect a stock and switch between Day, Week, and All
  chart periods. Tap the chart or use the labeled slider to
  inspect a historical price. Unknown tickers show an unavailable state.
- `/market/watchlist`: view saved investments. Add from stock details; removal
  requires confirmation and can be canceled.
- `/market/NOVA/buy` and `/market/NOVA/sell`: enter whole shares, review an
  estimate, then confirm a simulated trade. Insufficient cash, invalid quantities,
  and selling more shares than owned are rejected. Confirmation updates virtual
  cash and holdings and produces a receipt.

The practice investment data comes from `front-end/public/mock/market.json`, a seeded, generated
fixture served as a mock endpoint. Companies, prices, and history are fictional;
there are no live quotes or real trades in the practice account. Future backend integration
should replace this endpoint and the practice account adapter.

The compact fixture keeps the same six investments and current quotes, with
14 daily points and 4 intraday samples per investment (108 points total).
Day uses the intraday samples, Week uses the last 7 daily points, and All means
all 14 available days, not a full year. Each point occupies one readable JSON line.

The demo starts with $10,000 and no holdings. Watchlist, virtual balance, holdings,
and trade records persist in this browser's `stocksim-practice-v1:<user-id>`
localStorage entry. Each signed-in account has a separate practice account;
logging out unmounts that account's state. Older anonymous demo data is not
imported. This remains browser-local demo data, not server persistence; use one
tab at a time. If storage is unavailable, a notice explains that changes
last only for the current page session. Portfolio summary, holding details,
transaction history, transaction details, and the current Performance totals use
this same account and market quotes. Holding Buy/Sell links open the selected
investment's ticket. Completed trades link to Portfolio and their transaction.
Average purchase price is reconstructed from the saved trades using weighted
average cost; incomplete purchase history is shown as unavailable. Missing market
quotes show an error instead of silently understating the portfolio value.

The Performance chart remains the team's separate sample historical series,
clearly labeled as such; it is not a history of this account. Account and Profile show the signed-in user. Leaderboard standings and
learning/achievement data remain samples and are not synchronized with trading. Live quote refresh,
server execution, pending/unknown order states, and contextual learning overlays
are not implemented in this demo.

## Run the backend locally

Use Node.js 24 or newer. From the repository root:

```bash
cd back-end
npm ci
npm run dev
```

The Express API runs on port `3001` by default. To change it, copy
`back-end/.env.example` to `back-end/.env` and set `PORT`. Node loads this
optional file automatically. Use `npm start` to run without watching files.

Check that the server is running:

```bash
curl http://localhost:3001/api/health
```

The health route returns `200` with `{"status":"ok"}`. The API provides these
authentication routes:

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Read the current user; requires login |
| POST | `/api/auth/forgot-password` | Request a reset link |
| POST | `/api/auth/reset-password` | Set a new password |

Registration, login, logout, forgot/reset password, and the protected
`GET /api/auth/me` endpoint are connected to the React frontend.

### Connected browser authentication (step 5)

Run the backend and frontend in separate terminals. Vite forwards relative
`/api` requests to `http://127.0.0.1:3001`, keeping requests and the HttpOnly
session cookie on the browser's origin. No browser CORS configuration is needed.
If the API uses another port, start Vite with, for example,
`API_PROXY_TARGET=http://127.0.0.1:3002 npm run dev`. Vite preview uses the same
proxy. Set backend `FRONTEND_ORIGIN` to the exact frontend origin you use for
password-reset links (default `http://localhost:5173`).

- Create account validates through the API and returns to login with the email
  prefilled. It does not automatically log in.
- Login sends credentials to the API. Protected app routes require a valid
  session, restore it through `/api/auth/me` on refresh, and recheck on navigation,
  window focus, and once a minute while visible. API failures offer a retry;
  `401` returns to login. A successful login returns to the requested app page.
- Account and Profile display the current user's public details. Logout calls
  the server before clearing local auth state; a failed request offers retry.
  JWTs and passwords are never stored in localStorage or sessionStorage.
- Forgot password and Account → Reset password request an email link. With
  Ethereal configured, open the message in its browser inbox (setup below).
  Without SMTP, open the newest `back-end/.mail/*.json` and copy the URL from
  its `text` field into the browser. `/reset-password#token=...` reads the token into
  page memory and removes it from the address bar. Submit matching passwords,
  then log in again. Reloading after the fragment is removed requires reopening
  the email link. Invalid or expired links offer a new request.

Users, sessions, and reset tokens remain in memory: restarting the backend
clears them, including automatic development restarts. No database is added.
Financial demo data remains in browser storage; the frontend route guard does
not add server authorization to other API endpoints.

For deployment, serve the frontend and reverse-proxy `/api` to Express on the
same HTTPS origin, with the backend's production configuration below. The Vite
proxy is a local development/preview facility, not the production server.

### Account registration (#77)

`POST /api/auth/register` accepts a JSON object with these required fields:

- `name`: text, 1 to 80 characters after trimming surrounding whitespace.
- `email`: a valid email address, at most 254 characters. Surrounding whitespace
  is trimmed and the address is lowercased for duplicate detection. Provider
  aliases such as Gmail dots or plus-addresses are not rewritten.
- `password`: text, 8 to 128 characters, not entirely whitespace. Passwords are
  never trimmed or silently changed.

Example request:

```bash
curl -i http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  --data '{"name":"Jordan Avery","email":"jordan@example.com","password":"practice-password"}'
```

A successful request returns `201` with a `user` object containing `id`, `name`,
`email`, and `createdAt`. The response does not contain a password/hash or
establish a login session. Invalid inputs return
`400` with `error.code` set to `VALIDATION_ERROR` and field messages in
`error.fields`. An existing email returns `409` with `EMAIL_IN_USE`. Error
responses do not echo submitted passwords. Extra fields such as `role`, `id`,
and `passwordHash` are ignored.

Passwords use Node's asynchronous scrypt with a random 16-byte salt and
N=32768, r=8, p=3. The encoded hash stores those parameters with the salt so it
can be verified at login. These are among the
[OWASP scrypt settings](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt).

Users live only in an in-memory store and disappear when the server restarts,
including automatic restarts during development. There is no database work in
this step. The store exposes asynchronous `findByEmail(email)`, `findById(id)`, and
`create({ name, email, passwordHash })` methods so the database teammate can
replace it later. Password recovery also uses
`updatePassword(id, passwordHash, expectedAuthVersion)`: atomically match the
account's current `authVersion`, update the hash, and increment that version.
Return the updated user or `null` when the account/version does not match.
New users start with version `0`; this internal field is not returned by the API.
Emails passed to this interface must already be normalized;
`create` must reject duplicates atomically with `DuplicateEmailError`. The current
adapter prevents simultaneous duplicate requests from overwriting an account
within the running server process.


### Login, logout, and protected access (#78)

`POST /api/auth/login` accepts JSON with `email` and `password`. Email is trimmed
and lowercased as at registration; passwords are preserved exactly. Malformed
fields return `400`. An incorrect password and an unknown email both return
`401` with the same `INVALID_CREDENTIALS` error. Login verifies the stored scrypt
hash and returns only public user details, not passwords, hashes, or a JWT in JSON.

Successful login sets a `stocksim_session` HttpOnly, SameSite=Strict cookie for
`/api`. The signed JWT expires after 15 minutes and checks its HS256 signature,
issuer, audience, expiry, and a matching active session in memory. Protected
access also checks the account password version so an in-flight login cannot
restore access using a password that has just been reset. The protected
`GET /api/auth/me` endpoint returns `200` with the current public user, or `401`
when authentication is missing, expired, invalid, or revoked. The reusable
`requireAuth` middleware can protect additional backend routes when those are
integrated. Query-string and Bearer tokens are not accepted; this API uses cookies.

`POST /api/auth/logout` revokes that session and clears its cookie, returning
`204` even if already logged out. Copying the old JWT does not bypass logout.
Another login from the same browser replaces its existing session; separately
logged-in devices keep their own sessions. Users and active sessions both reset
when this temporary server restarts. Authentication responses use `Cache-Control:
no-store`.

Login allows at most 10 failed requests per client IP per 15 minutes; further
requests return `429` with a retry header. Successful logins do not consume that
failed-attempt allowance. Browser authentication submissions reject untrusted
origins and cross-site Fetch Metadata headers. The API's own origin, the configured
`FRONTEND_ORIGIN` (default `http://localhost:5173`), and `http://127.0.0.1:5173`
are allowed. API tools without browser origin headers are supported. The frontend uses the same-origin Vite proxy described above; cookie-bearing
requests do not require cross-origin CORS.

In development, an omitted/empty `JWT_SECRET` generates a random in-memory key.
For production (`NODE_ENV=production`), set a secret of at least 32 bytes in the
ignored `back-end/.env` file or environment. Production cookies are also Secure
and require HTTPS. Generate a random secret locally with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Do not commit the generated value. `.env.example` contains only configuration
names and safe defaults. Keep using the same hostname for the commands below
so the cookie jar works (the example uses `localhost` throughout).

After registering the example user above, test the full login flow:

```bash
# Save the cookie without printing the JWT in the terminal.
# Run these commands in the same terminal session.
auth_cookie_jar=$(mktemp)
curl -sS -c "$auth_cookie_jar" http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  --data '{"email":"jordan@example.com","password":"practice-password"}'

# Expect 200 and the current user.
curl -i -b "$auth_cookie_jar" http://localhost:3001/api/auth/me

# Expect 204, followed by 401 even when the old cookie is sent again.
curl -i -b "$auth_cookie_jar" -X POST http://localhost:3001/api/auth/logout
curl -i -b "$auth_cookie_jar" http://localhost:3001/api/auth/me
rm "$auth_cookie_jar"
```


### Forgot and reset password (#79)

`POST /api/auth/forgot-password` accepts `{ "email": "jordan@example.com" }`.
The email is validated and normalized as at registration. A valid request
returns `202` with the same message for known and unknown accounts:

```json
{"message":"If an account exists for that email, you will receive a password reset link."}
```

Account lookup and delivery run in a bounded asynchronous queue, outside the
response. No token, reset URL, recipient address, or account-existence flag is
returned. Each client IP can make five forgot-password requests per 15 minutes;
additional requests return `429`. Delivery failures retain the same generic
response, invalidate the undelivered token, and log only a generic delivery
failure message. Pending delivery work is capped at 100 jobs.

Reset links contain a cryptographically random 32-byte token, valid for
15 minutes and usable once. Only its SHA-256 digest is retained in the temporary
token store. A new request replaces any earlier active link for that account.
Links are built from the configured `FRONTEND_ORIGIN`, never the request Host
header, and use `/reset-password#token=...`. The fragment keeps the token out of
the HTTP request URL and referrers. In production this configured origin must
use HTTPS. The public frontend reset page reads this fragment and posts the
new password to the API. It removes the fragment from browser history and does
not persist the token in browser storage.

`POST /api/auth/reset-password` accepts JSON with `token`, `password`, and
`confirmPassword`. The new password follows the registration policy (8 to 128
characters, not entirely whitespace, and never trimmed). Confirmation must
match exactly. Missing/malformed fields return `400 VALIDATION_ERROR` with field
messages. Invalid, expired, superseded, or reused tokens return the same
`400 INVALID_RESET_TOKEN` error. There is no public token-inspection endpoint.

A successful reset returns `200` with a confirmation message, saves a new
salted password hash, consumes all outstanding reset links for the account,
revokes its existing login sessions, and clears the current browser's auth
cookie. Other accounts' sessions remain valid. The user must log in again;
resetting does not automatically create a session. A token can be claimed by
only one concurrent reset. An account-version check prevents overwriting a
password changed concurrently. Validation or storage failures do not consume a
still-valid link; a superseded link is never resurrected.

#### Development email outbox

No email account is needed for local testing. When `SMTP_HOST` is empty, emails
are generated with Nodemailer's JSON transport into `back-end/.mail/*.json`.
Open the newest file in an editor and read its `text` field for the reset link.
These are local previews; they are not delivered to a real inbox. The directory
is private (0700), files are private (0600), the directory is Git-ignored, and
there is no HTTP route serving it. Do not copy real reset links into issues or
commit preview files.

Keep the backend running and first register the sample account using the
registration request above. Then request a link:

```bash
curl -i http://localhost:3001/api/auth/forgot-password \
  -H 'Content-Type: application/json' \
  --data '{"email":"jordan@example.com"}'
```

After the preview appears in `back-end/.mail`, copy the 64-character value after
`#token=` into `reset_token` in another terminal, then submit it:

```bash
reset_token='COPY_TOKEN_HERE'
curl -i http://localhost:3001/api/auth/reset-password \
  -H 'Content-Type: application/json' \
  --data "{\"token\":\"$reset_token\",\"password\":\"new-practice-password\",\"confirmPassword\":\"new-practice-password\"}"
```

Expect `200`. Submitting that same token again returns `400`; logging in with
the old password returns `401`, while `new-practice-password` works. Users,
active sessions, reset tokens, and queued delivery work are in memory and reset
on server restart. Email preview files may remain on disk but old links stop
working. Automatic development restarts also clear this temporary state.

#### Ethereal browser inbox for demos

For a free browser inbox, create a test SMTP account at
[ethereal.email](https://ethereal.email/) and copy its settings into the ignored
`back-end/.env`. Each developer should create their own test account; do not
share or commit its credentials. No additional dependencies are needed.

```dotenv
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=YOUR_ETHEREAL_USERNAME
SMTP_PASS=YOUR_ETHEREAL_PASSWORD
MAIL_FROM="StockSim <YOUR_ETHEREAL_USERNAME>"
FRONTEND_ORIGIN=http://127.0.0.1:5173
```

Restart the backend after changing `.env`, then open http://127.0.0.1:5173.
Register a dummy address such as `user123@example.com` and request a reset.
Sign in at [Ethereal](https://ethereal.email/login) using `SMTP_USER` and
`SMTP_PASS` from your local `.env`, then open its Messages inbox and the reset
email. Click the link to set a new password; the old password must stop working.
The account must exist in the currently running StockSim backend first.

Ethereal captures SMTP messages addressed to real or made-up recipients. It
never delivers them to Gmail or other real inboxes. In this mode, messages are
in Ethereal rather than the local JSON outbox. The browser still gets the same
generic recovery response, without SMTP credentials or reset tokens. Use dummy
data for this development-only mailbox. Keep the backend running while testing;
a restart invalidates temporary accounts and reset links.

#### Optional SMTP delivery

For delivery through a development SMTP server or email provider, configure
`SMTP_HOST`, `SMTP_PORT` (default 587; 465 uses implicit TLS), `SMTP_USER`,
`SMTP_PASS`, and `MAIL_FROM` in the ignored backend `.env`. Credentials must be
provided together when authentication is used. Production requires SMTP
configuration and TLS, and never falls back to local preview files. Connection,
greeting, and socket timeouts are bounded. Transport debugging is disabled to
avoid logging credentials or reset messages. Tests use local previews or injected
transports and do not use external SMTP. Verify delivery separately whenever
you configure a provider; Ethereal captures test mail rather than delivering
it to recipients.

The reset implementation follows the
[OWASP forgot-password guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

Requests use JSON with a 10 KB body limit. Malformed JSON, oversized bodies,
and unknown routes return JSON errors with statuses `400`, `413`, and `404`.

Run backend checks from `back-end/`:

```bash
npm run lint
npm test
npm run test:coverage
```

Tests use Mocha, Chai, and Supertest. `frontendAuthIntegration.test.js` also
exercises the actual frontend API client against isolated Express servers for
registration, login/logout, session expiry, recovery, and request failures.
These tests need only the backend dependencies and do not send real email.
The c8 command reports coverage for all
backend source files, writes an HTML report to `back-end/coverage/index.html`,
and enforces the course's minimum 10% coverage requirement.

### Stock search API (#87)

`GET /api/stocks/search?q=Apple` searches company names or ticker symbols using
Alpha Vantage's `SYMBOL_SEARCH` endpoint. Set `ALPHA_VANTAGE_API_KEY` in the
backend-only `.env` (see `.env.example`), then restart the backend. Never put
this key in frontend code, a `VITE_` variable, logs, or version control.
No key is included; without one, valid searches return `503 SEARCH_NOT_CONFIGURED`.

Success returns `{ query, results, count }`. Each result has `symbol`, `name`,
`type`, `region`, and `currency`; unavailable optional fields are `null`.
No matches returns `200` with an empty array. Queries are trimmed first, so
leading/trailing whitespace (including tabs and newlines) is removed. A missing,
blank, repeated, over-100-character trimmed query, or a query still containing
control characters after trimming returns `400 INVALID_QUERY`.
Upstream quota errors return `503 SEARCH_RATE_LIMITED`, timeouts return
`504 SEARCH_TIMEOUT`, and invalid/upstream failures return `502 SEARCH_UNAVAILABLE`.
Errors use the existing `{ error: { code, message } }` envelope, not upstream details.

The free provider allowance is currently 25 requests/day. Trigger searches on
explicit submission rather than every keystroke. Each server process caches
up to 100 queries for five minutes and combines identical in-flight requests.
A quota response pauses new upstream requests for one minute; a daily quota
may remain exhausted much longer. Caches/cooldowns reset on server restart and
are not shared across instances. This is not a production quota enforcement system.
The endpoint is currently public: distinct queries can consume the shared API
allowance. Add access controls and a shared request budget before public deployment.

Run `npm run lint`, `npm test`, and `npm run test:coverage` inside `back-end/`.
Search tests inject simulated provider responses and never need a real key or
external network. Live provider integration still needs validation with a valid
key. The Market page uses this endpoint only on explicit submission, with loading,
empty, and error states. The fictional practice list and trading remain separate;
company-search results do not link to fictional stock details. Run both backend
and frontend for local search: Vite forwards `/api` to `http://127.0.0.1:3001`.
If the backend uses a different port, update that proxy target. This development
proxy does not apply to a production build; the production host must route `/api`
to the backend on the same origin. No live quotes or server watchlist persistence
are added.

Provider references: https://www.alphavantage.co/documentation/#symbolsearch
and https://www.alphavantage.co/support/api-key/ .

### Stock quotes (#88)

`GET /api/stocks/AAPL/quote` looks up a normalized ticker via Alpha Vantage
`GLOBAL_QUOTE`, using the same server-only `ALPHA_VANTAGE_API_KEY` as search.
It returns `symbol`, `price`, `change`, `changePercent`, `tradingDate`,
`quoteTimestamp`, `fetchedAt`, and `dataTiming`. `changePercent` is in percentage
points (e.g. 1.2 means 1.2%). Alpha Vantage's default quote is updated at
end of day and gives a trading date, not an exact timestamp. Exact quote time
is therefore `null`; `fetchedAt` is when our server fetched the data, not a
market timestamp. Do not present this data as live. See the
[provider documentation](https://www.alphavantage.co/documentation/#latestprice).

Malformed symbols return 400; provider-confirmed missing quotes return 404.
Missing configuration, quota responses, or too many concurrent upstream requests return 503;
upstream timeout returns 504 and other provider failures return 502. Errors
do not forward provider responses or keys. Success is cached for 15 minutes
and missing quotes for one minute. Each process coalesces identical requests,
limits quote requests in flight to three, and pauses new requests for one
minute after a quota response. Search and quotes share the provider's account
quota; this is not a shared daily budget or public access control.

### Price history and trading searched tickers

`GET /api/stocks/AAPL/history` returns end-of-day closing prices (up to about 100 trading days) from Alpha Vantage `TIME_SERIES_DAILY`, using the same server-only `ALPHA_VANTAGE_API_KEY`. The quote page uses it for the Week, Month and All chart. Buy and Sell on a searched ticker use the end-of-day quote. Prices are never live.

Setup for searched tickers, quotes and charts: copy `back-end/.env.example` to `back-end/.env`, set your own `ALPHA_VANTAGE_API_KEY`, then restart the backend. Never commit the key. Without a key the back end returns 503 for these routes, and the practice stocks still work. The tests use simulated responses and need no key.

Limits: the free key allows 25 requests per day, shared by search, quote and history. If the provider refuses a request, the page shows an error and the quote and Buy/Sell can still work. After a back-end restart, saved results in `back-end/.cache/` (ignored by git) are reused only while fresh: quotes for 15 minutes, history for 6 hours. The back end waits up to 15 seconds for a quote or history reply and 10 seconds for a search. Practice trades stay in browser localStorage.

### Watchlist backend groundwork (#89)

The watchlist router is intentionally **not mounted**. It can list, add
and remove symbols for one verified user, prevent duplicates through the
store contract, and return saved items even when individual quotes fail.
It does not change the frontend practice watchlist.

Before mounting at `/api/watchlist`:

- Connect to #78's verified sessions. `getAuthenticatedUserId(req)` must
  resolve a stable account ID from the server-verified session, never from
  request-supplied IDs. For cookie sessions, require CSRF protection for
  mutations. Unauthenticated requests return 401.
- Supply a durable team database adapter: `list(userId)` returns that user's
  bounded, unique symbol list; `add(userId, symbol, limit)` atomically checks
  existence and capacity, returning `added`, `exists`, or `full`. Enforce atomic
  uniqueness on (userId, symbol), and idempotently implement
  `remove(userId, symbol)` scoped to that same user.
- Pass the same server quote service to both routes to share cache and
  in-flight protections. Watchlist entries with unavailable quotes preserve
  their symbols and have null price/change rather than invented values.

The tests use simulated quote responses and a test-only store. A real provider
key, a production session/store adapter, and deployment are not verified here.
