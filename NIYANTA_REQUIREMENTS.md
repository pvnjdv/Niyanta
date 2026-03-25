================================================================================
NIYANTA AI — REQUIREMENTS DOCUMENT
Autonomous Enterprise Governor
Version: 1.0.0
Sanskrit: Niyanta (नियंता) — The One Who Controls and Governs
Tagline: Command Without Chaos
================================================================================

SECTION 1 — PROJECT OVERVIEW
================================================================================

1.1 What is Niyanta AI?
  Niyanta AI is a full-stack autonomous enterprise workflow management system.
  It uses 5 specialized AI agents powered by Claude claude-sonnet-4-20250514 to autonomously
  process enterprise workflows including meetings, invoices, HR onboarding,
  procurement, and security monitoring.

  The system provides:
  - Zero-touch workflow processing from raw input to structured output
  - Intelligent decision-making with full WHY-CHAIN audit trails
  - Cross-workflow intelligence to detect dependencies and risks
  - Real-time dashboard with live audit log and metrics
  - Dark/light theme toggle

1.2 Core Value Proposition
  Input: raw text (meeting transcript, invoice, new hire details, purchase request, security event)
  Output: structured JSON result with decisions, tasks, audit reasoning, and recommended actions
  All processing: autonomous, auditable, explainable

1.3 Target Users
  Enterprise teams at hackathon judges, CTOs, CFOs, HR Directors, security teams
  Demo audience: technical judges evaluating AI agent depth, autonomy, and auditability

================================================================================
SECTION 2 — FUNCTIONAL REQUIREMENTS
================================================================================

2.1 Core Agent Requirements

  REQ-001: The system MUST support exactly 5 agents:
    - Meeting Intelligence Agent
    - Invoice Processing Agent
    - HR Onboarding Agent
    - Procurement Agent
    - Security Monitor Agent

  REQ-002: Each agent MUST accept free-text input and return structured JSON.

  REQ-003: Each agent MUST include a WHY-CHAIN audit field explaining every decision.

  REQ-004: Each agent MUST return a processing time (milliseconds).

  REQ-005: Each agent run MUST be logged to the audit store automatically.

  REQ-006: The system MUST support running all 5 agents sequentially with one click.

2.2 Dashboard Requirements

  REQ-007: Layout MUST be 3-panel: sidebar (280px) + center (flex) + audit panel (340px).

  REQ-008: Layout MUST mirror WhatsApp Web — fixed height panels, independent scrolling.

  REQ-009: Dark mode MUST be the default theme.

  REQ-010: Light/dark toggle MUST transition all colors simultaneously in 0.25s.

  REQ-011: The center panel MUST show agent conversations in chat bubble format.

  REQ-012: The audit trail MUST show new entries sliding in from top in real-time.

  REQ-013: Metrics tab MUST show count-up animation when first opened.

2.3 Niyanta Command Chat Requirements

  REQ-014: A persistent chat interface MUST allow talking to the Niyanta orchestrator.

  REQ-015: The orchestrator chat MUST have full context of all 5 agent results.

  REQ-016: The orchestrator MUST detect cross-workflow dependencies when all agents run.

  REQ-017: The mini chat in the right panel footer MUST open the full modal on focus.

2.4 Backend Requirements

  REQ-018: Backend MUST run on port 3001.
  REQ-019: Frontend MUST run on port 3000.
  REQ-020: Backend MUST have rate limiting: 60 requests/minute/IP on agent routes.
  REQ-021: Backend MUST store audit logs in memory (max 500 entries).
  REQ-022: Backend MUST track metrics in memory and expose via /api/metrics.
  REQ-023: Backend MUST validate all inputs and return proper error responses.
  REQ-024: Backend MUST use ANTHROPIC_API_KEY from environment variable.

2.5 Error Handling Requirements

  REQ-025: All API failures MUST show an error bubble in the chat with retry option.
  REQ-026: Rate limit errors MUST show a user-friendly toast notification.
  REQ-027: Empty input MUST be blocked at the UI level (send button disabled).
  REQ-028: JSON parse failures from AI MUST gracefully degrade to showing raw text.

================================================================================
SECTION 3 — DEPENDENCIES
================================================================================

3.1 package.json — Full dependency list

