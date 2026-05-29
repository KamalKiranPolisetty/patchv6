# Patch – Discount Tire Information Center

Self-service troubleshooting chatbot for Discount Tire store associates, powered by Next.js 16 and Ollama.

## Features

- **Authentication** (PATCH-1): Sign up / login with JWT sessions via NextAuth.js
- **Persistent Header** (PATCH-2): Red navigation bar with Incidents, New Chat, and Logout actions
- **Chat UI** (PATCH-3): Dual-state page — landing tiles → active conversation with Markdown rendering
- **KB Retrieval + LLM** (PATCH-4): Reads `knowledge_base/VDI/vdi.txt`, sends context to `gemma4:31b-cloud` via Ollama
- **MongoDB Persistence** (PATCH-5): Incidents stored in `PatchTransactions` collection with full conversation history and timeline
- **Dynamic Controls** (PATCH-6): LLM returns Yes/No buttons, option chips, or input forms based on context
- **Escalation / Resolution / Feedback** (PATCH-7): Summary cards, disabled input, and star rating feedback
- **Incidents List & Detail** (PATCH-8): Filter by status, scrollable conversation history, resume open chats

## Setup

1. Copy `.env.example` to `.env` and fill in your values:
   ```
   MONGODB_URI=mongodb://localhost:27017/patch
   NEXTAUTH_SECRET=<random secret>
   NEXTAUTH_URL=http://localhost:3000
   OLLAMA_BASE_URL=http://localhost:11434
   ```

2. Ensure MongoDB and Ollama (with `gemma4:31b-cloud`) are running locally.

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

## Stack

- Next.js 16 (App Router, Turbopack)
- Tailwind CSS v4
- NextAuth.js v4 (Credentials provider)
- MongoDB (native driver)
- Ollama (`gemma4:31b-cloud`)
- React Markdown

## Project Structure

```
app/
  page.tsx          # Main chat page (pre-chat + active states)
  login/page.tsx    # Login page
  signup/page.tsx   # Sign-up page
  incidents/
    page.tsx        # Incidents list with status filters
    [id]/page.tsx   # Incident detail + resume chat
  api/
    auth/[...nextauth]/route.ts
    auth/signup/route.ts
    chat/route.ts
    incidents/route.ts
    incidents/[id]/route.ts
components/
  Header.tsx
  SessionProvider.tsx
lib/
  mongodb.ts
  auth.ts
knowledge_base/
  VDI/vdi.txt
proxy.ts            # Auth guard (Next.js 16 Proxy)
```
