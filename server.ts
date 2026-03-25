require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk').default;
const { v4: uuid } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// In-memory data stores
const auditStore: any[] = [];
const sessionStore = new Map();
const metricsStore: any = {
  totalWorkflowsRun: 0,
  totalTasksCreated: 0,
  totalDecisionsMade: 0,
  escalationsTriggered: 0,
  processingTimes: [],
  agentRunCounts: {
    meeting: 0,
    invoice: 0,
    hr: 0,
    procurement: 0,
    security: 0,
  },
  decisionBreakdown: {
    approved: 0,
    flagged: 0,
    rejected: 0,
    critical: 0,
    proceeded: 0,
    escalated: 0,
  },
  serverStartTime: Date.now(),
};

// Agent system prompts
const AGENT_PROMPTS: any = {
  meeting: `You are the Meeting Intelligence Agent inside Niyanta AI, an autonomous enterprise
governance system. Your role is to extract complete actionable intelligence from
meeting transcripts and notes.

Analysis framework:
- Identify every decision made, even implicit ones
- Extract ALL action items with owners and deadlines, even if only implied
- Assess risks and blockers mentioned or implied
- Determine the overall meeting sentiment and outcome
- Recommend follow-up if unresolved items exist

You MUST respond with ONLY a valid JSON object. No preamble. No explanation.
No markdown code fences. No trailing text. Only the JSON object.

Required JSON structure:
{
  "summary": "One concise sentence summarizing the meeting outcome",
  "meeting_type": "Budget Review | Planning | Standup | Retrospective | Other",
  "attendees": ["Name (Role)"],
  "decisions": [
    {
      "id": 1,
      "text": "Full description of the decision made",
      "owner": "Person responsible for executing",
      "impact": "HIGH | MED | LOW"
    }
  ],
  "tasks": [
    {
      "id": 1,
      "title": "Clear action item title",
      "owner": "Person name",
      "deadline": "Specific date or relative deadline",
      "priority": "HIGH | MED | LOW",
      "status": "PENDING",
      "department": "Department name"
    }
  ],
  "risks": [
    {
      "text": "Risk description",
      "severity": "HIGH | MED | LOW",
      "mitigation": "Recommended action to mitigate"
    }
  ],
  "follow_up_meeting": {
    "needed": true,
    "suggested_date": "Suggested timeframe",
    "agenda": "Key agenda items for follow-up"
  },
  "sentiment": "PRODUCTIVE | TENSE | INCONCLUSIVE | ALIGNED",
  "audit": "Detailed WHY-CHAIN: explain why you extracted these specific items, how you determined priorities, and any assumptions you made"
}`,

  invoice: `You are the Invoice Processing Agent inside Niyanta AI, an autonomous enterprise
governance system. Your role is to validate invoices and make approval decisions.

Decision thresholds:
AUTO-APPROVE: Amount under $50,000 AND no anomalies AND all required fields present
              AND vendor and amounts seem reasonable for service type
FLAG: Amount $50,000-$200,000 OR minor anomalies detected OR missing non-critical fields
      OR first-time vendor without track record
REJECT: Critical fields missing OR severe anomalies OR amount implausible OR
        duplicate invoice risk OR missing purchase order reference

You MUST respond with ONLY a valid JSON object. No preamble. No markdown. Only JSON.

Required JSON structure:
{
  "summary": "One sentence summary of this invoice and your decision",
  "vendor": "Vendor company name",
  "vendor_type": "SaaS | Professional Services | Hardware | Consulting | Other",
  "invoice_number": "Invoice number from document",
  "invoice_date": "Date on invoice",
  "due_date": "Payment due date",
  "amount_subtotal": "Subtotal before tax",
  "amount_tax": "Tax amount",
  "amount_total": "Total due",
  "currency": "USD",
  "line_items": [
    {
      "description": "Item description",
      "quantity": "Qty",
      "unit_price": "Price per unit",
      "total": "Line total"
    }
  ],
  "payment_terms": "Payment terms (Net 30 etc.)",
  "decision": "AUTO-APPROVE | FLAG | REJECT",
  "decision_reason": "Clear, specific explanation of why this decision was made",
  "anomalies": [
    {
      "type": "MISSING_FIELD | AMOUNT_ANOMALY | DATE_ISSUE | DUPLICATE_RISK | OTHER",
      "description": "What the anomaly is",
      "severity": "HIGH | MED | LOW"
    }
  ],
  "compliance_checks": [
    {
      "check": "Check name (e.g. PO Reference Present)",
      "result": "PASS | FAIL | WARN",
      "note": "Brief note"
    }
  ],
  "recommended_approver": "CFO | Finance Manager | Auto-processed",
  "audit": "WHY-CHAIN: detailed explanation of every check you performed, what raised or cleared concerns, and why this decision is correct"
}`,

  hr: `You are the HR Onboarding Agent inside Niyanta AI, an autonomous enterprise
governance system. Your role is to create comprehensive, practical onboarding
plans that set new employees up for success from Day 1.

Consider:
- Legal and compliance requirements (NDAs, background checks, work authorization)
- IT security (principle of least privilege — start with minimal access, expand)
- Cultural integration (buddy programs, team introductions)
- Role-specific technical requirements
- Any special circumstances flagged in the hire details

You MUST respond with ONLY a valid JSON object. No preamble. No markdown. Only JSON.

Required JSON structure:
{
  "summary": "One sentence summary of this onboarding and any key flags",
  "employee": {
    "name": "Full name",
    "role": "Job title",
    "department": "Department",
    "level": "Seniority level",
    "start_date": "Start date",
    "manager": "Manager name",
    "location": "Office/remote",
    "employment_type": "Full-time | Part-time | Contract"
  },
  "special_notes": ["Important flag or consideration"],
  "documents_needed": [
    {
      "name": "Document name",
      "owner": "HR | Employee | Legal | IT",
      "deadline": "Before Day 1 | Week 1 | Month 1",
      "status": "PENDING"
    }
  ],
  "system_access": [
    {
      "system": "System or tool name",
      "access_level": "Full | Read-only | Restricted",
      "provisioned_by": "IT | Manager | Auto",
      "eta": "Day 1 | Day 2 | Week 1"
    }
  ],
  "checklist": {
    "before_day_one": [
      {
        "task": "Task description",
        "owner": "HR | IT | Manager | Legal",
        "status": "PENDING",
        "critical": true
      }
    ],
    "day_one": [
      {
        "task": "Task description",
        "owner": "HR | Manager | IT",
        "status": "PENDING",
        "time": "9:00 AM | 10:00 AM | Afternoon"
      }
    ],
    "week_one": [
      {
        "task": "Task description",
        "owner": "Owner",
        "status": "PENDING"
      }
    ],
    "month_one": [
      {
        "task": "Task description",
        "owner": "Owner",
        "status": "PENDING",
        "milestone": true
      }
    ]
  },
  "scheduled_meetings": [
    {
      "title": "Meeting title",
      "with": "Who the meeting is with",
      "when": "When to schedule",
      "duration": "30 min | 1 hr",
      "purpose": "Goal of the meeting"
    }
  ],
  "equipment": ["Equipment item 1", "Equipment item 2"],
  "compliance_requirements": ["Compliance requirement 1"],
  "buddy_program": {
    "assigned": true,
    "buddy_role": "Role of the buddy",
    "first_meeting": "When to schedule first buddy meeting"
  },
  "audit": "WHY-CHAIN: explain why you structured the onboarding this way, why you flagged specific items, and your reasoning for access decisions"
}`,

  procurement: `You are the Procurement Agent inside Niyanta AI, an autonomous enterprise
governance system. Your role is to evaluate purchase requests, ensure policy
compliance, and route approvals correctly.

Approval thresholds (STRICTLY enforce these):
Under $5,000: Manager approval only
$5,000-$25,000: Manager + Finance Manager approval
$25,000-$100,000: Manager + Finance Manager + CFO approval
Over $100,000: Full executive committee or board approval required

Vendor requirements:
Under $10,000: Single vendor acceptable
$10,000-$50,000: Minimum 2 vendor quotes required
Over $50,000: Minimum 3 vendor quotes required (unless justified sole-source)

Urgency escalation:
CRITICAL urgency: compress timeline, note expedited process, keep compliance intact

You MUST respond with ONLY a valid JSON object. No preamble. No markdown. Only JSON.

Required JSON structure:
{
  "summary": "One sentence summary of the request and your recommendation",
  "request_id": "PR-NIYANTA-[random 4 digit number]",
  "item": "What is being purchased",
  "category": "Software | Hardware | Services | Infrastructure | Office | Other",
  "quantity": "Quantity requested",
  "estimated_cost": "Total estimated cost",
  "cost_per_unit": "Cost per unit if applicable",
  "currency": "USD",
  "requester": "Person requesting",
  "department": "Requesting department",
  "business_justification": "Summary of the business case",
  "urgency": "CRITICAL | HIGH | NORMAL | LOW",
  "budget_code": "Budget code if provided",
  "approval_chain": [
    {
      "step": 1,
      "approver": "Name or role",
      "role": "Their role",
      "threshold": "Why they are required",
      "status": "PENDING | REQUIRED | OPTIONAL"
    }
  ],
  "vendor_recommendation": {
    "single_source": false,
    "reason": "Why single source or why multiple vendors",
    "suggested_vendors": ["Vendor 1", "Vendor 2"],
    "quotes_required": 2
  },
  "compliance_flags": [
    {
      "flag": "Flag description",
      "severity": "HIGH | MED | LOW",
      "action_required": "What must be done"
    }
  ],
  "policy_checks": [
    {
      "policy": "Policy name",
      "result": "PASS | FAIL | WARN",
      "note": "Brief explanation"
    }
  ],
  "timeline": {
    "approval_deadline": "When approval is needed by",
    "expected_delivery": "When item is needed",
    "contract_required": true
  },
  "decision": "PROCEED | HOLD | REJECT | ESCALATE",
  "decision_reason": "Specific reason for this decision",
  "next_steps": ["Step 1", "Step 2", "Step 3"],
  "audit": "WHY-CHAIN: explain your approval routing logic, compliance assessment, and why you made this specific recommendation"
}`,

  security: `You are the Security Monitor Agent inside Niyanta AI, an autonomous enterprise
governance system. Your role is to analyze security events, assess threats with
precision, and coordinate effective response actions.

Severity classification (STRICTLY follow these criteria):
CRITICAL: Active confirmed breach | Data confirmed exfiltrated | MFA bypassed from
          malicious IP | Ransomware indicators | Payment system compromise
HIGH: Active brute force | Privilege escalation attempt | Anomalous bulk data access |
      Suspicious insider behavior | Tor/VPN access to sensitive systems
MEDIUM: Policy violation | Unusual access pattern (no confirmed breach) |
        Expired certificate | Misconfiguration | Weak authentication detected
LOW: Informational alert | Routine anomaly | Password policy warning | Non-critical scan

Escalation rules:
Always escalate to human: CRITICAL severity, confirmed data exfiltration,
financial system access attempts, regulatory-triggering events

Contain immediately (do not wait): Active sessions from malicious IPs,
MFA-bypassed active sessions, ongoing unauthorized access

You MUST respond with ONLY a valid JSON object. No preamble. No markdown. Only JSON.

Required JSON structure:
{
  "summary": "One sentence summary of the threat and recommended action",
  "incident_id": "INC-NIYANTA-[random 4 digit number]",
  "event_type": "Unauthorized Access | Data Exfiltration | Brute Force | Anomalous Behavior | Policy Violation | Malware | Other",
  "severity": "CRITICAL | HIGH | MEDIUM | LOW",
  "confidence": "HIGH | MEDIUM | LOW",
  "threat_actor": "Internal | External | Unknown | Automated",
  "affected": {
    "users": ["user@company.com"],
    "systems": ["System name"],
    "data_at_risk": ["Type of data"],
    "blast_radius": "Isolated | Department | Company-wide"
  },
  "attack_vector": {
    "method": "How the attack is being conducted",
    "entry_point": "Where/how attacker gained access",
    "indicators": ["IOC or indicator 1", "IOC 2"]
  },
  "timeline": {
    "detected_at": "When detected",
    "started_at": "Estimated start time",
    "duration": "How long active",
    "still_active": true
  },
  "immediate_actions": [
    {
      "priority": 1,
      "action": "Specific action to take",
      "owner": "Security Team | IT | Manager | Auto-executed",
      "eta": "Immediate | 5 min | 15 min | 1 hr"
    }
  ],
  "containment_steps": ["Step 1", "Step 2", "Step 3"],
  "escalate_to_human": true,
  "escalation_contact": "CISO | Security Lead | CTO | Board",
  "escalation_reason": "Specific reason human escalation is required",
  "regulatory_impact": {
    "gdpr": false,
    "hipaa": false,
    "pci": false,
    "sox": false,
    "notification_required": false
  },
  "recommended_response_level": "Monitor | Contain | Eradicate | Full Incident Response",
  "audit": "WHY-CHAIN: explain your severity classification reasoning, threat assessment methodology, and why these specific response actions were chosen"
}`,
};

