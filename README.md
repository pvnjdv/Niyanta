# NIYANTA AI v2.0

नियंता — The One Who Controls and Governs

**Autonomous Enterprise Workflow Orchestration Platform**

A complete, offline-first platform for automating complex enterprise workflows using AI agents and a modular node-based execution engine.

---

## 🎯 Overview

Niyanta AI is a **central operations manager** that:
- Coordinates 10 specialized AI agents across departments
- Orchestrates workflows using a graph-based node execution engine
- Runs **fully offline** with local SQLite database and file storage
- Provides real-time audit logging and SLA monitoring
- Executes human-in-the-loop approval workflows

### Key Capabilities
- **Node-Based Workflows**: Drag-and-drop workflow builder with 40+ node types
- **10 AI Agents**: Specialized agents for Finance, HR, Procurement, Security, Compliance, Document Processing, Monitoring, Workflow Intelligence, IT Operations, and Meeting Intelligence
- **Intelligent Orchestration**: Cross-workflow dependency detection and escalation
- **Enterprise-Grade**: Retry logic, SLA monitoring, bottleneck detection, comprehensive audit logging
- **Offline-First**: 100% local execution, zero external dependencies (except Groq API for LLM)

---

## 📋 Prerequisites

- **Node.js** 18+
- **npm** 9+
- **Groq API Key** (free at https://console.groq.com)

---

## 🚀 Quick Start

### 1. Setup

```bash
cd niyanta
cp .env.example .env
```

Edit `.env` and set:
```
GROQ_API_KEY=your_api_key_here
DB_PATH=./niyanta.db
STORAGE_PATH=./storage
PORT=3001
NODE_ENV=development
```

### 2. Install & Run

```bash
npm install
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000 (React app)
- **Backend**: http://localhost:3001 (Express API)
- **Database**: `./niyanta.db` (auto-created)
- **Storage**: `./storage/` (auto-created)

### 3. Test

Once the server is running, in another terminal:

```bash
node test-workflow-execution.js
```

This runs comprehensive integration tests covering:
- Server health
- Agent registration
- Workflow CRUD operations
- Workflow execution with nodes
- Run history and metrics
- Orchestrator chat

---

## 🏗️ Architecture

### System Layers

```
User Interface (React)
    ↓
Workflow Builder (drag-and-drop)
    ↓
Niyanta AI Orchestrator (central brain)
    ↓
Agents (10 specialized workers)
    ↓
Node Execution Engine (individual tasks)
    ↓
Local Database & Filesystem
```

### Core Modules

| Module | Purpose |
|--------|---------|
| **WorkflowEngine** | Manages workflow creation, execution, and state |
| **NiyantaOrchestrator** | Central coordinator, routes tasks to agents |
| **NodeRegistry** | Defines all 40+ node types and their schemas |
| **NodeExecutor** | Executes individual nodes with result persistence |
| **AgentManager** | Manages agent registry and routing |
| **AuditLogger** | Comprehensive event logging and compliance tracking |

---

## 🔄 Workflow Execution

### Creating a Workflow

**POST** `/api/workflow`

```json
{
  "name": "Invoice Processing",
  "description": "Automated invoice approval workflow",
  "category": "finance",
  "nodes": [
    {
      "instanceId": "node-1",
      "nodeType": "manual_trigger",
      "name": "Start",
      "config": {},
      "position": { "x": 100, "y": 100 }
    },
    {
      "instanceId": "node-2",
      "nodeType": "llm_analysis",
      "name": "Analyze Invoice",
      "config": { "prompt": "Check for anomalies" },
      "position": { "x": 300, "y": 100 }
    },
    {
      "instanceId": "node-3",
      "nodeType": "approval",
      "name": "Manager Approval",
      "config": { "approver": "manager@company.com" },
      "position": { "x": 500, "y": 100 }
    }
  ],
  "edges": [
    { "id": "e1", "fromNodeId": "node-1", "toNodeId": "node-2" },
    { "id": "e2", "fromNodeId": "node-2", "toNodeId": "node-3" }
  ]
}
```

### Executing a Workflow

**POST** `/api/workflow/{workflowId}/execute`

```json
{
  "context": {
    "invoice": {
      "vendorId": "V-123",
      "amount": 50000,
      "invoiceNum": "INV-2026-001"
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "workflowId": "wf-xyz",
  "runId": "run-abc",
  "context": {
    "invoice": { "vendorId": "V-123", "amount": 50000, "processed": true },
    "logs": [
      { "nodeId": "node-1", "nodeName": "Start", "status": "completed", "message": "..." },
      { "nodeId": "node-2", "nodeName": "Analyze Invoice", "status": "completed", "message": "..." }
    ]
  }
}
```

### Monitoring Execution

**GET** `/api/workflow/{workflowId}/runs`

Lists all runs of a workflow.

**GET** `/api/workflow/{workflowId}/runs/{runId}`

Gets detailed run information including context and execution logs.

**GET** `/api/workflow/{workflowId}/metrics`

Returns workflow metrics:
```json
{
  "totalRuns": 42,
  "completed": 40,
  "failed": 2,
  "avgDurationMs": 3500,
  "successRate": "95.24%"
}
```

---

## 🤖 Agents

All agents use **Groq API** (llama-3.3-70b-versatile) and execute asynchronously.

### Meeting Intelligence Agent
- **ID**: `meeting` | **Color**: `#00D4FF`
- Processes meeting transcripts and generates decisions, action items, and risk assessments.

### Invoice Processor Agent
- **ID**: `invoice` | **Color**: `#FFB800`
- Analyzes invoices for policy compliance, anomalies, and routing decisions.

### HR Operations Agent
- **ID**: `hr` | **Color**: `#00E676`
- Manages employee onboarding workflows including access provisioning and training plans.

### Procurement Agent
- **ID**: `procurement` | **Color**: `#FF6B6B`
- Routes purchase requests through approval chains and compliance checks.

### Security Monitor Agent
- **ID**: `security` | **Color**: `#FF4488`
- Responds to security events with threat analysis and containment recommendations.

### Compliance Agent
- **ID**: `compliance` | **Color**: `#A78BFA`
- Performs regulatory compliance checks (GDPR, PCI, SOX) and generates compliance reports.

### Document Intelligence Agent
- **ID**: `document` | **Color**: `#F59E0B`
- Classifies documents and extracts key fields using OCR and LLM analysis.

### Monitoring Agent
- **ID**: `monitoring` | **Color**: `#60A5FA`
- Aggregates system metrics, detects bottlenecks, and flags SLA breaches.

### Workflow Intelligence Agent
- **ID**: `workflow` | **Color**: `#34D399`
- Analyzes workflow performance and recommends optimizations.

### IT Operations Agent
- **ID**: `it_ops` | **Color**: `#F472B6`
- Manages IT access requests, incident assignment, and system provisioning.

---

## 📦 Node Types

Workflows are built from reusable nodes across multiple categories:

**Trigger Nodes**: manual_trigger, webhook_trigger, file_upload_trigger, timer_trigger
**AI Nodes**: llm_analysis, classification, summarization, decision_generation, risk_analysis
**Decision Nodes**: approval, conditional_routing, threshold_decision, rule_engine
**Action Nodes**: invoice_processing, task_assignment, notification, report_generation
**Data Nodes**: data_storage, data_retrieval, file_storage
**Monitoring Nodes**: sla_monitoring, bottleneck_detection
**Audit Nodes**: audit_log, compliance_check
**Utility Nodes**: delay, merge, retry, parallel_execution

---

## 📊 API Reference

### Workflows
- `GET /api/workflow` — List all workflows
- `POST /api/workflow` — Create new workflow
- `GET /api/workflow/{id}` — Get workflow details
- `PUT /api/workflow/{id}` — Update workflow
- `DELETE /api/workflow/{id}` — Delete workflow
- `POST /api/workflow/{id}/execute` — Execute workflow
- `POST /api/workflow/{id}/dry-run` — Test workflow
- `GET /api/workflow/{id}/runs` — Get runs
- `GET /api/workflow/{id}/metrics` — Get metrics

### Agents
- `GET /api/agent/list` — List all agents
- `POST /api/agent/run` — Execute agent

### System
- `GET /api/health` — Server health
- `GET /api/metrics` — System metrics
- `GET /api/audit` — Audit logs
- `POST /api/niyanta/chat` — Chat with orchestrator

---

## 💾 Database

Local SQLite database stores:
- **agents** — Agent registry
- **workflows** — Workflow definitions
- **workflow_runs** — Execution history
- **workflow_logs** — Audit trail
- **files** — Generated artifacts
- **audit_logs** — Comprehensive logging

---

## 🚀 Production

### Build
```bash
npm run build
```

### Deploy
```bash
npm run start:prod
```

Serves on port 3001 with frontend from `build/` directory.

---

## 📝 Example: Invoice Processing Workflow

1. **Trigger**: New invoice uploaded
2. **Analyze**: LLM extracts fields, checks vendor
3. **Classify**: High/Medium/Low risk classification
4. **Route**: Auto-approve or escalate flagged
5. **Process**: Mark paid or hold for approval
6. **Notify**: Send to accounts payable

---

## 🙏 Acknowledgments

Built with Groq API, Express.js, React, SQLite, and TypeScript.

**नियंता** — Command Without Chaos