PRODUCTION DEPENDENCIES:
  express: ^4.18.2
    Purpose: Web server framework for all API endpoints

  cors: ^2.8.5
    Purpose: Cross-origin resource sharing — allows React (port 3000) to call Express (port 3001)

  dotenv: ^16.3.1
    Purpose: Load ANTHROPIC_API_KEY and other env vars from .env file

  @anthropic-ai/sdk: ^0.20.1
    Purpose: Official Anthropic SDK for calling Claude claude-sonnet-4-20250514

  express-rate-limit: ^7.1.5
    Purpose: Prevent API abuse — 60 requests/minute on agent endpoints

  helmet: ^7.1.0
    Purpose: Security headers (XSS protection, content type sniffing, etc.)

  morgan: ^1.10.0
    Purpose: HTTP request logging in development

  uuid: ^9.0.0
    Purpose: Generate unique IDs for sessions and audit entries

DEVELOPMENT DEPENDENCIES:
  react: ^18.2.0
    Purpose: UI library

  react-dom: ^18.2.0
    Purpose: React DOM renderer

  react-scripts: 5.0.1
    Purpose: Create React App toolchain (build, dev server, hot reload)

  concurrently: ^8.2.2
    Purpose: Run backend (node server.js) and frontend (react-scripts start) simultaneously

3.2 NPM Scripts

  start: concurrently "node server.js" "react-scripts start"
    Runs both backend and frontend simultaneously
    Backend: http://localhost:3001
    Frontend: http://localhost:3000

  build: react-scripts build
    Builds optimized production frontend bundle

  server: node server.js
    Runs backend only

  client: react-scripts start
    Runs frontend only

3.3 No Additional Libraries
  The frontend uses ZERO component libraries.
  No Tailwind, no Material UI, no Ant Design, no Chakra UI, no Radix.
  All styling is pure inline styles using CSS variables.
  All components are built from scratch.

================================================================================
SECTION 4 — FILE STRUCTURE REQUIREMENTS
================================================================================

4.1 Complete File Tree

niyanta/
  package.json                              REQUIRED
  .env.example                              REQUIRED
  README.md                                 REQUIRED
  server.js                                 REQUIRED
  src/
    index.js                                REQUIRED
    index.css                               REQUIRED
    App.jsx                                 REQUIRED
    constants/
      agents.js                             REQUIRED
      samples.js                            REQUIRED
    hooks/
      useAgents.js                          REQUIRED
      useAuditLog.js                        REQUIRED
      useTheme.js                           REQUIRED
      useNiyantaChat.js                     REQUIRED
    services/
      api.js                                REQUIRED
    components/
      shared/
        Badge.jsx                           REQUIRED
        AgentIcon.jsx                       REQUIRED
        ThemeToggle.jsx                     REQUIRED
      sidebar/
        AgentRow.jsx                        REQUIRED
        SearchBar.jsx                       REQUIRED
        SystemStatus.jsx                    REQUIRED
      chat/
        ChatHeader.jsx                      REQUIRED
        MessageBubble.jsx                   REQUIRED
        AgentBubble.jsx                     REQUIRED
        ThinkingIndicator.jsx               REQUIRED
        InputBar.jsx                        REQUIRED
        EmptyState.jsx                      REQUIRED
      results/
        MeetingResult.jsx                   REQUIRED
        InvoiceResult.jsx                   REQUIRED
        HRResult.jsx                        REQUIRED
        ProcurementResult.jsx               REQUIRED
        SecurityResult.jsx                  REQUIRED
      audit/
        AuditEntry.jsx                      REQUIRED
        DecisionCard.jsx                    REQUIRED
        MetricsGrid.jsx                     REQUIRED
      modals/
        NiyantaChatModal.jsx                REQUIRED
      layout/
        AppShell.jsx                        REQUIRED
        LeftPanel.jsx                       REQUIRED
        CenterPanel.jsx                     REQUIRED
        RightPanel.jsx                      REQUIRED

Total files: 39 files minimum.

================================================================================
SECTION 5 — AGENT SYSTEM PROMPTS (Full Text)
================================================================================

5.1 Meeting Intelligence Agent System Prompt

You are the Meeting Intelligence Agent inside Niyanta AI, an autonomous enterprise
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
  "audit": "Detailed WHY-CHAIN: explain why you extracted these specific items,
            how you determined priorities, and any assumptions you made"
}

5.2 Invoice Processing Agent System Prompt

You are the Invoice Processing Agent inside Niyanta AI, an autonomous enterprise
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
  "audit": "WHY-CHAIN: detailed explanation of every check you performed,
            what raised or cleared concerns, and why this decision is correct"
}