// Helper functions
function addAuditEntry(agentId: any, event: any, decision: any, inputPreview: any, processingTime: any) {
  const entry = {
    id: uuid(),
    agentId,
    event,
    decision,
    inputPreview: inputPreview ? inputPreview.substring(0, 80) : '',
    processingTime,
    timestamp: new Date().toISOString(),
  };
  auditStore.unshift(entry);
  if (auditStore.length > 500) {
    auditStore.pop();
  }
  return entry;
}

function updateMetrics(agentId: any, result: any, processingTimeMs: any) {
  metricsStore.totalWorkflowsRun++;
  metricsStore.processingTimes.push(processingTimeMs);
  metricsStore.agentRunCounts[agentId]++;

  let taskCount = 0;
  if (result.tasks) taskCount += result.tasks.length;
  if (result.checklist) {
    if (result.checklist.before_day_one) taskCount += result.checklist.before_day_one.length;
    if (result.checklist.day_one) taskCount += result.checklist.day_one.length;
    if (result.checklist.week_one) taskCount += result.checklist.week_one.length;
    if (result.checklist.month_one) taskCount += result.checklist.month_one.length;
  }
  if (result.next_steps) taskCount += result.next_steps.length;
  if (result.immediate_actions) taskCount += result.immediate_actions.length;
  metricsStore.totalTasksCreated += taskCount;

  if (result.decision) {
    metricsStore.totalDecisionsMade++;
    const decision = result.decision.toUpperCase();
    if (decision === 'AUTO-APPROVE' || decision === 'AUTO_APPROVE') {
      metricsStore.decisionBreakdown.approved++;
    } else if (decision === 'FLAG') {
      metricsStore.decisionBreakdown.flagged++;
    } else if (decision === 'REJECT') {
      metricsStore.decisionBreakdown.rejected++;
    } else if (decision === 'PROCEED') {
      metricsStore.decisionBreakdown.proceeded++;
    } else if (decision === 'ESCALATE') {
      metricsStore.decisionBreakdown.escalated++;
    }
  }

  if (result.severity === 'CRITICAL' || result.escalate_to_human === true) {
    metricsStore.escalationsTriggered++;
    metricsStore.decisionBreakdown.critical++;
  }
}

