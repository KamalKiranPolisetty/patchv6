# Patch — IT Support Chatbot

Patch is a self-service IT troubleshooting chatbot for store associates. It supports troubleshooting workflows for VDI and Printer issues, with knowledge base document uploads, incident tracking, escalation, and resolution flows.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **MongoDB** — Users, KnowledgeBase, PatchTransactions collections
- **Ollama** (`gemma4:31b-cloud`) — LLM for guided troubleshooting
- **Tailwind CSS v4** — styling
- **JWT (jsonwebtoken + bcryptjs)** — authentication

## Getting Started

1. Copy the environment file and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and sign up.

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string (default: `mongodb://localhost:27017/patch`) |
| `JWT_SECRET` | Secret key for signing JWT session tokens |
| `OLLAMA_BASE_URL` | Ollama API base URL (default: `http://localhost:11434`) |

## Features

- **Authentication** — Signup/login with hashed passwords, JWT sessions
- **Main Chat Page** — Landing state with category tiles (VDI, Printer), transitions to active chat
- **Knowledge Base** — Upload `.docx` files per category; text extracted for RAG context
- **Incident Management** — Auto-created on first message, tracked in MongoDB with full conversation history
- **Escalation & Resolution** — LLM signals terminal states; chat input disabled on resolve
- **Feedback** — 1–5 star rating after escalation or resolution
- **Incidents Dashboard** — List view with filter tabs, detail view with two-column layout and timeline

## API Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Authenticate and set session cookie |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/me` | Get current session user |
| POST | `/api/chat` | Send a message, get LLM response |
| GET/POST | `/api/upload` | Upload `.docx` docs / list docs |
| GET | `/api/incidents` | List user's incidents |
| GET | `/api/incidents/[id]` | Get incident detail |
| POST | `/api/incidents/[id]/feedback` | Submit star rating |