5.3 HR Onboarding Agent System Prompt

You are the HR Onboarding Agent inside Niyanta AI, an autonomous enterprise
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
  "audit": "WHY-CHAIN: explain why you structured the onboarding this way,
            why you flagged specific items, and your reasoning for access decisions"
}

5.4 Procurement Agent System Prompt

You are the Procurement Agent inside Niyanta AI, an autonomous enterprise
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
  "audit": "WHY-CHAIN: explain your approval routing logic, compliance assessment,
            and why you made this specific recommendation"
}

5.5 Security Monitor Agent System Prompt

You are the Security Monitor Agent inside Niyanta AI, an autonomous enterprise
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
  "audit": "WHY-CHAIN: explain your severity classification reasoning, threat assessment
            methodology, and why these specific response actions were chosen"
}

================================================================================
SECTION 6 — CSS DESIGN SYSTEM
================================================================================

6.1 CSS Variables (both themes)

DARK THEME (default, data-theme not set or data-theme="dark"):
  --bg-base: #0A0A0A              Page background
  --bg-panel: #111111             Panel backgrounds (sidebar, right panel)
  --bg-hover: #1A1A1A             Hover states on rows and buttons
  --bg-active: #1F1F1F            Selected/active states
  --bg-input: #1A1A1A             Input field backgrounds
  --bg-msg-out: #1F1F1F           User message bubble background
  --bg-msg-in: #161616            Agent message bubble background
  --border: #2A2A2A               Primary borders
  --border-light: #222222         Subtle borders inside panels
  --text-primary: #FFFFFF         Main text
  --text-secondary: #888888       Secondary/subtitle text
  --text-muted: #444444           Muted/disabled text
  --accent: #FFFFFF               Accent color (matches text-primary in dark)
  --accent-dim: rgba(255,255,255,0.06)   Subtle accent backgrounds
  --green: #00E676                Success, approve, online
  --red: #FF1744                  Error, danger, critical
  --amber: #FFD740                Warning, flag, pending
  --shadow: rgba(0,0,0,0.5)       Box shadows

LIGHT THEME (data-theme="light"):
  --bg-base: #F0F2F5
  --bg-panel: #FFFFFF
  --bg-hover: #F5F5F5
  --bg-active: #E8E8E8
  --bg-input: #FFFFFF
  --bg-msg-out: #FFFFFF
  --bg-msg-in: #F0F2F5
  --border: #E0E0E0
  --border-light: #EEEEEE
  --text-primary: #111111
  --text-secondary: #666666
  --text-muted: #AAAAAA
  --accent: #111111
  --accent-dim: rgba(0,0,0,0.04)
  --green: #00C853
  --red: #D50000
  --amber: #FF6F00
  --shadow: rgba(0,0,0,0.1)

6.2 Agent Colors (never change, not theme-sensitive)
  Meeting:     #00D4FF   glow: rgba(0, 212, 255, 0.25)
  Invoice:     #FFB800   glow: rgba(255, 184, 0, 0.25)
  HR:          #00E676   glow: rgba(0, 230, 118, 0.25)
  Procurement: #FF6B6B   glow: rgba(255, 107, 107, 0.25)
  Security:    #FF4488   glow: rgba(255, 68, 136, 0.25)

6.3 Typography
  Display/headings: font-family: 'Syne', sans-serif; (weights: 400, 600, 700, 800)
  Monospace/data:   font-family: 'Space Mono', monospace; (weights: 400, 700)
  Body/messages:    font-family: 'DM Sans', sans-serif; (weights: 300, 400, 500, 600)
  Import: @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

6.4 Keyframe Animations
  pulse: opacity 1 → 0.3 → 1 over 2s ease-in-out infinite
  blink: scale 0.6 opacity 0.4 → scale 1.0 opacity 1 → scale 0.6 opacity 0.4 (for typing dots)
  slideInTop: translateY(-10px) opacity 0 → translateY(0) opacity 1, 0.3s ease
  slideInBottom: translateY(12px) opacity 0 → translateY(0) opacity 1, 0.25s ease
  fadeIn: opacity 0 → 1, 0.2s ease
  criticalPulse: box-shadow 0 0 0 0 rgba(255,23,68,0.4) → 0 0 0 8px rgba(255,23,68,0), 2s infinite
  spin: transform rotate 0 → 360deg, 1s linear infinite (for loading spinners)

