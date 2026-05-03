# 🧠 AI Policy Assistant — Agentic AI + RAG System for Insurance Analysis

> Production-grade AI system for automated insurance policy analysis using **Agentic AI, structured LLM outputs, and scalable backend architecture**

> ⚡ Built with real-world constraints: reliability, auditability, and human-in-the-loop validation

## 🚀 Overview

AI Policy Assistant is a **production-oriented AI system** designed to automate insurance policy analysis workflows using structured LLM outputs.

Unlike typical AI demos, this system focuses on:

- **Deterministic, structured JSON outputs (not free-form text)**
- **Human-in-the-loop validation workflows**
- **Auditability and traceability of AI decisions**
- **Reliable API-based AI orchestration**

It combines:
- LLM-powered reasoning
- Backend-driven control logic
- User-facing review workflows

to create a **trustworthy AI-assisted decision system**.

## 🧠 AI System Design (What Makes This Different)

This is not a simple prompt-based application.

Key design principles:

- **AI as a system component, not a black box**
- **Structured outputs over unbounded text generation**
- **Separation of AI logic from business logic**
- **Fail-safe and retry-aware AI interactions**
- **Human approval layer before final output**

This approach ensures the system is:
- Reliable
- Auditable
- Production-ready

The project is built with:
- `Python 3` for the FastAPI backend
- `Laravel 12` for the backend API v1
- `React + Vite` for the frontend
- `OpenAI API` for structured AI generation
- `Pinecone` for vector search
- `PostgreSQL` for the database

## Architecture Diagram

```mermaid
graph TD
    subgraph Frontend_Layer [React + Vite Frontend]
        UI[User Dashboard]
        Review[Human-in-the-Loop Review]
    end

    subgraph Backend_Layer [FastAPI Production Backend]
        API[API Gateway]
        Agent[Agentic Orchestrator]
        RAG[RAG Service]
        Eval[RAGAS Evaluation]
    end

    subgraph Storage_Layer [Data & Vector Storage]
        DB[(PostgreSQL: Audit & History)]
        VectorDB[(Pinecone: Policy Embeddings)]
    end

    UI --> API
    API --> Agent
    Agent --> RAG
    RAG --> VectorDB
    Agent --> DB
    Agent --> Review
    Review --> API
    Agent --> Eval
    Eval --> DB
```

