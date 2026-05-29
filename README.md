# Patch — Discount Tire Information Center

A self-service AI support chatbot for Discount Tire store associates, built with Next.js 16, MongoDB, and Ollama.

## Features

- **Authentication** — Secure signup/login with JWT sessions and bcrypt-hashed passwords
- **Chat Interface** — AI-powered troubleshooting via Ollama (`gemma4:31b-cloud`)
- **Knowledge Base** — File-based KB retrieval grounded in category-specific `.txt` files
- **Incident Management** — Full lifecycle tracking (Open → Escalated → Resolved) in MongoDB
- **Dynamic UI** — LLM-driven option buttons and structured input forms
- **Incident History** — View, resume, and leave feedback on past incidents

## Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values:
   ```
   MONGODB_URI=mongodb://localhost:27017/patch
   SESSION_SECRET=your-32-char-secret-here
   OLLAMA_BASE_URL=http://localhost:11434
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Requirements

- **MongoDB** — running locally or via Atlas
- **Ollama** — running with `gemma4:31b-cloud` model pulled

## Routes

| Route | Description |
|---|---|
| `/` | Main workspace (protected) |
| `/login` | Login page |
| `/signup` | Signup page |
| `/incidents` | Incidents list |
| `/incidents/[id]` | Incident detail |

## Knowledge Base

KB files live in `knowledge_base/{CATEGORY}/{category}.txt`. The VDI KB is pre-loaded at `knowledge_base/VDI/vdi.txt`.