================================================================================
SECTION 7 — SAMPLE DATA (Full Text)
================================================================================

7.1 Meeting Intelligence Sample

MEETING TRANSCRIPT — Q4 Budget and Headcount Planning
Date: November 12, 2024 | Duration: 47 minutes | Location: Board Room B + Zoom
Attendees: Sarah Chen (CFO), Mark Thompson (VP Engineering), Lisa Rodriguez (HR Director),
           Dev Patel (VP Product), James Wu (Legal Counsel), Anna Kim (Finance Manager)

Sarah: Let us get through this efficiently. Three agenda items: Q4 headcount,
       infrastructure budget, and the DataCorp contract. Mark, start us off.
Mark: Engineering is at critical capacity. The payments module launch is blocked.
      We need 3 senior engineers by December 1st or we push the launch to Q2.
Sarah: Understood. Lisa, can we open those requisitions today?
Lisa: JDs are drafted. Posted on LinkedIn and Greenhouse by Thursday.
      But Mark, these are senior roles — 6 to 8 weeks minimum to hire. We may need contractors.
Mark: Agreed. Two contract engineers immediately as a bridge. Max $180 per hour.
Sarah: Approved up to $200 per hour given urgency. Anna, budget code ENG-TEMP-2024.
       James, can we use the standard MSA for contractors?
James: Yes. Countersigned copies ready within 24 hours.
Dev: We also need a senior data scientist for the recommendation engine.
     Q1 critical — the personalization feature is on the board roadmap.
Sarah: That is a $340k fully-loaded package at L6. Needs board sign-off.
       Dev, business case document by November 20th board call.
Dev: I will have it to you by November 18th.
Mark: Infrastructure — we need AWS capacity expansion. Currently at 87% utilization.
      Payments launch will spike us over 100% on day one.
Anna: What is the ask, Mark?
Mark: $52,000 additional for the year. 10 reserved r6i.4xlarge instances, S3 and CloudFront.
Sarah: I can approve $45,000 without board sign-off. Anything above needs justification.
       Mark, can you optimize to fit $45k?
Mark: I will work with AWS. Savings plans instead of reserved. PO by next Tuesday.
Sarah: Good. DataCorp — James, where are we?
James: Contract expires December 31st. They proposed a 23% price increase.
       $180k annually up from $146k. Two alternatives: Palantir and Snowflake, both cheaper
       but require 6-week migration.
Dev: I need DataCorp for at least Q1. Migration during payments launch is impossible.
Sarah: Then we negotiate. James, counter at 8% maximum — $157,680.
       If they will not move, sign a 6-month bridge while Dev evaluates alternatives.
       Decision needed by December 1st.
James: I will reach out to their account team today.
Sarah: Anna, send minutes within the hour. Same time next week if needed. Thank you everyone.

7.2 Invoice Processing Sample

INVOICE
Vendor:     CloudTech Solutions Ltd., 1400 Tech Boulevard, Suite 900, San Francisco CA 94105
            EIN: 82-4471823
Bill To:    Acme Corporation, Accounts Payable, 500 Corporate Drive, New York NY 10001

Invoice Number:    INV-2024-CT-0892
Invoice Date:      November 12, 2024
Due Date:          December 12, 2024
Purchase Order:    PO-ACME-2024-441
Contract Ref:      MSA-CT-ACME-2022-001
Payment Terms:     Net 30

LINE ITEMS:
1. Enterprise Platform License Annual Subscription
   500 users, Period January 1 2025 to December 31 2025
   $96.00 per user per year = $48,000.00

2. Professional Services Platform Implementation
   Senior Engineer 24 hours at $275/hr = $6,600.00
   Project Manager 16 hours at $215/hr = $3,440.00
   Subtotal: $10,040.00

3. Data Migration and ETL Pipeline Setup
   Fixed price per SOW-2024-08-15 = $5,500.00

4. Training and Enablement
   3 Group Training Sessions up to 25 attendees each = $3,000.00
   Custom training materials development = $1,200.00
   Subtotal: $4,200.00

5. Priority Support Package 12 months
   24/7 SLA with 4-hour response time = $6,000.00

SUBTOTAL: $73,740.00
DISCOUNT: Volume 500+ seats 5%: -$2,400.00
NET SUBTOTAL: $71,340.00
TAX CA Sales Tax 8.5%: $4,080.00
TOTAL DUE: $75,420.00

