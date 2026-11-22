# Contributing to StockSim

This document explains how our team works together and contributes to StockSim.

Contributions can include user stories, tasks, research, app maps, wireframes, prototypes, documentation, code, and tests. Check existing GitHub issues and coordinate with the team before starting work.

## Team Roles

For Sprint 0:

- **Scrum Master:** Abhishek Subedi (`Zho29`)
- **Product Owner:** Hanzalah Siraj (`hanza-siraj`)

For Sprint 1:

- **Scrum Master:** Sam Fiallos (`samthropic`)
- **Product Owner:** Brittany (Yutong) Liu (`brittany660016`)

For Sprint 2:

- **Scrum Master:** Hanzalah Siraj (`hanza-siraj`)
- **Product Owner:** Abhishek Subedi (`Zho29`)

These roles rotate each sprint. All members, including the Scrum Master and Product Owner, also do design and development work.

## Communication and Meetings

We use the course Discord team channel for project communication. Important decisions and progress updates should be shared there so teammates and course staff can follow our work.

Our meetings are:

- **Tuesday:** 6:00–7:00 p.m.
- **Thursday:** 9:00–10:00 p.m.

All times are in **America/New_York**.

We follow the course [Team Norms guidance](https://github.com/nyu-software-engineering/scrum-framework/blob/main/team-norms.md). Members are responsible for their contributions, and work must be reviewed by a teammate before merging.

## Tools

- **Code editor:** Visual Studio Code
- **Code linter:** ESLint
- **Version control:** Git and GitHub

The frontend uses React function components, JavaScript with JSX, Tailwind CSS,
and Vite. ESLint is configured in `front-end/eslint.config.js`.

Style components with Tailwind utilities in JSX. Shared colors and font settings
live in `front-end/src/styles/global.css` using Tailwind's `@theme` directive.
That file also contains the global accessibility and base styles. Use shared
React components for repeated layouts instead of duplicating utility classes
across screens. Tailwind is connected through its official Vite plugin.

## Issues and Task Board

We use GitHub Issues and the StockSim Project to organize work.

- Label user stories as `user story`.
- Label implementation tasks as `task`.
- Label research and environment setup work as `spike`.
- Add the appropriate sprint label, such as `Sprint 0`.
- Assign tasks and spikes to a team member.
- Link each task to its related user story in the issue description.

Tasks should be small enough for one person to complete between standup meetings.

Keep the task board updated using these statuses:

**Todo → In progress → Awaiting Review → Done**

Each sprint has its own backlog and task board. Leave them unchanged after the sprint ends.

Our work estimation method is not yet finalized. We will revisit Planning Poker cards.

## Git Workflow

Everyone works in the same shared repository.

1. Make changes on a temporary or allocated branch.
2. Commit and push changes to that branch.
3. Open a pull request to the team's `master` branch.
4. Have a teammate review the changes.
5. Address any feedback.
6. Merge approved changes into `master` after applicable checks pass.

Use your own GitHub account and descriptive commit messages. Do not push unreviewed changes directly to `master`.

## Local Setup

Install Git and Visual Studio Code, then clone the shared repository:

```bash
git clone https://github.com/agile-students-fall2026/StockSim.git
cd StockSim
```

Open the folder in Visual Studio Code. Make sure your Git author name matches your GitHub username, as required by the course.

Use Node.js 24 or newer for frontend development. From the repository root:

```bash
cd front-end
npm ci
npm run dev
```

Keep Express running in another terminal with `cd back-end`, `npm ci`, and
`npm run dev` from the repository root. Open http://localhost:5173. Vite proxies
`/api` to port 3001; set `API_PROXY_TARGET` when the API uses another port.
Use the same frontend origin in backend `FRONTEND_ORIGIN` for recovery links.

The app uses React Router in declarative mode. `/` opens Welcome;
`/create-account`, `/login`, `/forgot-password`, and `/reset-password` are public.
The portfolio, market, learn, leaderboard, and account sections share the main
navigation and require a valid backend session. Registration creates a temporary
in-memory account, then returns to login. Forms display API validation and
request errors. Refresh restores the HttpOnly cookie session via `/api/auth/me`;
logout revokes it on the server. JWTs and passwords are not stored in browser
storage. Restarting Express removes all temporary accounts and sessions.

Forgot password and `/account/reset-password` request an email link. Without
SMTP, inspect the newest private `back-end/.mail/*.json` preview and open its
`text` link in the browser. To use a browser inbox, configure a private Ethereal
SMTP account as described in README and log in at https://ethereal.email/login
with its credentials from your local `.env`. Messages are captured in Ethereal
rather than delivered to the dummy recipient or written to the JSON outbox. `/reset-password#token=...` removes the fragment
from history, accepts matching new passwords, and requires login again after
success. Do not commit `.env`, mail previews, or reset tokens.

Market data and learning/leaderboard samples remain demos. Practice portfolios
persist per user ID in browser localStorage; this is not database persistence.

Unmatched URLs show Page Unavailable with a link back to Portfolio.

When deploying, configure the host to serve `index.html` for frontend routes
so that direct links and page refreshes work. Vite handles this locally.
Reverse-proxy `/api` to Express on the same HTTPS origin in production, and
configure the backend production secret, SMTP, and `FRONTEND_ORIGIN` as described
in README. The Vite proxy does not configure your production host.

Do not commit passwords, API keys, or other sensitive information. Follow the repository's `.gitignore`.

## Building and Testing

Everyone must provide appropriate tests for the code they write and ensure that the code passes all necessary checks before merging it into `master`.

Inside `front-end/`, run `npm run lint` and `npm run build` before requesting
review. Use `npm run dev` to check interface changes in the browser, or
`npm run preview` to inspect the production build after building it.

Run `node --test tests/*.test.js` in `front-end/` for the market/practice tests.
In `back-end/`, run `npm run lint` and `npm run test:coverage` for Mocha/Chai API,
session, recovery, and frontend API-client integration tests. Include browser
verification of signup, login, logout, protected-page refresh, recovery, and
mobile layouts in auth pull requests. Use test fixtures and local mail previews;
tests should not depend on external services or real email.


