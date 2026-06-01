# Patch — Discount Tire Self-Service Support

Patch is a self-service support agent for Discount Tire store associates. Associates
sign in, describe a problem (or pick a category like VDI), and Patch walks them
through KB-grounded troubleshooting steps. When the agent can't resolve the
issue, it escalates to the Trusted Experts group. When it can, it records the
incident for the store and prompts the associate for feedback.

## Stack

- Next.js 16 (App Router) on Vercel
- React 19, Tailwind v4
- File-based persistence under `./data` (substitutes for the MongoDB collections
  described in the spec — see [Data model](#data-model))
- A deterministic local simulator that mimics the Ollama `gemma4:31b-cloud`
  contract. Point `OLLAMA_BASE_URL` at a real Ollama instance to use the real
  model.

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

To use a real Ollama model instead of the simulator, populate `.env` with
`OLLAMA_BASE_URL` (e.g. `http://localhost:11434`) and the model name.

## Project layout

```
app/
  (workspace)/        # signed-in shell with the persistent header
    page.tsx          # main landing / active chat
    incidents/        # list + detail
  login/              # sign-in page
  signup/             # sign-up page
  api/                # auth, chat, incidents, feedback, kb-images
components/           # shared UI primitives + Header
lib/
  auth.ts             # cookie-based session, sign in / sign up
  db.ts               # users + incidents persistence
  kb.ts               # Markdown KB retrieval
  llm.ts              # system prompt + JSON parsing pipeline + simulator
  markdown.tsx        # minimal Markdown renderer (supports inline images)
  utils.ts            # date formatters, id generator
knowledge_base/       # Markdown workflows + images (created on first run)
data/                 # JSON persistence (gitignored)
```

## Data model

### `users` collection (file: `data/users.json`)

| Field      | Type   | Notes                  |
| ---------- | ------ | ---------------------- |
| `id`       | string | `usr_…`                |
| `username` | string | display name           |
| `email`    | string | unique (case-insensitive) |
| `password` | string | SHA-256 hashed         |
| `createdAt`| ISO 8601 |                  |

### `Patch Transactions` collection (file: `data/incidents.json`)

| Field                  | Type     | Notes                                 |
| ---------------------- | -------- | ------------------------------------- |
| `incidentId`           | string   | unique `inc_…`                        |
| `userId`               | string   | FK → `users.id`                       |
| `status`               | enum     | `Open` \| `Escalated` \| `Resolved`   |
| `category`             | string   | e.g. `VDI`                            |
| `conversationHistory`  | array    | `{ role, content, timestamp }`        |
| `kbReferences`         | array    | `{ file, snippet }`                   |
| `escalationDetails`    | object?  | `{ reason, group, priority, urgency, impact, timestamp }` |
| `resolutionDetails`    | object?  | `{ timestamp, summary }`              |
| `feedback`             | object?  | `{ rating, comment, timestamp }`      |
| `currentStep`          | string?  | last completed troubleshooting step   |
| `createdAt` / `updatedAt` | ISO 8601 |                                   |

## LLM contract

`lib/llm.ts` exports `SYSTEM_PROMPT`, the JSON parsing pipeline
(`stripCodeFences` → `parseLLMOutput` → `parseAndCallLLM`), and the strict
schema:

```json
{
  "response": "Markdown text (image tags preserved verbatim)",
  "user_probable_options": ["Full contextual phrase", "..."],
  "input_card_variables": ["Field A", "Field B"],
  "total_cards": 1,
  "should_escalate": false,
  "escalation_data": null,
  "should_resolve": false
}
```

The same `parseAndCallLLM` is used by both the simulator and any future
real-Ollama adapter, so the rest of the system never branches on the backend.

## Scripts

| Command         | What it does                                |
| --------------- | ------------------------------------------- |
| `npm run dev`   | Start the Next.js dev server                |
| `npm run build` | Production build                            |
| `npm run start` | Run the production build                    |
| `npm run lint`  | ESLint                                      |
| `npm run test`  | Playwright e2e                              |

## Notes

- `.env.example` documents the optional `OLLAMA_BASE_URL`, `OLLAMA_MODEL`,
  `PATCH_DB_DIR`, and `PATCH_SESSION_SECRET` variables.
- The KB folder (`knowledge_base/workflows/`) is created automatically and
  seeded with a `vdi.md` sample so the VDI tile shows `KB Available` on first
  run.
- The default session cookie is signed by an in-process secret; in production,
  set `PATCH_SESSION_SECRET`.