Payment: Wire transfer preferred, ACH accepted
Bank: First National Bank of California
Account: CloudTech Solutions Ltd., Account 4521-887-2234, Routing 121000248
Late payment: 1.5% per month after due date

7.3 HR Onboarding Sample

NEW HIRE ONBOARDING REQUEST
Submitted by: Lisa Rodriguez, HR Director
Date: November 12, 2024

Full Name: Alexandra Chen (prefers Alex)
Personal Email: alex.chen.personal@gmail.com
Role: Senior Software Engineer II (L5)
Team: Payments Platform
Department: Engineering
Manager: Mark Thompson (VP Engineering)
Direct Manager: Priya Singh (Engineering Manager, Payments)
Start Date: December 2, 2024 (Monday)
Employment: Full-time, Hybrid 3 days in office
Location: San Francisco HQ
Salary: $195,000 base
Equity: 0.08% 4-year vest 1-year cliff
Signing Bonus: $25,000 on Day 1

Previous Employer: Google LLC, Payments Infrastructure Team
Last Day at Google: November 29, 2024
Visa Status: US Citizen

IMPORTANT FLAGS:
1. RELOCATION: Alex relocating from New York City.
   Approved relocation package up to $15,000.
   Need: apartment search support, moving company, temporary housing.

2. LEGAL: Alex has pre-existing NDA with Google.
   James Wu must review for IP conflicts before Day 1.
   NDA expires May 15, 2025.
   Restriction: Cannot work on Google-competing features until May 2025.
   Action: Priya to adjust initial sprint assignments.

3. EQUIPMENT: Medical accommodation for prior RSI injury.
   Required: MacBook Pro 16 inch M3 Max (not M3 Pro — medical requirement),
   Kinesis Advantage360 ergonomic keyboard, Logitech MX Vertical mouse,
   32 inch 4K VESA-mount monitor, electric standing desk.

4. BUDDY: Mark suggests Jamie Torres (Senior Engineer Payments) as buddy.
   Jamie has been at company 3 years, knows payments codebase.

Technical Skills: Go expert, Python expert, Java proficient, Rust learning
Domain: Payment processing, PCI-DSS compliance, distributed systems

SYSTEMS ACCESS NEEDED DAY 1:
GitHub Enterprise Payments org (read-only initially),
AWS Console payments-prod read payments-staging full,
GCP acme-payments-dev, Slack, Jira, Confluence, 1Password,
Zoom Pro, Google Workspace corporate email alex.chen@acme.com

NOT YET: Production database access, payment processor API keys (PCI training required first)

7.4 Procurement Sample

PURCHASE REQUEST
Request ID: PR-2024-ENG-441
Submitted by: Mark Thompson, VP Engineering
Department: Engineering
Date: November 12, 2024
Urgency: CRITICAL

Item: AWS Cloud Infrastructure Expansion
Category: Cloud Infrastructure IaaS
Vendor: Amazon Web Services (existing account 123456789012)

SPECIFICATION:
Component 1 — EC2 Compute
  Instance type: r6i.4xlarge (128GB RAM, 16 vCPU)
  Quantity: 10 instances, 1-year reserved partial upfront
  Region: us-west-2 primary, us-east-1 failover
  Cost: $28,400/year

Component 2 — S3 Storage
  Additional capacity: 50TB intelligent tiering
  Cost: $4,800/year

Component 3 — CloudFront CDN
  Traffic upgrade: 200TB/month data transfer
  Cost: $6,200/year

Component 4 — Data Transfer and Misc
  Cross-region replication, NAT gateway upgrades
  Cost: $3,600/year

TOTAL ANNUAL COST: $43,000/year
CFO verbally approved up to $45,000 in today's budget meeting.

JUSTIFICATION:
Current production infrastructure at 87% average utilization (peak 94%).
Payments module launch scheduled Q1 2025 will drive 3.2x traffic spike.
Marketing projects 500,000 users in first 72 hours.
Without expansion: 100% certainty of service degradation on launch day.
Revenue impact if degraded: $2.1M in lost transactions first weekend.
SLA breach penalties for existing enterprise customers: up to $400k.
AWS Partnership Agreement in place with committed spend.
Engineering team expertise 100% AWS — no retraining cost.
AWS account manager offered 12% additional discount on new reserved instances.

7.5 Security Monitor Sample

