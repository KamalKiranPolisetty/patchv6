# Patch — IT Support AI

Patch is an intelligent IT support chatbot that uses RAG (Retrieval-Augmented Generation) to resolve VDI, Printer, and Scanner issues using your own knowledge base documents.

## Features

- **Authentication**: Email/password login and signup with auto-generated passwords
- **Category Selection**: VDI, Printer, Scanner with knowledge base document status
- **Document Upload**: Upload `.docx` knowledge base files per category
- **AI Chat**: RAG-powered chatbot using Ollama (`gemma4:31b-cloud`)
- **Incident Tracking**: Full lifecycle tracking (Open → In Progress → Escalated/Resolved)
- **Incident Detail Page**: Conversation history, timeline, escalation/resolution details
- **Feedback System**: 5-star rating after resolution or escalation

## Setup

1. Copy `.env.example` to `.env` and fill in your values:
   ```
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB=patch
   JWT_SECRET=your-secret-key
   OLLAMA_URL=http://localhost:11434
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Prerequisites

- **MongoDB**: Running locally or connection URI
- **Ollama**: Running with `gemma4:31b-cloud` model pulled

## Routes

| Route | Description |
|---|---|
| `/` | Main page — category selection |
| `/login` | Login and signup |
| `/chat?category=VDI` | Chat interface |
| `/incident/[id]` | Incident detail page |

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/signup` | POST | Create new user |
| `/api/auth/logout` | POST | Clear session |
| `/api/session` | GET | Get current session |
| `/api/knowledge-base` | GET | Get KB status per category |
| `/api/upload` | POST | Upload `.docx` file |
| `/api/chat` | POST | Send chat message |
| `/api/incident/[id]` | GET/PATCH | Get or update incident |

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- MongoDB
- Ollama (LLM)
- Mammoth (DOCX parsing)
- bcryptjs (password hashing)
- JSON Web Tokens (session)
