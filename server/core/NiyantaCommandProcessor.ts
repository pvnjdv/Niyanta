import { WorkflowEngine } from './WorkflowEngine';
import { AuditLogger } from './AuditLogger';
import { getDB } from '../db/database';
import { NiyantaActivityItem, NiyantaReportCard, NiyantaSystemContext } from '../types/api.types';
import { getOrchestrator } from './NiyantaOrchestrator';
import { WorkflowContext, WorkflowEdge, WorkflowNodeInstance } from '../types/workflow.types';

export interface CommandAttachment {
  name: string;
  size: number;
  type: string;
  excerpt: string;
  textContent?: string;
  pageCount?: number;
  sheetNames?: string[];
  extractionStatus?: 'ok' | 'unsupported' | 'failed';
  extractionError?: string;
}

export interface CommandExecutionInput {
  message: string;
  attachments?: CommandAttachment[];
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  agentResults?: Record<string, unknown>;
  systemContext?: NiyantaSystemContext;
}

export interface CommandExecutionResult {
  reply: string;
  timestamp: string;
  activity: NiyantaActivityItem[];
  reports: NiyantaReportCard[];
  matchedAgents: Array<{ agentId: string; label: string }>;
  workflowId?: string;
  runId?: string;
  status: 'COMPLETED' | 'WAITING_APPROVAL' | 'FAILED';
  decision: string;
  inputType: string;
}

type CommandScenario = 'invoice_auto' | 'invoice_approval' | 'procurement_auto' | 'procurement_approval' | 'hr_onboarding' | 'document_review' | 'generic';

type ParsedCommand = {
  inputType: string;
  scenario: CommandScenario;
  workflowId?: string;
  workflowName?: string;
  vendor?: string;
  amount?: number;
  invoiceNumber?: string;
  employeeName?: string;
  role?: string;
  department?: string;
  joiningDate?: string;
  trustedVendor?: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  decision: string;
  nextAction: string;
  matchedAgents: Array<{ agentId: string; label: string }>;
  combinedText: string;
};

type CommandWorkflowDefinition = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  triggers: string[];
  nodes: WorkflowNodeInstance[];
  edges: WorkflowEdge[];
};

type ApprovalCommandAction = 'approve' | 'reject';

type PendingApprovalRow = {
  id: string;
  workflow_run_id: string;
  workflow_id: string;
  workflow_name: string;
  node_name?: string;
  title: string;
  description?: string;
  context?: string;
  assigned_to?: string;
  priority?: string;
  created_at?: string;
};

const TRUSTED_VENDORS = new Set([
  'aws',
  'aws services pvt ltd',
  'amazon web services',
  'zenith supplies',
  'zenith supplies pvt. ltd.',
  'zenith supplies pvt ltd',
  'techsupply',
  'techsupply pvt ltd',
  'techsupply pvt. ltd.',
  'microsoft',
  'google',
  'hdfc',
]);

function normalizeText(value: string): string {
  return value.replace(/\u0000/g, ' ').replace(/\s+/g, ' ').trim();
}

function titleCase(value: string): string {
  return value
    .split(/\s+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function formatCurrency(amount?: number): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return 'Unknown amount';
  }
  return `Rs ${amount.toLocaleString('en-IN')}`;
}