SECURITY ALERT — AUTOMATED DETECTION
Alert ID: SEC-2024-11-12-0847
Timestamp: 2024-11-12 14:32:07 UTC
Status: ACTIVE — ongoing as of alert generation

Affected Account: james.wu@acme.com (James Wu, Legal Counsel)

AUTHENTICATION:
Password: SUCCESS
MFA: BYPASSED using recovery code RC-7291-XXXX
Note: Recovery codes generated 847 days ago and never previously used

Source IP: 185.220.101.45
IP Classification: MALICIOUS — confirmed Tor exit node (AbuseIPDB, Shodan verified)
IP Location: Amsterdam Netherlands
ISP: Frantech Solutions (known bulletproof hosting provider)
Normal IP: 12.34.56.78 (Comcast San Francisco CA)
Device: UNKNOWN — no device fingerprint match in Okta registry
User-Agent: Mozilla/5.0 Windows NT 10.0 (James exclusively uses MacOS)
Session Duration: Active for 4 minutes 22 seconds as of alert

RESOURCES ACCESSED:
14:27:45 — Okta SSO Login SUCCESS
14:27:52 — Google Workspace email and contacts ACCESS GRANTED
14:28:13 — Notion company wiki ACCESS GRANTED
14:28:34 — SharePoint /Legal/Contracts/Active ACCESS GRANTED
           3 files downloaded: DataCorp_MSA_2022.pdf, Contractor_Agreements_Template.docx, NDA_Google_AlexChen.pdf
14:29:01 — SharePoint /Finance/Payroll/2024 BLOCKED insufficient permissions
14:29:15 — AWS Console BLOCKED no AWS access for this user
14:29:33 — SharePoint /Finance/BankAccounts BLOCKED
14:29:48 — SharePoint /Finance/WireTransfers BLOCKED 4 rapid attempts
14:30:12 — Greenhouse HR recruiting system ACCESS GRANTED candidate data viewed
14:31:05 — SharePoint /Legal/M&A/Confidential BLOCKED
14:32:07 — ALERT TRIGGERED behavioral threshold exceeded

BEHAVIORAL ANALYSIS:
Normal pattern: 9:00-9:30 AM PST weekdays from SF office or home
Typical access: Email, Slack, Notion, Legal SharePoint folders
Never accesses: Finance folders, AWS, HR systems, M&A documents
Anomaly Score: 97 out of 100 (threshold: 80)

Data confirmed exfiltrated:
1. DataCorp MSA — commercial terms pricing currently in active negotiation
2. Contractor Agreements Template — standard template
3. Alex Chen NDA with Google — sensitive, currently under legal review

================================================================================
SECTION 8 — INPUT PLACEHOLDERS PER AGENT
================================================================================

Meeting: "Paste a meeting transcript or notes here — attendees, decisions, action items..."
Invoice: "Paste invoice text here — vendor, line items, amounts, due dates, PO number..."
HR: "Paste new hire details here — name, role, start date, manager, special requirements..."
Procurement: "Paste purchase request here — item, cost, department, business justification..."
Security: "Paste security event or incident report here — timestamps, IPs, affected systems..."

================================================================================
SECTION 9 — API CONTRACT
================================================================================

9.1 POST /api/agent/run
Request body:
{
  "agentId": "meeting | invoice | hr | procurement | security",
  "input": "string (the raw text input)"
}

Success response (200):
{
  "success": true,
  "sessionId": "uuid-v4",
  "agentId": "meeting",
  "result": { ...agent-specific JSON... },
  "processingTime": 2341,
  "timestamp": "2024-11-12T14:32:07.000Z"
}

Error response (400):
{
  "error": "INVALID_AGENT_ID",
  "message": "agentId must be one of: meeting, invoice, hr, procurement, security",
  "timestamp": "2024-11-12T14:32:07.000Z"
}

Error response (500):
{
  "error": "AGENT_PROCESSING_FAILED",
  "message": "Error message from Anthropic or parsing",
  "timestamp": "2024-11-12T14:32:07.000Z"
}

9.2 POST /api/niyanta/chat
Request body:
{
  "message": "string",
  "conversationHistory": [
    { "role": "user | assistant", "content": "string" }
  ],
  "agentResults": {
    "meeting": { ...result or null... },
    "invoice": { ...result or null... },
    "hr": { ...result or null... },
    "procurement": { ...result or null... },
    "security": { ...result or null... }
  }
}

