# Patch – Discount Tire IT Support Agent

Patch is a self-service IT support agent for Discount Tire store associates. It uses a knowledge base and an LLM (Ollama `gemma4:31b-cloud`) to guide users through troubleshooting workflows and escalates when needed.

## Features

- **Authentication**: Login and signup with MongoDB-backed user accounts
- **AI Chat**: Grounded troubleshooting via Ollama LLM with VDI knowledge base
- **Incident Management**: Create, track, and review support incidents
- **Escalation & Resolution Flows**: Summary cards with feedback collection
- **Dynamic UI Controls**: LLM-driven option buttons, forms, and dropdowns

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Ollama running locally with `gemma4:31b-cloud` model

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your values:
   ```
   MONGODB_URI=mongodb://localhost:27017/patch
   JWT_SECRET=your-secret-key
   OLLAMA_BASE_URL=http://localhost:11434
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Routes

- `/` – Main chat workspace (requires auth)
- `/login` – Login page
- `/signup` – Signup page
- `/incidents` – Incident list
- `/incidents/[id]` – Incident detail

## Knowledge Base

Place troubleshooting workflows in `knowledge_base/workflows/` as `.md` files (e.g., `vdi.md`). Images go in `knowledge_base/images/`.
