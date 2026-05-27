# Patch — AI Troubleshooting Assistant

Patch is an AI-powered IT troubleshooting assistant for store associates. It uses RAG (Retrieval-Augmented Generation) with Ollama to provide context-aware support grounded in uploaded technical documentation.

## Features

- **Authentication**: Email-based signup (generates password) and login with JWT sessions
- **Category-based Chat**: VDI and Printer troubleshooting categories
- **RAG Integration**: Grounds LLM responses in uploaded `.docx` knowledge base documents
- **Incident Tracking**: Full incident lifecycle (Open → In Progress → Escalated/Resolved)
- **Document Uploads**: Upload `.docx` files to the knowledge base per category
- **Feedback**: Star ratings on AI responses

## Prerequisites

- Node.js 18+
- MongoDB (local or remote)
- Ollama running locally with `gemma4:31b-cloud` model

## Setup

1. Clone and install:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

3. Start Ollama:
   ```bash
   ollama serve
   ollama pull gemma4:31b-cloud
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `OLLAMA_URL` | Ollama API URL (default: http://localhost:11434) |

## Routes

| Route | Description |
|-------|-------------|
| `/login` | Authentication (signup/login) |
| `/` | Main chat interface |
| `/incidents` | Incident history list |
| `/incidents/[id]` | Incident detail view |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create account with generated password |
| `/api/auth/login` | POST | Login and set session cookie |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/me` | GET | Get current user |
| `/api/incidents` | GET/POST | List/create incidents |
| `/api/incidents/[id]` | GET/PATCH | Get/update incident |
| `/api/chat` | POST | Send message, get AI response |
| `/api/upload` | POST | Upload .docx to knowledge base |
| `/api/documents` | GET | Get categories with uploaded docs |
