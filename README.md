# NIYANTA AI v2.0

नियंता — The One Who Controls and Governs

Autonomous Enterprise Workflow Orchestration Platform

## Stack

- Backend: Node.js + Express + TypeScript
- Frontend: React 18 + TypeScript
- Database: SQLite (better-sqlite3) — fully offline
- AI: Groq API (llama-3.3-70b-versatile)
- Storage: Local filesystem

## Prerequisites

- Node.js 18+
- npm 9+
- Groq API key (free at https://console.groq.com)

## Setup

1. cd niyanta
2. cp .env.example .env
3. Open .env and set GROQ_API_KEY=your_key_here
4. npm install
5. npm run dev

## Runs At

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database: ./niyanta.db (auto-created)
- Storage: ./storage/ (auto-created)

## 10 Agents

- Meeting Intelligence (#00D4FF) — transcript -> tasks + decisions
- Invoice Processor (#FFB800) — invoice -> approve/flag/reject
- HR Operations (#00E676) — new hire -> full onboarding plan
- Procurement (#FF6B6B) — purchase request -> approval chain
- Security Monitor (#FF4488) — security event -> threat response
- Compliance Agent (#A78BFA) — policy check -> violation report
- Document Intelligence (#F59E0B) — document -> classification + fields
- Monitoring Agent (#60A5FA) — ops data -> SLA + bottleneck analysis
- Workflow Intelligence (#34D399) — workflow data -> optimization plan
- IT Operations (#F472B6) — IT request -> access + incident plan

## Hackathon Demo

1. Open http://localhost:3000
2. Click RUN ALL AGENTS — all 10 process sample data automatically
3. Watch Live Audit Trail fill in real-time on the right
4. Click Security agent -> see CRITICAL severity pulsing red banner
5. Click DECISIONS tab -> every WHY-CHAIN decision logged
6. Open Niyanta Command chat -> ask "Cross-workflow risk report"
7. See NIYANTA INSIGHT bubbles surfacing dependencies
8. Toggle light/dark mode — everything transitions in 250ms
9. Pitch: "10 agents. Zero human intervention. Full WHY-CHAIN audit. Offline-first."
