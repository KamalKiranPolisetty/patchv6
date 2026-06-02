# Patch — Discount Tire Information Center

Patch is an AI-powered self-service IT support agent for Discount Tire store associates. It guides associates through IT troubleshooting step by step using a grounded knowledge base.

## Features

- **Authentication** — Signup/login with bcrypt-hashed passwords and JWT session cookies
- **Main Landing Page** — Welcome screen with VDI category tile and KB availability badge
- **Persistent Header** — Navigation with incident count badge, New Chat, and Logout
- **AI Chat** — Anthropic Claude-powered troubleshooting grounded in your KB markdown files
- **Incident Tracking** — MongoDB persistence for every session with lifecycle status (Open → Resolved/Escalated)
- **Knowledge Base Retrieval** — Runtime reading of `knowledge_base/workflows/*.md` files

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string for JWT signing |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

### 3. Add Knowledge Base content

Place your troubleshooting markdown files in `knowledge_base/workflows/`. For example:

```
knowledge_base/
  workflows/
    vdi.md       ← VDI troubleshooting guide
```

The app reads these at runtime. The landing page tile shows "KB Available" or "KB Missing" based on file existence.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  page.tsx              — Main landing page (protected)
  incidents/page.tsx    — Incident list page
  (auth)/
    login/page.tsx      — Login
    signup/page.tsx     — Signup
  api/
    auth/               — Login, signup, logout, me
    chat/               — AI chat endpoint
    incidents/          — Incident list + count
    kb/status/          — KB availability check
components/
  AppShell.tsx          — Header + content wrapper
  Header.tsx            — Persistent navigation
  PatchLogo.tsx         — Brand mark
  LandingClient.tsx     — Main page chat UI
  IncidentsClient.tsx   — Incidents list UI
lib/
  auth.ts               — JWT session helpers
  mongodb.ts            — Mongoose connection
  kb.ts                 — Knowledge base retrieval
  llm.ts                — Anthropic LLM integration + JSON parsing
  models/
    user.ts             — Users collection schema
    transaction.ts      — Patch Transactions collection schema
knowledge_base/
  workflows/            — Place .md KB files here (read-only at runtime)
  images/               — Optional KB images
```

## Deploy

Deployed on Vercel. Set the environment variables in your Vercel project settings.
