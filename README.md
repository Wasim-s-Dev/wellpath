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

Open http://localhost:5173. "API status: online" means frontend and backend are connected.

## Useful commands

```bash
npm test          # all unit + API tests
npm run typecheck # TypeScript checks for every project
npm run build     # production builds
```

## API so far

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | API is alive |
| POST | `/api/v1/plan/preview` | Daily calorie and macro targets from a profile |

## Tech stack

React, Vite, TypeScript, Node.js, Express, MongoDB (Mongoose), Zod, Vitest, Supertest, GitHub Actions. AI: Google Gemini (primary) with Groq fallback.
