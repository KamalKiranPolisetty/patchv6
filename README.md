# Patch – Discount Tire IT Support Assistant

Patch is a self-service IT troubleshooting assistant for Discount Tire store associates. It guides associates through step-by-step workflows, escalates unresolvable issues to L2 support, and tracks every interaction as an incident.

## Features

- **Authentication** – Secure signup/login with JWT cookies and bcrypt password hashing
- **LLM-Powered Chat** – Structured JSON responses via Claude API; grounded in local Markdown knowledge base files
- **Dynamic UI** – LLM-driven option buttons, select lists, and input forms
- **Incident Management** – Full CRUD via MongoDB (`patch_transactions` collection); lifecycle: Open → Escalated/Resolved
- **Escalation & Resolution Flows** – Summary cards embedded in chat; chat input disabled after closure
- **Feedback System** – 1–5 star rating + comments persisted per incident; visible on detail page
- **Knowledge Base** – Local `.md` files in `knowledge_base/workflows/`; images served via `/api/kb-images/`
- **Incidents List & Detail** – Filter by status, human-readable timestamps, two-column detail view, progress timeline, resume open chats

## Tech Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4)
- **MongoDB** (via `mongodb` driver)
- **Anthropic Claude API** (`claude-opus-4-7`)
- **react-markdown + remark-gfm** for Markdown/image rendering in chat
- **date-fns** for human-readable timestamps
- **bcryptjs** + **jsonwebtoken** for auth

## Setup

1. Copy `.env.example` to `.env` and fill in your values:

```env
MONGODB_URI=mongodb://localhost:27017/patch
MONGODB_DB=patch
JWT_SECRET=your-secret-key
ANTHROPIC_API_KEY=sk-ant-...
```

2. Install dependencies:

```bash
npm install
```

3. (Optional) Add a VDI knowledge base file:

```bash
echo "# VDI Troubleshooting\n..." > knowledge_base/workflows/vdi.md
```

4. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Knowledge Base

- **Workflows**: Place `.md` files in `knowledge_base/workflows/`. File name must match the category (e.g., `vdi.md` for the VDI tile).
- **Images**: Place image files in `knowledge_base/images/`. Reference them in Markdown as `![alt](/api/kb-images/filename.png)`.

## Routes

| Route | Description |
|---|---|
| `/` | Main page (pre-chat landing + active chat) |
| `/login` | Login |
| `/signup` | Signup |
| `/incidents` | Incidents list |
| `/incidents/[id]` | Incident detail + resume chat |

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login` | POST | Login (sets cookie) |
| `/api/auth/logout` | POST | Logout (clears cookie) |
| `/api/auth/me` | GET | Current user |
| `/api/incidents` | GET/POST | List / create incidents |
| `/api/incidents/[id]` | GET/PATCH | Get / update incident |
| `/api/chat` | POST | Send message to LLM |
| `/api/feedback` | POST | Submit feedback |
| `/api/kb-images/[filename]` | GET | Serve KB image |
| `/api/kb-status` | GET | Check VDI KB availability |