## Links
Live Demo: [https://your-frontend-url.onrender.com](https://ai-policy-assistance-1.onrender.com)

## What It Does

Users can:
- create an account and log in
- submit policy details for AI analysis
- receive structured output:
  - summary
  - risk analysis
  - client-ready email
- review and edit the AI draft
- save a final approved version
- view their own private analysis history

## 💡 Production Engineering Highlights

This system demonstrates real-world AI engineering patterns:

- Structured LLM outputs using strict JSON schema
- Dedicated AI service layer (separation of concerns)
- Retry-aware upstream API handling
- Human-in-the-loop approval workflow
- Full audit trail for every AI interaction
- Authenticated, user-scoped data access

👉 Designed for reliability, not just generation

## 📚 AI Capabilities

- Structured policy understanding using LLMs
- Context-aware risk analysis
- Client-ready communication generation
- Extensible for future **RAG-based document retrieval**

## 🧠 Engineering Decisions

### Why Structured JSON Instead of Free Text?
- Enables deterministic parsing
- Reduces ambiguity
- Makes outputs production-safe

### Why Human-in-the-Loop?
- AI outputs require validation in critical domains
- Ensures trust and correctness

### Why Dedicated AI Service Layer?
- Keeps AI logic isolated
- Improves maintainability and scalability

### Why Backend-Controlled AI Flow?
- Prevents direct exposure of AI logic
- Enables better error handling and monitoring

## 🛠 Tech Stack

### 🤖 AI Layer
- OpenAI API
- OpenAI embeddings
- Structured JSON output (schema-driven generation)
- RAGAS evaluation
- prompt templates with Jinja2

### ⚙️ Backend v2
- FastAPI
- Python
- SQLAlchemy async
- Alembic
- PostgreSQL
- Pinecone
- Uvicorn

### 🔧 Legacy Backend v1
- Laravel 12
- PHP 8.2+
- API-first architecture

### 🧠 Data & Storage
- SQLite (for backend v1)
- PostgresSQL
- Pinecone

### 💻 Frontend
- React 18
- Vite

## Project Structure

```text
ai-policy-assistant/
├── backend/                       # Laravel v1 backend, retained as legacy
├── backend_fastapi/               # FastAPI v2 backend
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── agents/
│   │   ├── api/routes/
│   │   ├── core/
│   │   ├── models/
│   │   ├── prompts/
│   │   ├── schemas/
│   │   └── services/
│   │       ├── evaluation/
│   │       └── rag/
│   ├── scripts/
│   ├── docker-compose.yml
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── styles.css
└── README.md
```

## Core FastAPI Backend Design

### API Routes

Key route modules:

- [backend_fastapi/app/api/routes/auth.py](backend_fastapi/app/api/routes/auth.py)
- [backend_fastapi/app/api/routes/documents.py](backend_fastapi/app/api/routes/documents.py)
- [backend_fastapi/app/api/routes/policy.py](backend_fastapi/app/api/routes/policy.py)
- [backend_fastapi/app/api/routes/evaluation.py](backend_fastapi/app/api/routes/evaluation.py)
- [backend_fastapi/app/api/routes/compat.py](backend_fastapi/app/api/routes/compat.py)

### Agent Layer

Agent logic lives outside route handlers:

- [backend_fastapi/app/agents/policy_analysis.py](backend_fastapi/app/agents/policy_analysis.py)
- [backend_fastapi/app/agents/document_qa.py](backend_fastapi/app/agents/document_qa.py)

### RAG Services

RAG responsibilities are split into focused services:

- [backend_fastapi/app/services/extraction.py](backend_fastapi/app/services/extraction.py)
- [backend_fastapi/app/services/chunking.py](backend_fastapi/app/services/chunking.py)
- [backend_fastapi/app/services/embeddings.py](backend_fastapi/app/services/embeddings.py)
- [backend_fastapi/app/services/vector_store.py](backend_fastapi/app/services/vector_store.py)
- [backend_fastapi/app/services/rag/retriever.py](backend_fastapi/app/services/rag/retriever.py)

### Evaluation Services

- [backend_fastapi/app/services/evaluation/ragas_service.py](backend_fastapi/app/services/evaluation/ragas_service.py)

### Prompt Templates

- [backend_fastapi/app/prompts/policy_analysis_v1.jinja2](backend_fastapi/app/prompts/policy_analysis_v1.jinja2)
- [backend_fastapi/app/prompts/document_qa_v1.jinja2](backend_fastapi/app/prompts/document_qa_v1.jinja2)

### Persistence

Main tables:

- `users`
- `policy_documents`
- `document_chunks`
- `policy_analyses`
- `analysis_sources`
- `rag_evaluations`

Document metadata, history, review output, and evaluation metrics live in PostgreSQL. Embeddings live in Pinecone.

## Core Backend Design ( Version 1 - Laravel )

### 1. Controller Layer

The backend uses dedicated controllers for:
- authentication
- policy analysis workflows

Key files:
- [backend/app/Http/Controllers/AuthController.php](backend/app/Http/Controllers/AuthController.php)
- [backend/app/Http/Controllers/PolicyController.php](backend/app/Http/Controllers/PolicyController.php)

### 2. AI Service Layer

AI request logic is isolated in:
- [backend/app/Services/PolicyAnalysisService.php](backend/app/Services/PolicyAnalysisService.php)

Responsibilities:
- build the OpenAI request
- request strict JSON output
- parse the response
- apply selective retry behavior
- map upstream errors into cleaner application messages

### 3. Prompt Template

Prompt content lives in:
- [backend/resources/views/prompts/policy-analysis.blade.php](backend/resources/views/prompts/policy-analysis.blade.php)

This keeps prompt wording separate from application logic.

### 4. Persistence

Each analysis stores:
- input payload
- AI draft output
- final reviewed output
- status
- error metadata
- user ownership

Main model:
- [backend/app/Models/PolicyAnalysis.php](backend/app/Models/PolicyAnalysis.php)

## Frontend Design

The frontend was refactored into a production-style structure instead of keeping everything in `App.jsx`.

### Components
- auth screen
- dashboard shell
- hero section
- policy form
- review workspace
- history list
- feedback banner

### Hooks
- `useAuth` for login/register/logout/session state
- `usePolicyAssistant` for analysis, history, review, and UI messages

### API Utility
- `frontend/src/lib/api.js` centralizes authenticated API requests

## Authentication Flow

The app uses a lightweight token-based authentication flow.

Public routes:

- `POST /register`
- `POST /login`
- `POST /api/register`
- `POST /api/login`

Protected routes:

- `GET /me`
- `POST /logout`
- `GET /documents`
- `POST /documents/upload`
- `POST /documents/query`
- `POST /documents/query/stream`
- `GET /policy/history`
- `POST /policy/analyze`
- `PUT /policy/{analysis_id}/finalize`
- `GET /evaluation/summary`
- `GET /evaluation/history`

Compatibility `/api/...` routes are provided where needed for the frontend migration path.

Policy history and final review actions are scoped to the authenticated user.

## API Overview

### Health

`GET /health`

```json
{
  "status": "ok",
  "service": "AI Policy Assistant API",
  "environment": "production"
}
```

### Register

`POST /register`

```json
{
  "name": "Aarav Sharma",
  "email": "aarav@example.com",
  "password": "password123"
}
```

### Login

`POST /login`

```json
{
  "email": "aarav@example.com",
  "password": "password123"
}
```

### Upload Document

`POST /documents/upload`

Multipart form field:

```text
document=<PDF or text file>
```

### Query Document

`POST /documents/query`

```json
{
  "document_id": 1,
  "question": "What flood exclusions apply?"
}
```

### Streaming Document Query

`POST /documents/query/stream`

Returns server-sent events:

```text
event: meta
event: token
event: done
event: error
```

### Analyze Policy

`POST /policy/analyze`

```json
{
  "type": "Commercial Property",
  "coverage": "Building and contents up to $500,000",
  "location": "Austin, Texas",
  "risk": "Moderate flood exposure",
  "document_id": 1
}
```

Example response:

```json
{
  "result": {
    "summary": "Short structured summary",
    "risk_analysis": "Risk insights here",
    "email": "Client-ready email body here"
  },
  "meta": {
    "analysis_id": 1,
    "status": "completed"
  }
}
```

### Save Final Reviewed Output

`PUT /policy/{analysis_id}/finalize`

```json
{
  "summary": "Approved summary",
  "risk_analysis": "Approved risk analysis",
  "email": "Approved email"
}
```

### Evaluation Summary

`GET /evaluation/summary`

Example response:

```json
{
  "averages": {
    "faithfulness": 0.83,
    "answer_relevance": 0.91
  },
  "total_evaluations": 12,
  "error_count": 1,
  "trend": [
    {
      "date": "2026-05-03",
      "faithfulness": 0.83
    }
  ],
  "per_agent": [
    {
      "agent_type": "document_qa",
      "faithfulness": 0.94,
      "answer_relevance": 0.89,
      "runs": 5
    }
  ]
}
```

## Local Setup

## Prerequisites

- Python 3.11+
- Node.js + npm
- Docker Desktop, or local PostgreSQL
- OpenAI API key
- Pinecone API key and index

## 1. Clone The Repository

```powershell
git clone <your-repo-url>
cd "Policy Assistance"
```

### 2. Start PostgreSQL Locally

From the FastAPI backend folder:

```powershell
cd backend_fastapi
docker compose up -d
```

If you are not using Docker, create a PostgreSQL database manually and update `DATABASE_URL`.

### 3. FastAPI Backend Setup

```powershell
cd backend_fastapi
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Update `backend_fastapi/.env`:

```env
APP_ENV=local
APP_NAME="AI Policy Assistant API"
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/policy_assistant

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=policy-assistant
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1
PINECONE_NAMESPACE=documents

POLICY_ANALYSIS_PROMPT_VERSION=v1
DOCUMENT_QA_PROMPT_VERSION=v1

UPLOAD_DIR=storage/uploads
```

Run migrations:

```powershell
alembic upgrade head
```

Start backend:

```powershell
python -m uvicorn app.main:app --reload
```

Backend runs at:

```text
http://localhost:8000
```

Swagger docs:

```text
http://localhost:8000/docs
```

### 4. Frontend Setup

Open a new terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

The frontend `.env` should contain:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Frontend runs at:

```text
http://localhost:5173
```

## Deploying FastAPI Backend On Render

Create a new Render Web Service for the FastAPI backend.

Recommended settings:

- Runtime: `Python 3`
- Root Directory: `backend_fastapi`
- Build Command:

```bash
pip install -r requirements.txt
```

- Start Command:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- Pre-deploy Command:

```bash
alembic upgrade head
```

If the pre-deploy command is not available on your Render plan, run migrations from the Render shell:

```bash
alembic upgrade head
```

Recommended Render environment variables:

```env
APP_ENV=production
APP_NAME=AI Policy Assistant API
CORS_ORIGINS=https://your-frontend-service.onrender.com

DATABASE_URL=postgresql+asyncpg://user:password@internal-render-host/database

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=policy-assistant
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1
PINECONE_NAMESPACE=production

POLICY_ANALYSIS_PROMPT_VERSION=v1
DOCUMENT_QA_PROMPT_VERSION=v1

UPLOAD_DIR=storage/uploads
```

Use Render's internal PostgreSQL URL for `DATABASE_URL`, but change the prefix from:

```text
postgresql://
```

to:

```text
postgresql+asyncpg://
```

## Deploying Frontend On Render

Set the frontend environment variable:

```env
VITE_API_BASE_URL=https://your-fastapi-backend.onrender.com
```

Redeploy the frontend after changing the API URL.

The FastAPI backend must include the frontend origin in `CORS_ORIGINS`.

## Demo Flow

1. Register a new account.
2. Log in.
3. Upload a PDF or text policy document.
4. Wait for document status to move from queued/processing to ready.
5. Ask a document-grounded question.
6. Run policy analysis with or without selected document context.
7. Review the generated summary, risk analysis, and email.
8. Save the final approved version.
9. Open the AI Evaluation dashboard and inspect quality metrics.

## Testing

Backend:

```powershell
cd backend_fastapi
python -m compileall app
alembic check
```

Frontend:

```powershell
cd frontend
npm run build
```

## Interview / Portfolio Positioning

This project is a good portfolio piece because it demonstrates more than just API consumption.

It shows:
- full-stack application design
- structured AI integration
- separation of concerns
- authenticated multi-user workflow
- human-in-the-loop AI review
- multi-agent AI orchestration
- RAG with vector database retrieval
- structured LLM outputs
- streaming AI responses
- RAG evaluation and observability
- auditability and history tracking
- practical product thinking around reliability and trust

A strong way to describe it:

> Built a production-oriented AI policy assistant using FastAPI, React, OpenAI, Pinecone, PostgreSQL, and RAGAS with multi-agent orchestration, document-grounded Q&A, structured policy analysis, streaming responses, and AI quality observability.

## Future Improvements

Planned upgrades:
- persistent object storage for uploaded source files
- Celery or managed queue for heavier ingestion workloads
- curated ground-truth datasets for context precision/recall
- pagination and search for history/evaluations
- role-based access control
- export to PDF/email package
- CI tests for backend and frontend

## 🚀 Portfolio Positioning

This project demonstrates:

- AI system design beyond prompt engineering
- Production-ready LLM integration
- Reliable and auditable AI workflows
- Full-stack + AI system thinking
- RAG evaluation and observability

👉 Built to reflect real-world AI engineering practices, not toy demos

## Notes

- The Laravel backend in `backend/` is version 1 and is not required for the FastAPI v2 deployment.
- OpenAI and Pinecone API keys should never be committed to GitHub.
- If you see `insufficient_quota`, your OpenAI account or project does not currently have available API quota.
- If RAGAS evaluation scores are delayed, check the async evaluation logs and the `rag_evaluations` table.
- If browser login/register fails with CORS, ensure `CORS_ORIGINS` exactly matches the deployed frontend URL, including `https://` and no trailing slash.
