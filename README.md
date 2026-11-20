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

Open the URL Vite prints, then visit `/market`. Run checks from `front-end/`:

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
and trade records persist in this browser's `stocksim-practice-v1` localStorage
entry. This is a single demo account, not authenticated or isolated by user;
use one tab at a time. If storage is unavailable, a notice explains that changes
last only for the current page session. Portfolio summary, holding details,
transaction history, transaction details, and the current Performance totals use
this same account and market quotes. Holding Buy/Sell links open the selected
investment's ticket. Completed trades link to Portfolio and their transaction.
Average purchase price is reconstructed from the saved trades using weighted
average cost; incomplete purchase history is shown as unavailable. Missing market
quotes show an error instead of silently understating the portfolio value.

The Performance chart remains the team's separate sample historical series,
clearly labeled as such; it is not a history of this account. Account and
leaderboard sample data are not synchronized with trading. Live quote refresh,
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

Registration, login, logout, and the protected `GET /api/auth/me` endpoint are
implemented. Forgot/reset password still return `501` with a JSON
`NOT_IMPLEMENTED` error. The frontend forms still use the original demo
navigation; frontend integration remains a later step. Test the backend with
API requests or the Mocha/Chai suite for now.

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
replace it later. Emails passed to this interface must already be normalized;
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
issuer, audience, expiry, and a matching active session in memory. The protected
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
are allowed. API tools without browser origin headers are supported. CORS and
frontend requests will be configured during frontend integration.

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

Requests use JSON with a 10 KB body limit. Malformed JSON, oversized bodies,
and unknown routes return JSON errors with statuses `400`, `413`, and `404`.

Run backend checks from `back-end/`:

```bash
npm run lint
npm test
npm run test:coverage
```

Tests use Mocha, Chai, and Supertest. The c8 command reports coverage for all
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
