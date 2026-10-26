# AI Mystery Room

AI Mystery Room is a full-stack mystery investigation game. Players create a fictional case, examine evidence, question suspects, build theories, and submit an evidence-based accusation. The canonical solution is stored separately on the backend and is returned only after a final verdict.

The complete requirements remain in [`spec.md`](./spec.md). This implementation follows its React, Vite, Tailwind, Express, MongoDB, Mongoose, Zod, and Gemini stack.

## Features

- Registration and login with bcrypt password hashes and an HTTP-only session cookie.
- Private dashboard, case history, detective rank, statistics, and achievements.
- Four editable mystery starters, Surprise Me, difficulty selection, and validated case generation.
- Gemini structured-output generation with Zod validation, bounded exponential retry, provider retry-window handling, and model-list-verified alternatives after temporary availability or daily-quota failures.
- Separate MongoDB models for public cases and canonical solutions.
- Investigation overview, suspects, searchable and filterable evidence vault, text interrogation, voice input and spoken replies where supported, player timeline, theories, a connection board, crime-scene hotspots, evidence reliability notes, hints, final verdict, and server-side scoring.
- Shared investigation rooms with invitation codes, shared evidence and theories, and team verdicts.
- Light pastel design, keyboard focus styles, and responsive layouts.

## Technology and structure

| Area | Technology |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, React Router, Lucide React |
| Backend | Node.js, Express, Zod 4, `@google/genai` |
| Database | MongoDB, Mongoose |
| Deployment configuration | Vercel static frontend, Render Node service |

```text
client/                 React application, design system, local illustrations
  src/WorkspaceApp.jsx  Routes, auth state, case and investigation experiences
  src/pages/            Landing page
  src/services/api.js   Credentialed API client
server/
  config/               MongoDB connection
  middleware/           Session authentication
  models/               User, case, private solution, investigation, room
  routes/               Auth, user, case, investigation, multiplayer APIs
  services/             Gemini generation/interrogation, scoring, dashboard
  validators/           Request and generated-case Zod schemas
  tests/                Case, scoring, session and solution-isolation checks
spec.md                 Complete project requirements
```

## Prerequisites

- Node.js 20 or later and npm
- MongoDB locally or a MongoDB Atlas database
- A Gemini API key for generating cases and suspect replies

## Install and configure

Run these commands in the VS Code terminal from the project root:

```powershell
npm install
npm install --prefix client
npm install --prefix server
Copy-Item .env.example .env
```

Open `.env` and configure:

- `MONGODB_URI`: a running local MongoDB URI or Atlas connection string.
- `SESSION_SECRET`: replace the sample with at least 32 random characters. Generate one with:

  ```powershell
  node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
  ```

- `GEMINI_API_KEY`: create a key in Google AI Studio and keep it in this server-only environment file.
- `GEMINI_MODEL`: defaults to `gemini-3.8-flash`; this can be changed for a model available to your Gemini project.
- `GEMINI_FALLBACK_MODEL`: defaults to `gemini-3.6-flash`; considered only when the primary has a failover-eligible temporary availability or daily quota failure, and only when model discovery reports `generateContent` support.
- `GEMINI_RECOVERY_MODELS`: ordered model IDs to consider after a 503; candidates are checked against the API key's `generateContent` model list.
- `GEMINI_ATTEMPTS_PER_MODEL`, `GEMINI_MAX_RECOVERY_MODELS`, and `GEMINI_RETRY_*`: bound retries, alternative models, exponential delay, and maximum accepted `Retry-After` wait.
- `PORT` and `CLIENT_URL`: default to `5000` and `http://localhost:5173`.

Never put the Gemini key or session secret in a `VITE_` variable. `.env` is ignored by Git. The API can start without MongoDB for its health check, but authentication and saved-case features require the database. Case generation and suspect replies require the Gemini key.

## Start the application

Run both development servers from the project root:

```powershell
npm run dev
```

Open <http://localhost:5173>. The API health check is <http://localhost:5000/api/health>.

You can also run the services in separate terminal tabs:

```powershell
npm run dev:server
```

```powershell
npm run dev:client
```

## Checks

Run the frontend production build and tests for both applications:

```powershell
npm run build
npm test
```

Run backend or frontend tests separately with `npm run test:server` or `npm run test:client`.

## Deployment preparation

### Backend

The root [`render.yaml`](./render.yaml) describes a Render Node service with `/api/health` as its health check. Configure `MONGODB_URI`, `SESSION_SECRET`, `GEMINI_API_KEY`, and the production `CLIENT_URL` in the service environment. Set `NODE_ENV=production`; secure cross-site cookies require HTTPS.

### Frontend

Deploy the `client` directory as the Vercel project root. It contains a single-page-app rewrite in [`client/vercel.json`](./client/vercel.json). Set `VITE_API_URL` to the deployed API origin plus `/api`, for example `https://your-api.example.com/api`. Add the exact Vercel site origin to the backend's `CLIENT_URL`. Both services must use HTTPS for browser cookies in production.

For the most reliable cookie behavior, use frontend and API hostnames under the same site/domain. Some browsers restrict cross-site cookies even when `SameSite=None` is set.

## Known setup requirements

- A MongoDB instance and credentials are not included in the repository.
- A Gemini API key is not included. Until one is configured, the app returns a clear service configuration error for AI-dependent actions.
- Gemini output is schema-checked and reference-checked, but the final semantic judgment that a mystery is fair and uniquely solvable still benefits from human review.
- Voice features use browser speech APIs and can be unavailable depending on browser support or microphone permission.
- Multiplayer rooms use shared REST state; they do not use real-time sockets.
