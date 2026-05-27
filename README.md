# Patch — AI IT Support Assistant

Patch is a Next.js 16 app that helps store associates troubleshoot VDI and Printer issues using AI-powered chat backed by a knowledge base.

## Features

- **Authentication** — Email/password login; new users get a generated password
- **AI Chat** — Powered by Ollama (`gemma4:31b-cloud`) with full conversation history
- **Knowledge Base** — Upload `.docx` files per category (VDI/Printer) for grounded AI responses
- **Incident Management** — Create, view, filter, and resume incidents; escalation and resolution flows
- **Feedback** — 1–5 star rating after incident resolution or escalation

## Stack

- Next.js 16 (App Router, Turbopack)
- MongoDB + Mongoose
- Tailwind CSS v4
- Ollama (local LLM)

## Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
2. Fill in `.env`:
   - `MONGODB_URI` — your MongoDB connection string
   - `JWT_SECRET` — a random secret for JWT signing
   - `OLLAMA_BASE_URL` — Ollama server URL (default: `http://localhost:11434`)

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## Routes

| Route | Description |
|-------|-------------|
| `/login` | Authentication page |
| `/` | Main workspace (landing + chat) |
| `/incidents` | Incidents list with filters |
| `/incidents/[id]` | Incident detail with timeline |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login / register |
| `/api/auth/logout` | POST | Logout |
| `/api/kb/upload` | POST | Upload `.docx` knowledge base file |
| `/api/kb/status` | GET | Doc availability per category |
| `/api/chat` | POST | Send message, get AI response |
| `/api/chat/history/[incidentId]` | GET | Fetch conversation history |
| `/api/incidents` | GET | List incidents (filterable by status) |
| `/api/incidents/[id]` | GET | Get incident detail |
| `/api/incidents/[id]/feedback` | POST | Submit star rating |