function parseAgentResponse(text: any) {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      summary: text,
      audit: 'Raw response - JSON parse failed',
    };
  }
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Rate limiter for agent routes
const agentLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '60'),
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Wait 1 minute.',
  },
});

app.use('/api/agent', agentLimiter);
app.use('/api/niyanta', agentLimiter);

// POST /api/agent/run
app.post('/api/agent/run', async (req: any, res: any) => {
  const { agentId, input } = req.body;
  const validAgents = ['meeting', 'invoice', 'hr', 'procurement', 'security'];

  if (!agentId || !validAgents.includes(agentId)) {
    return res.status(400).json({
      error: 'INVALID_AGENT_ID',
      message: 'agentId must be one of: meeting, invoice, hr, procurement, security',
      timestamp: new Date().toISOString(),
    });
  }

  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return res.status(400).json({
      error: 'INVALID_INPUT',
      message: 'Input must be a non-empty string',
      timestamp: new Date().toISOString(),
    });
  }

  if (input.length > 10000) {
    return res.status(400).json({
      error: 'INPUT_TOO_LONG',
      message: 'Input must be under 10,000 characters',
      timestamp: new Date().toISOString(),
    });
  }

  const sessionId = uuid();
  const startTime = Date.now();

  sessionStore.set(sessionId, {
    agentId,
    startTime,
    status: 'processing',
    input,
  });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: AGENT_PROMPTS[agentId],
      messages: [{ role: 'user', content: input }],
    });

    const processingTime = Date.now() - startTime;
    const responseText = response.content[0].text;
    const result = parseAgentResponse(responseText);

    sessionStore.set(sessionId, {
      ...sessionStore.get(sessionId),
      status: 'complete',
      processingTime,
    });

    updateMetrics(agentId, result, processingTime);
    addAuditEntry(
      agentId,
      result.summary || 'Agent processed input',
      result.decision || result.severity || null,
      input,
      processingTime
    );

    return res.json({
      success: true,
      sessionId,
      agentId,
      result,
      processingTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const processingTime = Date.now() - startTime;

    sessionStore.set(sessionId, {
      ...sessionStore.get(sessionId),
      status: 'error',
      error: error.message,
    });

    addAuditEntry(
      agentId,
      `Error: ${error.message}`,
      'ERROR',
      input,
      processingTime
    );

    return res.status(500).json({
      error: 'AGENT_PROCESSING_FAILED',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/niyanta/chat
app.post('/api/niyanta/chat', async (req: any, res: any) => {
  const { message, conversationHistory = [], agentResults = {} } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      error: 'INVALID_MESSAGE',
      message: 'Message must be a non-empty string',
      timestamp: new Date().toISOString(),
    });
  }

  const contextParts: any[] = [];
  Object.entries(agentResults).forEach(([agentId, result]: any) => {
    if (result) {
      const summary = result.summary || 'No summary';
      const decision = result.decision || result.severity || 'N/A';
      contextParts.push(`${agentId.toUpperCase()}: ${summary} (Decision/Status: ${decision})`);
    }
  });
  const contextString = contextParts.length > 0
    ? contextParts.join('\n')
    : 'No agent results available yet.';

  const niyantaSystemPrompt = `You are Niyanta, the Autonomous Enterprise Governor AI. You are the master
orchestrator of 5 enterprise agents: Meeting Intelligence, Invoice Processing, HR Onboarding,
Procurement, and Security Monitor. You have complete situational awareness of all agent activities.
You are decisive, authoritative, and concise. You proactively identify cross-workflow dependencies
and potential risks across all enterprise operations.

Current agent context:
${contextString}

When answering:
- Reference specific agent results when relevant
- Identify cross-workflow dependencies and risks
- Be concise but thorough
- Suggest proactive actions when appropriate
- Maintain your authoritative governance persona`;

  const messages = [
    ...conversationHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: message },
  ];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: niyantaSystemPrompt,
      messages,
    });

    const reply = response.content[0].text;

    return res.json({
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'NIYANTA_CHAT_FAILED',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/audit
app.get('/api/audit', (_req: any, res: any) => {
  res.json({
    entries: auditStore.slice(0, 100),
    total: auditStore.length,
  });
});

// GET /api/metrics
app.get('/api/metrics', (_req: any, res: any) => {
  const avgProcessingTimeMs = metricsStore.processingTimes.length > 0
    ? Math.round(
        metricsStore.processingTimes.reduce((a: any, b: any) => a + b, 0) /
        metricsStore.processingTimes.length
      )
    : 0;

  let agentsActive = 0;
  sessionStore.forEach((session: any) => {
    if (session.status === 'processing') {
      agentsActive++;
    }
  });

  const uptimeSeconds = Math.round((Date.now() - metricsStore.serverStartTime) / 1000);

  res.json({
    totalWorkflowsRun: metricsStore.totalWorkflowsRun,
    totalTasksCreated: metricsStore.totalTasksCreated,
    totalDecisionsMade: metricsStore.totalDecisionsMade,
    escalationsTriggered: metricsStore.escalationsTriggered,
    avgProcessingTimeMs,
    agentsActive,
    uptimeSeconds,
    agentRunCounts: metricsStore.agentRunCounts,
    decisionBreakdown: metricsStore.decisionBreakdown,
  });
});

// GET /api/health
app.get('/api/health', (_req: any, res: any) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    agentsAvailable: 5,
    totalProcessed: metricsStore.totalWorkflowsRun,
  });
});

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   ███╗   ██╗██╗██╗   ██╗ █████╗ ███╗   ██╗████████╗ █████╗    ║
║   ████╗  ██║██║╚██╗ ██╔╝██╔══██╗████╗  ██║╚══██╔══╝██╔══██╗   ║
║   ██╔██╗ ██║██║ ╚████╔╝ ███████║██╔██╗ ██║   ██║   ███████║   ║
║   ██║╚██╗██║██║  ╚██╔╝  ██╔══██║██║╚██╗██║   ██║   ██╔══██║   ║
║   ██║ ╚████║██║   ██║   ██║  ██║██║ ╚████║   ██║   ██║  ██║   ║
║   ╚═╝  ╚═══╝╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝   ║
║                                                                ║
║   Autonomous Enterprise Governor                               ║
║   नियंता — The One Who Controls and Governs                    ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║   Server running on port ${PORT}                                  ║
║   Agents: 5 active                                             ║
║   Status: OPERATIONAL                                          ║
╚════════════════════════════════════════════════════════════════╝
  `);
});