Success response (200):
{
  "reply": "string",
  "timestamp": "2024-11-12T14:32:07.000Z"
}

9.3 GET /api/audit
Success response (200):
{
  "entries": [
    {
      "id": "uuid",
      "agentId": "meeting",
      "event": "Meeting processed — 6 tasks extracted, 3 decisions made",
      "decision": "AUTO-APPROVE | CRITICAL | null",
      "inputPreview": "First 80 chars of input...",
      "processingTime": 2341,
      "timestamp": "2024-11-12T14:32:07.000Z"
    }
  ],
  "total": 12
}

9.4 GET /api/metrics
Success response (200):
{
  "totalWorkflowsRun": 5,
  "totalTasksCreated": 24,
  "totalDecisionsMade": 8,
  "escalationsTriggered": 2,
  "avgProcessingTimeMs": 2841,
  "agentsActive": 0,
  "uptimeSeconds": 3720,
  "agentRunCounts": {
    "meeting": 1, "invoice": 1, "hr": 1, "procurement": 1, "security": 1
  },
  "decisionBreakdown": {
    "approved": 1, "flagged": 1, "rejected": 0,
    "critical": 1, "proceeded": 1, "escalated": 1
  }
}

9.5 GET /api/health
Success response (200):
{
  "status": "ok",
  "uptime": 3720.5,
  "timestamp": "2024-11-12T14:32:07.000Z",
  "version": "1.0.0",
  "agentsAvailable": 5,
  "totalProcessed": 5
}

================================================================================
SECTION 10 — NON-FUNCTIONAL REQUIREMENTS
================================================================================

10.1 Performance
  - Agent API call must complete within 30 seconds (Anthropic timeout)
  - UI must respond to clicks within 100ms (optimistic UI)
  - Theme toggle must complete in 250ms
  - App must load in under 3 seconds on localhost

10.2 Browser Support
  Desktop only. Optimize for Chrome 120+, Firefox 120+, Safari 17+.
  Minimum viewport: 1280px wide.
  No mobile support required.

10.3 Security
  - ANTHROPIC_API_KEY must never be exposed to frontend
  - All API calls to Anthropic must go through the backend only
  - Rate limiting on all /api/agent/* routes
  - Helmet.js for security headers
  - Input validation on all backend endpoints
  - Max input size: 10,000 characters per agent run

10.4 Accessibility
  - All interactive elements must have hover states
  - Buttons must have disabled states with visual feedback
  - Focus states on all inputs
  - Sufficient color contrast in both themes

10.5 Code Quality
  - No console.error in production (console.log for dev is fine)
  - All useEffect hooks must have cleanup functions where applicable
  - No direct DOM manipulation — use React state only
  - Consistent naming: camelCase for variables/functions, PascalCase for components

================================================================================
SECTION 11 — SETUP AND RUN INSTRUCTIONS
================================================================================

PREREQUISITES:
  - Node.js version 18 or higher
  - npm version 9 or higher
  - Anthropic API key (get from console.anthropic.com)

SETUP STEPS:
  1. Unzip or clone the project into a folder called niyanta
  2. Open terminal and navigate to the niyanta folder: cd niyanta
  3. Copy environment file: cp .env.example .env
  4. Open .env in any text editor and set:
     ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
  5. Install all dependencies: npm install
  6. Start the application: npm start
  7. Wait for both server messages:
     - "Niyanta AI Server running on port 3001"
     - "Compiled successfully. App running at http://localhost:3000"
  8. Open http://localhost:3000 in your browser

DEMO FLOW FOR HACKATHON:
  Step 1: Open app — show the dark themed 3-panel interface
  Step 2: Click "RUN ALL AGENTS" — all 5 sample inputs process automatically
  Step 3: Watch audit trail fill up in real-time on the right panel
  Step 4: Click Meeting agent — show structured decisions and task table
  Step 5: Click Security agent — show CRITICAL severity banner pulsing red
  Step 6: Click DECISIONS tab — show WHY-CHAIN for every decision
  Step 7: Open Niyanta Command chat — type "Give me a cross-workflow risk report"
  Step 8: Show metrics tab — all counters filled, avg processing time
  Step 9: Toggle to light mode — smooth transition, everything stays readable
  Step 10: Close with pitch: "Zero human intervention. Full audit trail. Five agents. One governor."

================================================================================
END OF REQUIREMENTS DOCUMENT
================================================================================
