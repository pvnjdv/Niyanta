# Niyanta AI

**Sanskrit:** Niyanta (नियंता) — The One Who Controls and Governs

**Tagline:** Command Without Chaos

Niyanta AI is a full-stack autonomous enterprise workflow management system powered by 5 specialized AI agents.

## Setup

1. Clone or unzip the project
2. Copy environment file: `cp .env.example .env`
3. Add your Anthropic API key to `.env`
4. Install dependencies: `npm install`
5. Start the application: `npm start`

The app will be available at http://localhost:3000

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 |
| Backend | Node.js + Express |
| AI | Anthropic Claude claude-sonnet-4-20250514 |
| Styling | Pure CSS with CSS Variables |
| State | React Hooks |

## Agents

| Agent | Color | Description |
|-------|-------|-------------|
| Meeting Intelligence | #00D4FF | Extracts decisions, tasks, and risks from meeting transcripts |
| Invoice Processing | #FFB800 | Validates invoices and makes approval decisions |
| HR Onboarding | #00E676 | Creates comprehensive onboarding plans |
| Procurement | #FF6B6B | Evaluates purchase requests and routes approvals |
| Security Monitor | #FF4488 | Analyzes security events and coordinates response |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/agent/run | Run a specific agent |
| POST | /api/niyanta/chat | Chat with Niyanta orchestrator |
| GET | /api/audit | Get audit log entries |
| GET | /api/metrics | Get system metrics |
| GET | /api/health | Health check |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| ANTHROPIC_API_KEY | Your Anthropic API key | Required |
| PORT | Backend server port | 3001 |
| NODE_ENV | Environment mode | development |
| RATE_LIMIT_WINDOW_MS | Rate limit window | 60000 |
| RATE_LIMIT_MAX | Max requests per window | 60 |

## Demo Flow

1. Open app — observe the dark themed 3-panel interface
2. Click "RUN ALL AGENTS" — all 5 sample inputs process automatically
3. Watch audit trail fill up in real-time on the right panel
4. Click Meeting agent — view structured decisions and task table
5. Click Security agent — observe CRITICAL severity banner pulsing red
6. Click DECISIONS tab — review WHY-CHAIN for every decision
7. Open Niyanta Command chat — type "Give me a cross-workflow risk report"
8. View metrics tab — see all counters and average processing time
9. Toggle to light mode — smooth transition, everything stays readable
10. Close with pitch: "Zero human intervention. Full audit trail. Five agents. One governor."
