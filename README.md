# WellPath

AI powered personalized health and lifestyle planner. A rule engine builds every calorie, macro and safety decision; the AI assistant only explains and suggests.

> Wellness guidance only. Not medical advice.

## Projects in this repo

| Folder | What it is | Runs on |
| --- | --- | --- |
| `apps/api` | Backend API (Node, Express, TypeScript, MongoDB) | http://localhost:4000 |
| `apps/web` | User web app (React, Vite, TypeScript) | http://localhost:5173 |
| `apps/admin` | Admin panel (React, Vite, TypeScript) | http://localhost:5174 |
| `packages/engine` | Plan engine: BMR, TDEE, calorie and macro targets (pure functions + tests) | imported by api |
| `packages/shared` | Zod schemas and types shared by all apps | imported everywhere |

## Run locally

Requirements: Node.js 22 or newer, Git.

```bash
npm install                        # installs everything for all projects
copy apps\api\.env.example apps\api\.env   # Windows (macOS/Linux: cp)
npm run dev:api                    # terminal 1
npm run dev:web                    # terminal 2
npm run dev:admin                  # terminal 3 (optional)
```

Open http://localhost:5173 for the web app. The admin dashboard at http://localhost:5174 shows whether the API is online.

Run `npm run doctor` to check `apps/api/.env` and the MongoDB connection.

### Admin access

Register an account in the app (or with `POST /api/v1/auth/register`), then give it admin access:

```bash
npm run make-admin -- you@example.com            # make admin
npm run make-admin -- --remove you@example.com   # remove admin
```

## Useful commands

```bash
npm run lint      # lint the frontends
npm test          # all unit + API tests
npm run typecheck # TypeScript checks for every project
npm run build     # production builds
```

## Deployment

| App | Host | Setup |
| --- | --- | --- |
| `apps/api` | Render | Blueprint in `render.yaml`. Set `MONGODB_URI` and `CORS_ORIGINS` in the dashboard. |
| `apps/web` | Vercel | Root directory `apps/web` |
| `apps/admin` | Vercel | Root directory `apps/admin`. Set `VITE_API_URL` to the Render URL. |

Before deploying: browsers such as Safari block cookies from another site, which would sign people out on every reload. Proxy `/api` through each Vercel app (a rewrite to the Render URL) so the session cookie is same-site.

## API so far

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | API is alive |
| POST | `/api/v1/plan/preview` | Daily calorie and macro targets from a profile |
| POST | `/api/v1/auth/register` | Create an account and start a session |
| POST | `/api/v1/auth/login` | Sign in and start a session |
| POST | `/api/v1/auth/refresh` | Swap the refresh cookie for a new access token |
| POST | `/api/v1/auth/logout` | End the session |
| GET | `/api/v1/auth/me` | Current user (needs `Authorization: Bearer <token>`) |
| DELETE | `/api/v1/auth/account` | Delete the signed-in account and all its data (password required) |
| GET | `/api/v1/profile` | Saved onboarding answers, daily targets and safety notices (signed in) |
| PUT | `/api/v1/profile` | Save onboarding answers (signed in, health data consent required) |
| POST | `/api/v1/admin/auth/login` | Admin sign-in (admin accounts only, separate session) |
| POST | `/api/v1/admin/auth/refresh` | Swap the admin refresh cookie for a new access token |
| POST | `/api/v1/admin/auth/logout` | End the admin session |
| GET | `/api/v1/admin/auth/me` | Current admin |

## Tech stack

React, Vite, TypeScript, Node.js, Express, MongoDB (Mongoose), Zod, Vitest, Supertest, GitHub Actions. AI: Google Gemini (primary) with Groq fallback.