function parseCurrencyAmount(input: string): number | undefined {
  const patterns = [
    /(?:rs\.?|inr|₹)\s*([0-9][0-9,]*(?:\.\d+)?)/i,
    /amount\s*[:=-]\s*(?:rs\.?|inr|₹)?\s*([0-9][0-9,]*(?:\.\d+)?)/i,
    /total(?:\s+due)?\s*[:=-]\s*(?:rs\.?|inr|₹)?\s*([0-9][0-9,]*(?:\.\d+)?)/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match?.[1]) {
      const parsed = Number(match[1].replace(/,/g, ''));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function parseVendor(input: string): string | undefined {
  const vendorPatterns = [
    /vendor\s*[:=-]\s*([^\n|]+)/i,
    /from\s+([a-z0-9 .,&()-]+?)(?:\s+for\s+(?:rs\.?|inr|₹)|\s*$|\.|,)/i,
    /with\s+([a-z0-9 .,&()-]+?)(?:\s+for\s+|\s+worth\s+|\s*$|\.|,)/i,
    /([a-z0-9 .,&()-]+?)\s+(?:sent|submitted)\s+(?:us\s+)?(?:an\s+)?invoice/i,
  ];

  for (const pattern of vendorPatterns) {
    const match = input.match(pattern);
    if (match?.[1]) {
      return titleCase(match[1].trim());
    }
  }

  const normalized = normalizeText(input).toLowerCase();
  const trustedMatches = [...TRUSTED_VENDORS]
    .filter((vendor) => normalized.includes(vendor))
    .sort((left, right) => right.length - left.length);

  if (trustedMatches[0]) {
    return titleCase(trustedMatches[0]);
  }

  return undefined;
}

function parseInvoiceNumber(input: string): string | undefined {
  const labeledMatch = input.match(/invoice\s*(?:number|no\.?|#)\s*[:=-]?\s*([a-z0-9-]+)/i);
  if (labeledMatch?.[1]) {
    return labeledMatch[1].toUpperCase();
  }

  const standaloneMatch = input.match(/\bINV(?:[-/][A-Z0-9]+|[0-9]{2,}[A-Z0-9-]*)\b/i);
  return standaloneMatch?.[0] ? standaloneMatch[0].toUpperCase() : undefined;
}

function parseEmployeeName(input: string): string | undefined {
  const match = input.match(/onboard\s+new\s+employee\s+([a-z .'-]+?)(?:\s+as\s+|$)/i);
  return match?.[1] ? titleCase(match[1].trim()) : undefined;
}

function parseRole(input: string): string | undefined {
  const match = input.match(/as\s+([a-z ]+?)(?:\.|,|$)/i);
  return match?.[1] ? titleCase(match[1].trim()) : undefined;
}

function parseDepartment(input: string): string | undefined {
  const match = input.match(/department\s*[:=-]\s*([^\n|]+)/i);
  return match?.[1] ? titleCase(match[1].trim()) : undefined;
}

function parseJoiningDate(input: string): string | undefined {
  const match = input.match(/joining date\s*[:=-]\s*([^\n|]+)/i);
  return match?.[1] ? match[1].trim() : undefined;
}

function isTrustedVendor(vendor?: string): boolean {
  if (!vendor) {
    return false;
  }

  const normalized = normalizeText(vendor).toLowerCase();
  for (const trusted of TRUSTED_VENDORS) {
    if (normalized.includes(trusted)) {
      return true;
    }
  }
  return false;
}

function buildCombinedText(message: string, attachments: CommandAttachment[]): string {
  const attachmentText = attachments
    .map((attachment) => {
      const text = attachment.textContent || attachment.excerpt || '';
      if (!text) {
        return `File ${attachment.name}`;
      }
      return `File ${attachment.name}: ${text}`;
    })
    .join('\n\n');

  return normalizeText([message, attachmentText].filter(Boolean).join('\n\n'));
}

function detectAgentsForScenario(scenario: CommandScenario): Array<{ agentId: string; label: string }> {
  switch (scenario) {
    case 'invoice_auto':
    case 'invoice_approval':
      return [
        { agentId: 'document', label: 'Document Intelligence' },
        { agentId: 'invoice', label: 'Invoice Processor' },
        { agentId: 'finance_ops', label: 'Finance Operations' },
        { agentId: 'compliance', label: 'Compliance' },
      ];
    case 'procurement_auto':
    case 'procurement_approval':
      return [
        { agentId: 'procurement', label: 'Procurement' },
        { agentId: 'finance_ops', label: 'Finance Operations' },
        { agentId: 'compliance', label: 'Compliance' },
      ];
    case 'hr_onboarding':
      return [
        { agentId: 'hr_ops', label: 'HR Operations' },
        { agentId: 'it_ops', label: 'IT Operations' },
      ];
    case 'document_review':
      return [
        { agentId: 'document', label: 'Document Intelligence' },
        { agentId: 'workflow', label: 'Workflow Intelligence' },
      ];
    default:
      return [{ agentId: 'workflow', label: 'Workflow Intelligence' }];
  }
}

function classifyCommand(message: string, attachments: CommandAttachment[]): ParsedCommand {
  const combinedText = buildCombinedText(message, attachments);
  const lower = combinedText.toLowerCase();
  const fileNames = attachments.map((attachment) => attachment.name.toLowerCase()).join(' ');
  const amount = parseCurrencyAmount(combinedText);
  const vendor = parseVendor(combinedText);
  const invoiceNumber = parseInvoiceNumber(combinedText);
  const employeeName = parseEmployeeName(combinedText);
  const role = parseRole(combinedText);
  const department = parseDepartment(combinedText);
  const joiningDate = parseJoiningDate(combinedText);
  const trustedVendor = isTrustedVendor(vendor);

  const looksLikeInvoice =
    /invoice|gst|po reference|vendor:|invoice number|total due|subtotal/.test(lower) ||
    fileNames.includes('invoice');
  const looksLikeProcurement =
    /procurement|purchase order|purchase request|create purchase order|buy|laptops|quotation|quote/.test(lower);
  const looksLikeHr =
    /onboard|onboarding|new employee|joining date|employee record|induction/.test(lower);
  const looksLikeDocument = attachments.length > 0 || /document|pdf|file|attachment/.test(lower);

  if (looksLikeInvoice) {
    const escalate = (amount || 0) > 50000 || !trustedVendor;
    return {
      inputType: attachments.length > 0 ? 'Invoice Document' : 'Invoice Request',
      scenario: escalate ? 'invoice_approval' : 'invoice_auto',
      workflowId: escalate ? 'niyanta-demo-invoice-approval' : 'niyanta-demo-invoice-auto',
      workflowName: escalate ? 'Invoice Approval Review Workflow' : 'Invoice Straight-Through Workflow',
      vendor,
      amount,
      invoiceNumber,
      trustedVendor,
      riskLevel: escalate ? 'high' : 'low',
      decision: escalate ? 'ESCALATE' : 'AUTO-APPROVE',
      nextAction: escalate ? 'Submit to human approval in Approvals Centre.' : 'Mark invoice approved and trigger payment scheduling.',
      matchedAgents: detectAgentsForScenario(escalate ? 'invoice_approval' : 'invoice_auto'),
      combinedText,
    };
  }

  if (looksLikeProcurement) {
    const escalate = (amount || 0) > 50000 || !trustedVendor;
    return {
      inputType: 'Procurement Request',
      scenario: escalate ? 'procurement_approval' : 'procurement_auto',
      workflowId: escalate ? 'niyanta-demo-procurement-approval' : 'niyanta-demo-procurement-auto',
      workflowName: escalate ? 'Procurement Approval Workflow' : 'Procurement Auto-Fulfilment Workflow',
      vendor,
      amount,
      trustedVendor,
      riskLevel: escalate ? 'high' : 'medium',
      decision: escalate ? 'ESCALATE' : 'PROCEED',
      nextAction: escalate ? 'Queue request for human approval.' : 'Create purchase order and continue fulfilment.',
      matchedAgents: detectAgentsForScenario(escalate ? 'procurement_approval' : 'procurement_auto'),
      combinedText,
    };
  }

  if (looksLikeHr) {
    return {
      inputType: 'HR Task',
      scenario: 'hr_onboarding',
      workflowId: 'niyanta-demo-hr-onboarding',
      workflowName: 'Employee Onboarding Workflow',
      employeeName,
      role,
      department,
      joiningDate,
      riskLevel: 'low',
      decision: 'PROCEED',
      nextAction: 'Initiate onboarding tasks and schedule induction.',
      matchedAgents: detectAgentsForScenario('hr_onboarding'),
      combinedText,
    };
  }

  if (looksLikeDocument) {
    return {
      inputType: 'Document Intake',
      scenario: 'document_review',
      workflowId: 'niyanta-demo-document-review',
      workflowName: 'Document Intake Workflow',
      vendor,
      amount,
      trustedVendor,
      riskLevel: 'medium',
      decision: 'REVIEW',
      nextAction: 'Classify the document and route it to the right team.',
      matchedAgents: detectAgentsForScenario('document_review'),
      combinedText,
    };
  }

  return {
    inputType: 'Operational Command',
    scenario: 'generic',
    riskLevel: 'medium',
    decision: 'ANALYZE',
    nextAction: 'Summarize the request and route manually if needed.',
    matchedAgents: detectAgentsForScenario('generic'),
    combinedText,
  };
}

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function listPendingApprovals(limit: number = 20): PendingApprovalRow[] {
  const db = getDB();
  return db
    .prepare('SELECT * FROM pending_approvals WHERE status = ? ORDER BY created_at DESC LIMIT ?')
    .all('PENDING', limit) as PendingApprovalRow[];
}

function parseApprovalCommand(message: string): { action: ApprovalCommandAction; comment?: string } | null {
  const normalized = normalizeText(message).toLowerCase();
  if (!normalized) {
    return null;
  }

  const approvePattern = /^(approve|approved|yes approve|approve latest|approve this|approve it|go ahead approve|continue with approval)\b/i;
  const rejectPattern = /^(reject|rejected|decline|deny|reject latest|reject this|reject it|do not approve)\b/i;
  const commentMatch = message.match(/(?:because|reason|comment|note)\s*[:=-]?\s*(.+)$/i)
    || message.match(/(?:approve|reject|decline|deny)(?:\s+latest|\s+this|\s+it)?\s*[:=-]\s*(.+)$/i);

  if (approvePattern.test(normalized)) {
    return { action: 'approve', comment: commentMatch?.[1]?.trim() };
  }

  if (rejectPattern.test(normalized)) {
    return { action: 'reject', comment: commentMatch?.[1]?.trim() };
  }

  return null;
}

function selectPendingApproval(message: string, approvals: PendingApprovalRow[]): PendingApprovalRow | null {
  if (approvals.length === 0) {
    return null;
  }

  const normalized = normalizeText(message).toLowerCase();
  const invoiceNumber = parseInvoiceNumber(message);

  if (invoiceNumber) {
    const byInvoice = approvals.find((approval) => {
      const context = parseJsonRecord(approval.context);
      const invoice = (context.invoice || {}) as Record<string, unknown>;
      const metadata = (context.metadata || {}) as Record<string, unknown>;
      return String(invoice.invoiceNumber || metadata.invoiceNumber || '').toUpperCase() === invoiceNumber;
    });

    if (byInvoice) {
      return byInvoice;
    }
  }

  const byWorkflow = approvals.find((approval) => {
    const title = String(approval.title || '').toLowerCase();
    const workflowName = String(approval.workflow_name || '').toLowerCase();
    const description = String(approval.description || '').toLowerCase();

    if (normalized.includes('procurement')) {
      return workflowName.includes('procurement') || title.includes('procurement') || description.includes('procurement');
    }

    if (normalized.includes('invoice')) {
      return workflowName.includes('invoice') || title.includes('invoice') || description.includes('invoice');
    }

    if (normalized.includes('onboarding') || normalized.includes('employee')) {
      return workflowName.includes('onboarding') || title.includes('employee') || description.includes('employee');
    }

    return false;
  });

  return byWorkflow || approvals[0];
}

function buildApprovalReminder(approvals: PendingApprovalRow[]): string | null {
  if (approvals.length === 0) {
    return null;
  }

  const latest = approvals[0];
  const scope = approvals.length === 1
    ? latest.title || latest.workflow_name
    : `${approvals.length} approvals are waiting`;

  return `Approval Required: ${scope}. Please approve from Approvals or type "approve latest" here. Type "reject latest: <reason>" to reject.`;
}

function buildLocalChatReply(message: string): string | null {
  const normalized = normalizeText(message).toLowerCase();

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(normalized)) {
    return [
      'Hello.',
      '',
      'I can chat normally, run workflow scenarios, analyse uploaded files, and handle approval actions.',
      '',
      'Try one of these:',
      'Chat: ask what is active or what I can do.',
      'Command: process an invoice, create a procurement request, or onboard an employee.',
      'Approval: type "approve latest" or "reject latest: <reason>".',
    ].join('\n');
  }

  if (/(what can you do|help|capabilities|how can you help)/i.test(normalized)) {
    return [
      'I can handle both normal chat and agentic operations.',
      '',
      'Chat: answer workflow, audit, and operations questions in plain language.',
      'Scenarios: invoice auto-approval, invoice escalation, procurement, HR onboarding, and document intake.',
      'Files: accept uploads, extract text when possible, and route the document into the right workflow.',
      'Approvals: guide you to Approvals or accept typed approval commands directly here.',
    ].join('\n');
  }

  if (/^(thanks|thank you|ok thanks|great thanks)\b/.test(normalized)) {
    return 'You are welcome. I can keep chatting, run a workflow, or clear a pending approval whenever you are ready.';
  }

  return null;
}

function isConversationalRequest(message: string, attachments: CommandAttachment[], parsed: ParsedCommand): boolean {
  if (attachments.length > 0) {
    return false;
  }

  return parsed.scenario === 'generic';
}

function buildWorkflowDefinitions(parsed: ParsedCommand): CommandWorkflowDefinition | null {
  switch (parsed.scenario) {
    case 'invoice_auto':
      return {
        id: 'niyanta-demo-invoice-auto',
        name: 'Invoice Straight-Through Workflow',
        description: 'Invoice OCR, extraction, validation, vendor check, risk analysis, and automatic payment trigger.',
        category: 'Finance',
        tags: ['invoice', 'approval', 'payment', 'niyanta-demo'],
        triggers: ['manual'],
        nodes: [
          { instanceId: 'invoice-auto-trigger', nodeType: 'manual_trigger', name: 'Input Received', config: {}, position: { x: 60, y: 200 } },
          { instanceId: 'invoice-auto-ocr', nodeType: 'ocr', name: 'OCR', config: { outputFormat: 'Structured JSON' }, position: { x: 280, y: 200 } },
          { instanceId: 'invoice-auto-extract', nodeType: 'invoice_processing', name: 'Field Extraction', config: { autoApproveThreshold: 50000 }, position: { x: 500, y: 200 } },
          { instanceId: 'invoice-auto-validate', nodeType: 'validation', name: 'Validation', config: { rules: 'required:vendor,required:amount,required:invoiceNumber' }, position: { x: 720, y: 200 } },
          { instanceId: 'invoice-auto-vendor', nodeType: 'data_retrieval', name: 'Vendor Check', config: { key: 'vendor-profile' }, position: { x: 940, y: 200 } },
          { instanceId: 'invoice-auto-risk', nodeType: 'risk_analysis', name: 'Risk Analysis', config: { riskDomain: 'invoice' }, position: { x: 1160, y: 200 } },
          { instanceId: 'invoice-auto-pay', nodeType: 'payment', name: 'Trigger Payment', config: { status: 'approved' }, position: { x: 1380, y: 200 } },
          { instanceId: 'invoice-auto-audit', nodeType: 'audit_log', name: 'Audit Log', config: { action: 'invoice-auto-approved' }, position: { x: 1600, y: 200 } },
          { instanceId: 'invoice-auto-dashboard', nodeType: 'dashboard_update', name: 'Dashboard Sync', config: { dashboardId: 'command-centre', metrics: ['invoice_approved', 'payment_triggered'] }, position: { x: 1820, y: 200 } },
        ],
        edges: [
          { id: 'invoice-auto-e1', fromNodeId: 'invoice-auto-trigger', toNodeId: 'invoice-auto-ocr' },
          { id: 'invoice-auto-e2', fromNodeId: 'invoice-auto-ocr', toNodeId: 'invoice-auto-extract' },
          { id: 'invoice-auto-e3', fromNodeId: 'invoice-auto-extract', toNodeId: 'invoice-auto-validate' },
          { id: 'invoice-auto-e4', fromNodeId: 'invoice-auto-validate', toNodeId: 'invoice-auto-vendor' },
          { id: 'invoice-auto-e5', fromNodeId: 'invoice-auto-vendor', toNodeId: 'invoice-auto-risk' },
          { id: 'invoice-auto-e6', fromNodeId: 'invoice-auto-risk', toNodeId: 'invoice-auto-pay' },
          { id: 'invoice-auto-e7', fromNodeId: 'invoice-auto-pay', toNodeId: 'invoice-auto-audit' },
          { id: 'invoice-auto-e8', fromNodeId: 'invoice-auto-audit', toNodeId: 'invoice-auto-dashboard' },
        ],
      };
    case 'invoice_approval':
      return {
        id: 'niyanta-demo-invoice-approval',
        name: 'Invoice Approval Review Workflow',
        description: 'Invoice OCR, extraction, validation, vendor and risk checks, then human approval.',
        category: 'Finance',
        tags: ['invoice', 'approval', 'human-review', 'niyanta-demo'],
        triggers: ['manual'],
        nodes: [
          { instanceId: 'invoice-approval-trigger', nodeType: 'manual_trigger', name: 'Input Received', config: {}, position: { x: 60, y: 200 } },
          { instanceId: 'invoice-approval-ocr', nodeType: 'ocr', name: 'OCR', config: { outputFormat: 'Structured JSON' }, position: { x: 280, y: 200 } },
          { instanceId: 'invoice-approval-extract', nodeType: 'invoice_processing', name: 'Field Extraction', config: { autoApproveThreshold: 50000 }, position: { x: 500, y: 200 } },
          { instanceId: 'invoice-approval-validate', nodeType: 'validation', name: 'Validation', config: { rules: 'required:vendor,required:amount,required:invoiceNumber' }, position: { x: 720, y: 200 } },
          { instanceId: 'invoice-approval-vendor', nodeType: 'data_retrieval', name: 'Vendor Check', config: { key: 'vendor-profile' }, position: { x: 940, y: 200 } },
          { instanceId: 'invoice-approval-risk', nodeType: 'risk_analysis', name: 'Risk Analysis', config: { riskDomain: 'invoice' }, position: { x: 1160, y: 200 } },
          { instanceId: 'invoice-approval-human', nodeType: 'approval', name: 'Escalate to Human Approval', config: { title: 'Invoice Approval Required', description: 'High-value or untrusted vendor invoice requires review.', assignedTo: 'admin', priority: 'high', deadline: '24h', requireComment: true }, position: { x: 1380, y: 200 } },
        ],
        edges: [
          { id: 'invoice-approval-e1', fromNodeId: 'invoice-approval-trigger', toNodeId: 'invoice-approval-ocr' },
          { id: 'invoice-approval-e2', fromNodeId: 'invoice-approval-ocr', toNodeId: 'invoice-approval-extract' },
          { id: 'invoice-approval-e3', fromNodeId: 'invoice-approval-extract', toNodeId: 'invoice-approval-validate' },
          { id: 'invoice-approval-e4', fromNodeId: 'invoice-approval-validate', toNodeId: 'invoice-approval-vendor' },
          { id: 'invoice-approval-e5', fromNodeId: 'invoice-approval-vendor', toNodeId: 'invoice-approval-risk' },
          { id: 'invoice-approval-e6', fromNodeId: 'invoice-approval-risk', toNodeId: 'invoice-approval-human' },
        ],
      };
    case 'procurement_auto':
      return {
        id: 'niyanta-demo-procurement-auto',
        name: 'Procurement Auto-Fulfilment Workflow',
        description: 'Validate request, verify vendor and budget, assess risk, and create purchase order.',
        category: 'Operations',
        tags: ['procurement', 'purchase-order', 'niyanta-demo'],
        triggers: ['manual'],
        nodes: [
          { instanceId: 'proc-auto-trigger', nodeType: 'manual_trigger', name: 'Input Received', config: {}, position: { x: 60, y: 200 } },
          { instanceId: 'proc-auto-validate', nodeType: 'validation', name: 'Request Validation', config: { rules: 'required:vendor,required:amount' }, position: { x: 280, y: 200 } },
          { instanceId: 'proc-auto-vendor', nodeType: 'data_retrieval', name: 'Vendor Check', config: { key: 'vendor-profile' }, position: { x: 500, y: 200 } },
          { instanceId: 'proc-auto-budget', nodeType: 'data_retrieval', name: 'Budget Check', config: { key: 'budget' }, position: { x: 720, y: 200 } },
          { instanceId: 'proc-auto-risk', nodeType: 'risk_analysis', name: 'Risk Analysis', config: { riskDomain: 'procurement' }, position: { x: 940, y: 200 } },
          { instanceId: 'proc-auto-po', nodeType: 'purchase_order', name: 'Create Purchase Order', config: { autoApprove: true }, position: { x: 1160, y: 200 } },
          { instanceId: 'proc-auto-audit', nodeType: 'audit_log', name: 'Audit Log', config: { action: 'procurement-approved' }, position: { x: 1380, y: 200 } },
          { instanceId: 'proc-auto-dashboard', nodeType: 'dashboard_update', name: 'Dashboard Sync', config: { dashboardId: 'command-centre', metrics: ['procurement_created', 'budget_checked'] }, position: { x: 1600, y: 200 } },
        ],
        edges: [
          { id: 'proc-auto-e1', fromNodeId: 'proc-auto-trigger', toNodeId: 'proc-auto-validate' },
          { id: 'proc-auto-e2', fromNodeId: 'proc-auto-validate', toNodeId: 'proc-auto-vendor' },
          { id: 'proc-auto-e3', fromNodeId: 'proc-auto-vendor', toNodeId: 'proc-auto-budget' },
          { id: 'proc-auto-e4', fromNodeId: 'proc-auto-budget', toNodeId: 'proc-auto-risk' },
          { id: 'proc-auto-e5', fromNodeId: 'proc-auto-risk', toNodeId: 'proc-auto-po' },
          { id: 'proc-auto-e6', fromNodeId: 'proc-auto-po', toNodeId: 'proc-auto-audit' },
          { id: 'proc-auto-e7', fromNodeId: 'proc-auto-audit', toNodeId: 'proc-auto-dashboard' },
        ],
      };
    case 'procurement_approval':
      return {
        id: 'niyanta-demo-procurement-approval',
        name: 'Procurement Approval Workflow',
        description: 'Validate request, verify vendor and budget, assess risk, then route to human approval.',
        category: 'Operations',
        tags: ['procurement', 'approval', 'niyanta-demo'],
        triggers: ['manual'],
        nodes: [
          { instanceId: 'proc-approval-trigger', nodeType: 'manual_trigger', name: 'Input Received', config: {}, position: { x: 60, y: 200 } },
          { instanceId: 'proc-approval-validate', nodeType: 'validation', name: 'Request Validation', config: { rules: 'required:vendor,required:amount' }, position: { x: 280, y: 200 } },
          { instanceId: 'proc-approval-vendor', nodeType: 'data_retrieval', name: 'Vendor Check', config: { key: 'vendor-profile' }, position: { x: 500, y: 200 } },
          { instanceId: 'proc-approval-budget', nodeType: 'data_retrieval', name: 'Budget Check', config: { key: 'budget' }, position: { x: 720, y: 200 } },
          { instanceId: 'proc-approval-risk', nodeType: 'risk_analysis', name: 'Risk Analysis', config: { riskDomain: 'procurement' }, position: { x: 940, y: 200 } },
          { instanceId: 'proc-approval-human', nodeType: 'approval', name: 'Escalate to Human Approval', config: { title: 'Procurement Approval Required', description: 'High-value or new-vendor procurement requires review.', assignedTo: 'admin', priority: 'high', deadline: '24h', requireComment: true }, position: { x: 1160, y: 200 } },
        ],
        edges: [
          { id: 'proc-approval-e1', fromNodeId: 'proc-approval-trigger', toNodeId: 'proc-approval-validate' },
          { id: 'proc-approval-e2', fromNodeId: 'proc-approval-validate', toNodeId: 'proc-approval-vendor' },
          { id: 'proc-approval-e3', fromNodeId: 'proc-approval-vendor', toNodeId: 'proc-approval-budget' },
          { id: 'proc-approval-e4', fromNodeId: 'proc-approval-budget', toNodeId: 'proc-approval-risk' },
          { id: 'proc-approval-e5', fromNodeId: 'proc-approval-risk', toNodeId: 'proc-approval-human' },
        ],
      };
    case 'hr_onboarding':
      return {
        id: 'niyanta-demo-hr-onboarding',
        name: 'Employee Onboarding Workflow',
        description: 'Create employee record, generate documents, assign onboarding tasks, and schedule induction.',
        category: 'HR',
        tags: ['hr', 'onboarding', 'niyanta-demo'],
        triggers: ['manual'],
        nodes: [
          { instanceId: 'hr-trigger', nodeType: 'manual_trigger', name: 'Input Received', config: {}, position: { x: 60, y: 200 } },
          { instanceId: 'hr-validate', nodeType: 'validation', name: 'Validate Employee Record', config: { rules: 'required:employeeName,required:department' }, position: { x: 280, y: 200 } },
          { instanceId: 'hr-record', nodeType: 'data_storage', name: 'Create Employee Record', config: { key: 'employee-record', value: 'created' }, position: { x: 500, y: 200 } },
          { instanceId: 'hr-docs', nodeType: 'report_generation', name: 'Generate Documents', config: { reportType: 'onboarding', format: 'PDF', title: 'Onboarding Packet' }, position: { x: 720, y: 200 } },
          { instanceId: 'hr-task', nodeType: 'task_assignment', name: 'Assign Onboarding Tasks', config: { title: 'Onboarding task pack', assignee: 'hr-team', priority: 'high', dueDate: '3d' }, position: { x: 940, y: 200 } },
          { instanceId: 'hr-schedule', nodeType: 'schedule', name: 'Schedule Induction', config: { triggerAt: 'next-business-day' }, position: { x: 1160, y: 200 } },
          { instanceId: 'hr-notify', nodeType: 'notification', name: 'Notify Hiring Team', config: { channel: 'internal', message: 'Onboarding initiated.' }, position: { x: 1380, y: 200 } },
          { instanceId: 'hr-dashboard', nodeType: 'dashboard_update', name: 'Dashboard Sync', config: { dashboardId: 'hr-onboarding', metrics: ['employee_onboarded', 'documents_generated'] }, position: { x: 1600, y: 200 } },
        ],
        edges: [
          { id: 'hr-e1', fromNodeId: 'hr-trigger', toNodeId: 'hr-validate' },
          { id: 'hr-e2', fromNodeId: 'hr-validate', toNodeId: 'hr-record' },
          { id: 'hr-e3', fromNodeId: 'hr-record', toNodeId: 'hr-docs' },
          { id: 'hr-e4', fromNodeId: 'hr-docs', toNodeId: 'hr-task' },
          { id: 'hr-e5', fromNodeId: 'hr-task', toNodeId: 'hr-schedule' },
          { id: 'hr-e6', fromNodeId: 'hr-schedule', toNodeId: 'hr-notify' },
          { id: 'hr-e7', fromNodeId: 'hr-notify', toNodeId: 'hr-dashboard' },
        ],
      };
    case 'document_review':
      return {
        id: 'niyanta-demo-document-review',
        name: 'Document Intake Workflow',
        description: 'OCR, classification, validation, routing, and dashboard update for uploaded documents.',
        category: 'Document Processing',
        tags: ['document', 'classification', 'niyanta-demo'],
        triggers: ['manual'],
        nodes: [
          { instanceId: 'doc-trigger', nodeType: 'manual_trigger', name: 'Input Received', config: {}, position: { x: 60, y: 200 } },
          { instanceId: 'doc-ocr', nodeType: 'ocr', name: 'OCR', config: { outputFormat: 'Plain Text' }, position: { x: 280, y: 200 } },
          { instanceId: 'doc-classify', nodeType: 'classification', name: 'Document Classification', config: { categories: ['invoice', 'procurement', 'hr', 'general'], input: 'document' }, position: { x: 500, y: 200 } },
          { instanceId: 'doc-validate', nodeType: 'validation', name: 'Validation', config: { rules: 'required:documentType' }, position: { x: 720, y: 200 } },
          { instanceId: 'doc-route', nodeType: 'task_assignment', name: 'Route to Team', config: { title: 'Review uploaded document', assignee: 'document-team', priority: 'medium', dueDate: '2d' }, position: { x: 940, y: 200 } },
          { instanceId: 'doc-dashboard', nodeType: 'dashboard_update', name: 'Dashboard Sync', config: { dashboardId: 'document-ops', metrics: ['documents_processed'] }, position: { x: 1160, y: 200 } },
        ],
        edges: [
          { id: 'doc-e1', fromNodeId: 'doc-trigger', toNodeId: 'doc-ocr' },
          { id: 'doc-e2', fromNodeId: 'doc-ocr', toNodeId: 'doc-classify' },
          { id: 'doc-e3', fromNodeId: 'doc-classify', toNodeId: 'doc-validate' },
          { id: 'doc-e4', fromNodeId: 'doc-validate', toNodeId: 'doc-route' },
          { id: 'doc-e5', fromNodeId: 'doc-route', toNodeId: 'doc-dashboard' },
        ],
      };
    default:
      return null;
  }
}

function ensureWorkflow(definition: CommandWorkflowDefinition): void {
  const db = getDB();
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT id FROM workflows WHERE id = ?').get(definition.id) as { id?: string } | undefined;

  if (existing?.id) {
    db.prepare(
      `UPDATE workflows
       SET name = ?, description = ?, nodes = ?, edges = ?, status = 'active', category = ?, tags = ?, triggers = ?, allow_agent_invocation = 1, updated_at = ?
       WHERE id = ?`
    ).run(
      definition.name,
      definition.description,
      JSON.stringify(definition.nodes),
      JSON.stringify(definition.edges),
      definition.category,
      JSON.stringify(definition.tags),
      JSON.stringify(definition.triggers),
      now,
      definition.id
    );
    return;
  }

  db.prepare(
    `INSERT INTO workflows (
      id, name, description, nodes, edges, status, category, tags, triggers, allow_agent_invocation, is_default, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, 1, 1, ?, ?)`
  ).run(
    definition.id,
    definition.name,
    definition.description,
    JSON.stringify(definition.nodes),
    JSON.stringify(definition.edges),
    definition.category,
    JSON.stringify(definition.tags),
    JSON.stringify(definition.triggers),
    now,
    now
  );
}

function buildInitialContext(parsed: ParsedCommand, attachments: CommandAttachment[], agentResults: Record<string, unknown>): Partial<WorkflowContext> {
  const attachmentNames = attachments.map((attachment) => attachment.name);
  const attachmentExcerpt = attachments.map((attachment) => attachment.excerpt).filter(Boolean).join('\n');

  return {
    document: {
      content: parsed.combinedText,
      type: parsed.inputType,
      attachments: attachmentNames,
      excerpt: attachmentExcerpt,
    },
    invoice: parsed.scenario.startsWith('invoice')
      ? {
          vendor: parsed.vendor,
          amount: parsed.amount,
          invoiceNumber: parsed.invoiceNumber,
          trustedVendor: parsed.trustedVendor,
          riskLevel: parsed.riskLevel,
        }
      : {},
    procurement: parsed.scenario.startsWith('procurement')
      ? {
          vendor: parsed.vendor,
          amount: parsed.amount,
          trustedVendor: parsed.trustedVendor,
          riskLevel: parsed.riskLevel,
        }
      : {},
    employee: parsed.scenario === 'hr_onboarding'
      ? {
          name: parsed.employeeName,
          role: parsed.role,
          department: parsed.department,
          joiningDate: parsed.joiningDate,
        }
      : {},
    metadata: {
      commandInput: parsed.combinedText,
      inputType: parsed.inputType,
      scenario: parsed.scenario,
      decisionHint: parsed.decision,
      nextAction: parsed.nextAction,
      vendorTrusted: parsed.trustedVendor,
      amount: parsed.amount,
      vendor: parsed.vendor,
      invoiceNumber: parsed.invoiceNumber,
      employeeName: parsed.employeeName,
      attachmentNames,
      attachmentCount: attachments.length,
      agentResults,
    },
  };
}

function toneFromStatus(status: string): NiyantaActivityItem['tone'] {
  if (status === 'failed') return 'danger';
  if (status === 'waiting') return 'warning';
  if (status === 'completed') return 'success';
  return 'info';
}

function countMeaningfulNodes(logs: WorkflowContext['logs']): number {
  const administrativeNodes = new Set(['input received', 'audit log', 'dashboard sync']);
  const uniqueNodeIds = new Set<string>();

  (logs || []).forEach((log) => {
    if (log.status !== 'completed' && log.status !== 'waiting') {
      return;
    }

    if (administrativeNodes.has(String(log.nodeName || '').trim().toLowerCase())) {
      return;
    }

    uniqueNodeIds.add(log.nodeId);
  });

  return uniqueNodeIds.size;
}

function buildActivity(parsed: ParsedCommand, attachments: CommandAttachment[], workflowName: string | undefined, result: { status: string; context: WorkflowContext }, runId?: string): NiyantaActivityItem[] {
  const startedAt = new Date().toISOString();
  const extractionIssues = attachments.filter((attachment) => attachment.extractionStatus === 'failed' || attachment.extractionStatus === 'unsupported');
  const items: NiyantaActivityItem[] = [
    {
      id: 'command-received',
      label: 'Input received',
      detail: `${parsed.inputType} detected from command channel.`,
      tone: 'info',
      timestamp: startedAt,
    },
    {
      id: 'input-classified',
      label: 'Input classified',
      detail: `${parsed.inputType} routed into ${workflowName || 'Niyanta command'} with decision path ${parsed.decision}.`,
      tone: 'success',
      timestamp: new Date(Date.now() + 120).toISOString(),
    },
  ];

  if (attachments.length > 0) {
    items.push({
      id: 'attachments-ready',
      label: 'File text extracted',
      detail: `${attachments.length} attachment${attachments.length === 1 ? '' : 's'} prepared for OCR and analysis.`,
      tone: 'success',
      timestamp: new Date(Date.now() + 220).toISOString(),
    });
  }

  if (extractionIssues.length > 0) {
    items.push({
      id: 'attachments-fallback',
      label: 'Limited extraction',
      detail: `${extractionIssues.length} attachment${extractionIssues.length === 1 ? '' : 's'} will rely on filename and operator context because text extraction was incomplete.`,
      tone: 'warning',
      timestamp: new Date(Date.now() + 260).toISOString(),
    });
  }

  parsed.matchedAgents.forEach((agent, index) => {
    items.push({
      id: `agent-${agent.agentId}`,
      label: 'Agent activated',
      detail: `${agent.label} received the command context.`,
      tone: 'info',
      timestamp: new Date(Date.now() + 320 + index * 80).toISOString(),
    });
  });

  (result.context.logs || []).forEach((log, index) => {
    items.push({
      id: `${runId || 'run'}-${log.nodeId}-${index}`,
      label: log.nodeName,
      detail: log.message,
      tone: toneFromStatus(log.status),
      timestamp: log.timestamp,
    });
  });

  items.push({
    id: 'niyanta-decision',
    label: 'Niyanta decision',
    detail: `${parsed.decision} — ${parsed.nextAction}`,
    tone: result.status === 'WAITING_APPROVAL' ? 'warning' : 'success',
    timestamp: new Date(Date.now() + 960).toISOString(),
  });

  items.push({
    id: 'dashboard-sync',
    label: 'Application state synced',
    detail: 'Workflow runs, audit trail, metrics, and approvals are ready for the dashboard refresh cycle.',
    tone: 'success',
    timestamp: new Date(Date.now() + 1080).toISOString(),
  });

  return items.sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

function buildReports(parsed: ParsedCommand, result: { status: string; context: WorkflowContext }, runId?: string): NiyantaReportCard[] {
  const nodeCount = countMeaningfulNodes(result.context.logs || []);
  const failureCount = (result.context.logs || []).filter((log) => log.status === 'failed').length;

  return [
    {
      id: 'input-type',
      title: 'Input Type',
      value: parsed.inputType,
      detail: parsed.workflowName || 'Direct command path',
      tone: 'info',
    },
    {
      id: 'decision',
      title: 'Decision',
      value: parsed.decision,
      detail: parsed.nextAction,
      tone: result.status === 'WAITING_APPROVAL' ? 'warning' : parsed.decision === 'AUTO-APPROVE' || parsed.decision === 'PROCEED' ? 'success' : 'info',
    },
    {
      id: 'nodes',
      title: 'Nodes',
      value: String(nodeCount),
      detail: `${failureCount} failure${failureCount === 1 ? '' : 's'} recorded during execution.`,
      tone: failureCount > 0 ? 'danger' : 'success',
    },
    {
      id: 'run',
      title: 'Run Status',
      value: result.status,
      detail: runId ? `Workflow run ${runId.slice(0, 8)} is now persisted.` : 'No workflow run created.',
      tone: result.status === 'WAITING_APPROVAL' ? 'warning' : result.status === 'FAILED' ? 'danger' : 'success',
    },
  ];
}

function buildReply(parsed: ParsedCommand, result: { status: string; context: WorkflowContext }, attachments: CommandAttachment[]): string {
  const nodeCount = countMeaningfulNodes(result.context.logs || []);
  const failureCount = (result.context.logs || []).filter((log) => log.status === 'failed').length;
  const attachmentLine = attachments.length > 0
    ? `Attachments: ${attachments.map((attachment) => attachment.name).join(', ')}`
    : 'Attachments: None';
  const vendorLine = parsed.vendor ? `Vendor: ${parsed.vendor}` : 'Vendor: Not detected';
  const amountLine = parsed.amount ? `Amount: ${formatCurrency(parsed.amount)}` : 'Amount: Not detected';
  const approvalLine = result.status === 'WAITING_APPROVAL'
    ? 'Approval Required: Please approve from Approvals or type "approve latest" here. Type "reject latest: <reason>" to reject.'
    : result.status === 'FAILED'
      ? `Workflow execution failed${failureCount > 0 ? ` after ${failureCount} node error${failureCount === 1 ? '' : 's'}` : ''}. Review the latest run in Command Centre or Workflows.`
      : 'No human intervention is required for this run.';

  return [
    `Input Type: ${parsed.inputType}`,
    parsed.workflowName ? `Workflow: ${parsed.workflowName}` : null,
    vendorLine,
    amountLine,
    parsed.invoiceNumber ? `Invoice Number: ${parsed.invoiceNumber}` : null,
    parsed.employeeName ? `Employee: ${parsed.employeeName}${parsed.role ? `, ${parsed.role}` : ''}` : null,
    attachmentLine,
    `Decision: ${parsed.decision}`,
    `Risk: ${parsed.riskLevel.toUpperCase()}`,
    `Next Action: ${parsed.nextAction}`,
    `Summary: ${nodeCount} operational node${nodeCount === 1 ? '' : 's'} executed.`,
    approvalLine,
  ].filter(Boolean).join('\n');
}

function buildConversationActivity(message: string, pendingApprovals: PendingApprovalRow[]): NiyantaActivityItem[] {
  const startedAt = Date.now();
  const items: NiyantaActivityItem[] = [
    {
      id: 'conversation-received',
      label: 'Conversation received',
      detail: `Handled as a normal chat request: ${message.slice(0, 96)}${message.length > 96 ? '...' : ''}`,
      tone: 'info',
      timestamp: new Date(startedAt).toISOString(),
    },
    {
      id: 'conversation-reply',
      label: 'Reply composed',
      detail: 'Niyanta answered without starting a workflow run.',
      tone: 'success',
      timestamp: new Date(startedAt + 160).toISOString(),
    },
  ];

  if (pendingApprovals.length > 0) {
    items.push({
      id: 'conversation-approval-reminder',
      label: 'Approval reminder',
      detail: `${pendingApprovals.length} approval${pendingApprovals.length === 1 ? '' : 's'} still need action before paused workflows can continue.`,
      tone: 'warning',
      timestamp: new Date(startedAt + 320).toISOString(),
    });
  }

  return items;
}

function buildApprovalCommandActivity(
  action: ApprovalCommandAction,
  approval: PendingApprovalRow,
  result: { status: string; context: WorkflowContext }
): NiyantaActivityItem[] {
  const startedAt = Date.now();
  const items: NiyantaActivityItem[] = [
    {
      id: 'approval-command-received',
      label: 'Approval command received',
      detail: `${action === 'approve' ? 'Approve' : 'Reject'} instruction received from Niyanta Command.`,
      tone: 'info',
      timestamp: new Date(startedAt).toISOString(),
    },
    {
      id: 'approval-command-matched',
      label: 'Approval matched',
      detail: `${approval.title} in ${approval.workflow_name} was selected for resolution.`,
      tone: 'success',
      timestamp: new Date(startedAt + 140).toISOString(),
    },
  ];

  (result.context.logs || []).slice(-4).forEach((log, index) => {
    items.push({
      id: `approval-command-log-${log.nodeId}-${index}`,
      label: log.nodeName,
      detail: log.message,
      tone: toneFromStatus(log.status),
      timestamp: log.timestamp,
    });
  });

  items.push({
    id: 'approval-command-finished',
    label: action === 'approve' ? 'Workflow resumed' : 'Workflow rejected',
    detail: action === 'approve'
      ? (result.status === 'WAITING_APPROVAL'
          ? 'The workflow resumed and is now waiting on another approval step.'
          : result.status === 'COMPLETED'
            ? 'The paused workflow continued successfully after approval.'
            : 'The workflow resumed but still needs operator review.')
      : 'The workflow was stopped after rejection.',
    tone: action === 'approve' ? (result.status === 'FAILED' ? 'danger' : 'success') : 'warning',
    timestamp: new Date(startedAt + 420).toISOString(),
  });

  return items.sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

function buildApprovalCommandReports(
  action: ApprovalCommandAction,
  approval: PendingApprovalRow,
  result: { status: string; context: WorkflowContext }
): NiyantaReportCard[] {
  return [
    {
      id: 'approval-action',
      title: 'Approval',
      value: action === 'approve' ? 'APPROVED' : 'REJECTED',
      detail: approval.title,
      tone: action === 'approve' ? 'success' : 'warning',
    },
    {
      id: 'approval-workflow',
      title: 'Workflow',
      value: approval.workflow_name,
      detail: `Run ${approval.workflow_run_id.slice(0, 8)}`,
      tone: 'info',
    },
    {
      id: 'approval-status',
      title: 'Run Status',
      value: result.status,
      detail: action === 'approve'
        ? 'Execution resumed from the approval node.'
        : 'Execution stopped after rejection.',
      tone: result.status === 'FAILED' ? 'danger' : result.status === 'WAITING_APPROVAL' ? 'warning' : 'success',
    },
  ];
}

function buildApprovalCommandReply(
  action: ApprovalCommandAction,
  approval: PendingApprovalRow,
  result: { status: string; context: WorkflowContext },
  comment?: string
): string {
  const nextAction = action === 'approve'
    ? (result.status === 'WAITING_APPROVAL'
        ? 'Another approval is still pending. Review Approvals or type "approve latest" here again when ready.'
        : result.status === 'COMPLETED'
          ? 'The paused workflow has resumed and continued execution.'
          : 'The workflow resumed but needs operator review because execution did not finish cleanly.')
    : 'The workflow has been stopped after rejection.';

  return [
    'Input Type: Approval Command',
    `Workflow: ${approval.workflow_name}`,
    `Approval Action: ${action === 'approve' ? 'APPROVED' : 'REJECTED'}`,
    `Request: ${approval.title}`,
    comment ? `Comment: ${comment}` : null,
    `Run Status: ${result.status}`,
    `Next Action: ${nextAction}`,
  ].filter(Boolean).join('\n');
}

export class NiyantaCommandProcessor {
  private workflowEngine: WorkflowEngine;
  private auditLogger: AuditLogger;

  constructor() {
    this.workflowEngine = new WorkflowEngine();
    this.auditLogger = new AuditLogger();
  }

  private async handleConversationalRequest(
    input: CommandExecutionInput,
    pendingApprovals: PendingApprovalRow[]
  ): Promise<CommandExecutionResult> {
    const now = new Date().toISOString();
    const localReply = buildLocalChatReply(input.message);
    const orchestrator = getOrchestrator();
    const conversationalReply = localReply || await orchestrator.processOrchestratorChat(
      input.message,
      Array.isArray(input.conversationHistory) ? input.conversationHistory : [],
      input.agentResults || {},
      (input.systemContext || {}) as Record<string, unknown>
    );
    const approvalReminder = buildApprovalReminder(pendingApprovals);
    const reply = approvalReminder
      ? `${conversationalReply}\n\n${approvalReminder}\nApproval Note: You can continue chatting here, but paused workflows resume only after approval.`
      : conversationalReply;

    this.auditLogger.log({
      agentId: 'niyanta_command',
      eventType: 'NIYANTA_COMMAND_CHAT',
      event: 'Niyanta Command handled a conversational request',
      inputPreview: input.message.slice(0, 300),
      metadata: {
        approvalReminder: Boolean(approvalReminder),
        pendingApprovalCount: pendingApprovals.length,
      },
    });

    return {
      reply,
      timestamp: now,
      activity: buildConversationActivity(input.message, pendingApprovals),
      reports: [],
      matchedAgents: [],
      status: 'COMPLETED',
      decision: 'CHAT',
      inputType: 'Conversation',
    };
  }

  private async handleApprovalCommand(
    message: string,
    approvalCommand: { action: ApprovalCommandAction; comment?: string },
    pendingApprovals: PendingApprovalRow[]
  ): Promise<CommandExecutionResult> {
    const now = new Date().toISOString();
    const approval = selectPendingApproval(message, pendingApprovals);

    if (!approval) {
      return {
        reply: [
          'Input Type: Approval Command',
          'Approval Status: No pending approvals are waiting right now.',
          'Next Action: Continue with a normal command, or open Approvals to verify the queue.',
        ].join('\n'),
        timestamp: now,
        activity: [
          {
            id: 'approval-none',
            label: 'No pending approval',
            detail: 'Niyanta did not find any waiting approval request to resolve.',
            tone: 'warning',
            timestamp: now,
          },
        ],
        reports: [],
        matchedAgents: [],
        status: 'COMPLETED',
        decision: 'NO_PENDING_APPROVAL',
        inputType: 'Approval Command',
      };
    }

    const approved = approvalCommand.action === 'approve';
    const comment = approvalCommand.comment || (approved ? 'Approved from Niyanta Command' : 'Rejected from Niyanta Command');
    const db = getDB();

    db.prepare(
      `UPDATE pending_approvals
       SET status = ?, resolved_at = ?, resolved_by = ?, decision_comment = ?, decision_data = ?
       WHERE id = ?`
    ).run(
      approved ? 'APPROVED' : 'REJECTED',
      now,
      'niyanta_command',
      comment,
      null,
      approval.id
    );

    const resolution = await this.workflowEngine.resolveApproval(String(approval.workflow_run_id), {
      approved,
      actor: 'niyanta_command',
      comment,
      data: {},
    });

    this.auditLogger.log({
      agentId: 'niyanta_command',
      eventType: approved ? 'NIYANTA_COMMAND_APPROVAL_APPROVED' : 'NIYANTA_COMMAND_APPROVAL_REJECTED',
      event: `${approved ? 'Approved' : 'Rejected'} ${approval.title} from Niyanta Command`,
      decision: approved ? 'APPROVED' : 'REJECTED',
      metadata: {
        approvalId: approval.id,
        workflowRunId: approval.workflow_run_id,
        workflowId: approval.workflow_id,
        workflowName: approval.workflow_name,
        comment,
        resultingStatus: resolution.status,
      },
    });

    return {
      reply: buildApprovalCommandReply(approvalCommand.action, approval, resolution, comment),
      timestamp: now,
      activity: buildApprovalCommandActivity(approvalCommand.action, approval, resolution),
      reports: buildApprovalCommandReports(approvalCommand.action, approval, resolution),
      matchedAgents: [],
      workflowId: approval.workflow_id,
      runId: approval.workflow_run_id,
      status: resolution.status as 'COMPLETED' | 'WAITING_APPROVAL' | 'FAILED',
      decision: approved ? 'APPROVED' : 'REJECTED',
      inputType: 'Approval Command',
    };
  }

  async execute(input: CommandExecutionInput): Promise<CommandExecutionResult> {
    const attachments = Array.isArray(input.attachments) ? input.attachments : [];
    const agentResults = input.agentResults || {};
    const parsed = classifyCommand(input.message, attachments);
    const now = new Date().toISOString();
    const pendingApprovals = listPendingApprovals();
    const approvalCommand = parseApprovalCommand(input.message);

    this.auditLogger.log({
      agentId: 'niyanta_command',
      eventType: 'NIYANTA_COMMAND_RECEIVED',
      event: `Niyanta Command received ${parsed.inputType}`,
      inputPreview: parsed.combinedText.slice(0, 300),
      metadata: {
        inputType: parsed.inputType,
        scenario: parsed.scenario,
        attachmentCount: attachments.length,
        matchedAgents: parsed.matchedAgents.map((agent) => agent.agentId),
      },
    });

    if (approvalCommand && (pendingApprovals.length > 0 || parsed.scenario === 'generic')) {
      return this.handleApprovalCommand(input.message, approvalCommand, pendingApprovals);
    }

    if (isConversationalRequest(input.message, attachments, parsed)) {
      return this.handleConversationalRequest(input, pendingApprovals);
    }

    let runId: string | undefined;
    let workflowStatus: 'COMPLETED' | 'WAITING_APPROVAL' | 'FAILED' = 'COMPLETED';
    let workflowContext: WorkflowContext = this.workflowEngine.buildInitialContext(parsed.workflowId || 'niyanta-generic', `noop-${Date.now()}`);

    const workflowDefinition = buildWorkflowDefinitions(parsed);
    if (workflowDefinition && parsed.workflowId) {
      ensureWorkflow(workflowDefinition);
      runId = this.workflowEngine.createRun(parsed.workflowId, 'niyanta_command');
      const executionResult = await this.workflowEngine.execute(parsed.workflowId, runId, buildInitialContext(parsed, attachments, agentResults));
      workflowStatus = executionResult.status as 'COMPLETED' | 'WAITING_APPROVAL' | 'FAILED';
      workflowContext = executionResult.context;
    }

    this.auditLogger.log({
      agentId: 'niyanta_command',
      eventType: 'NIYANTA_COMMAND_DECISION',
      event: `Niyanta Command decided ${parsed.decision} for ${parsed.inputType}`,
      decision: parsed.decision,
      metadata: {
        workflowId: parsed.workflowId || null,
        workflowName: parsed.workflowName || null,
        inputType: parsed.inputType,
        workflowStatus,
        runId: runId || null,
        vendor: parsed.vendor || null,
        amount: parsed.amount || null,
        invoiceNumber: parsed.invoiceNumber || null,
        employeeName: parsed.employeeName || null,
        riskLevel: parsed.riskLevel,
        trustedVendor: parsed.trustedVendor ?? null,
        nextAction: parsed.nextAction,
      },
    });

    const result = { status: workflowStatus, context: workflowContext };
    return {
      reply: buildReply(parsed, result, attachments),
      timestamp: now,
      activity: buildActivity(parsed, attachments, parsed.workflowName, result, runId),
      reports: buildReports(parsed, result, runId),
      matchedAgents: parsed.matchedAgents,
      workflowId: parsed.workflowId,
      runId,
      status: workflowStatus,
      decision: parsed.decision,
      inputType: parsed.inputType,
    };
  }
}