# AI Policy Assistant

AI Policy Assistant is a full-stack application that helps users analyze insurance policy details with AI, review the generated draft, and save a human-approved final version.

The project is built with:
- `Laravel 12` for the backend API
- `React + Vite` for the frontend
- `OpenAI API` for structured AI generation

  ## Links
- Live Demo: [https://your-frontend-url.onrender.com](https://ai-policy-assistance-1.onrender.com)

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

## Why This Project Is Stronger Than A Basic Demo

This is not just a prompt wrapper.

The application includes:
- structured JSON AI outputs instead of raw text blobs
- a dedicated AI service layer in the backend
- retry-aware and user-friendly upstream error handling
- audit/history tracking for every analysis
- human-in-the-loop review workflow
- authenticated, user-scoped access to analyses

## Tech Stack

### Backend
- Laravel 12
- PHP 8.2+
- SQLite by default
- Laravel HTTP client for OpenAI calls

### Frontend
- React 18
- Vite
- Custom hooks and modular component architecture

### AI
- OpenAI Responses API
- strict JSON schema output

## Project Structure

```text
ai-policy-assistant/
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Http/Middleware/
│   │   ├── Models/
│   │   └── Services/
│   ├── database/migrations/
│   ├── resources/views/prompts/
│   └── routes/
├── frontend/
│   ├── src/components/
│   ├── src/constants/
│   ├── src/hooks/
│   ├── src/lib/
│   └── src/
└── README.md
```

## Core Backend Design

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
- `POST /api/register`
- `POST /api/login`

Protected routes:
- `GET /api/me`
- `POST /api/logout`
- `GET /api/policy/history`
- `POST /api/policy/analyze`
- `PUT /api/policy/{policyAnalysis}/finalize`

Policy history and final review actions are scoped to the authenticated user.

## API Overview

### Register

`POST /api/register`

```json
{
  "name": "Aarav Sharma",
  "email": "aarav@example.com",
  "password": "password123"
}
```

### Login

`POST /api/login`

```json
{
  "email": "aarav@example.com",
  "password": "password123"
}
```

### Analyze Policy

`POST /api/policy/analyze`

```json
{
  "type": "Commercial Property",
  "coverage": "Building and contents up to $500,000",
  "location": "Austin, Texas",
  "risk": "Moderate flood exposure"
}
```

Successful response shape:

```json
{
  "result": {
    "summary": "Short structured summary",
    "risk_analysis": "Risk insights here",
    "email": "Client-ready email here"
  },
  "meta": {
    "analysis_id": 1,
    "status": "completed",
    "attempts": 1
  }
}
```

### Save Final Reviewed Output

`PUT /api/policy/{id}/finalize`

```json
{
  "summary": "Approved summary",
  "risk_analysis": "Approved risk analysis",
  "email": "Approved email"
}
```

## Local Setup

## Prerequisites

- PHP 8.2+
- Composer
- Node.js + npm
- SQLite or another supported database
- OpenAI API key with available quota

## 1. Clone The Repository

```powershell
git clone <your-repo-url>
cd "Policy Assistance"
```

## 2. Backend Setup

```powershell
cd backend
composer install
Copy-Item .env.example .env
php artisan key:generate
```

Update `backend/.env`:

```env
APP_NAME="AI Policy Assistant"
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT=30
```

Run migrations:

```powershell
php artisan migrate
```

Start backend:

```powershell
php artisan serve
```

Backend runs at:

```text
http://localhost:8000
```

### Deploying Backend On Render

If Render does not offer `PHP` as a native runtime in your account, deploy the Laravel backend as a `Docker` web service.

Use these settings:

- `Language`: `Docker`
- `Root Directory`: `backend`

The repository already includes:

- [backend/Dockerfile](backend/Dockerfile)
- [backend/.dockerignore](backend/.dockerignore)
- [backend/docker/entrypoint.sh](backend/docker/entrypoint.sh)

Recommended Render environment variables:

```env
APP_NAME=AI Policy Assistant
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:your_generated_app_key
APP_URL=https://your-backend-service.onrender.com
FRONTEND_URL=https://your-frontend-url
DB_CONNECTION=sqlite
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT=30
```

## 3. Frontend Setup

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

## Demo Flow

1. Register a new account
2. Log in
3. Load demo data or enter your own policy details
4. Click `Analyze policy`
5. Review the AI-generated draft
6. Edit the content if needed
7. Click `Save final version`
8. Reopen past analyses from history

## Testing

Backend tests include:
- authentication flow
- protected route behavior
- AI analysis logging
- user-scoped history
- saving reviewed output

Run backend tests:

```powershell
cd backend
php artisan test
```

## Interview / Portfolio Positioning

This project is a good portfolio piece because it demonstrates more than just API consumption.

It shows:
- full-stack application design
- structured AI integration
- separation of concerns
- authenticated multi-user workflow
- human-in-the-loop AI review
- auditability and history tracking
- practical product thinking around reliability and trust

A strong way to describe it:

> Built a production-shaped AI policy assistant using Laravel, React, and OpenAI with structured outputs, authenticated user workflows, audit logging, and a human review layer for final approved content.

## Future Improvements

Planned upgrades:
- prompt version tracking
- analysis detail pages
- export to PDF/email package
- role-based access
- document upload + RAG
- pagination and search for analysis history

## Notes

- If you see `insufficient_quota`, your OpenAI account or project does not currently have available API quota.
- If Composer or npm fail locally, verify that PHP extensions, Node.js, and dependency tooling are installed correctly.
- The OpenAI API key should never be committed to GitHub.
