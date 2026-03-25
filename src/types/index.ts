// Agent Types
export interface Agent {
  id: AgentId;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  glow: string;
  description: string;
}

export type AgentId = 'meeting' | 'invoice' | 'hr' | 'procurement' | 'security';

export type AgentStatus = 'idle' | 'processing' | 'complete' | 'error';

export interface AgentState {
  status: AgentStatus;
  messages: AgentMessage[];
  result: AgentResult | null;
  taskCount: number;
  lastActivity: string | null;
  processingTime: number | null;
}

export interface AgentMessage {
  type: 'user' | 'agent' | 'error';
  content: string | AgentResult;
  timestamp: string;
  processingTime?: number;
}

export type AgentStates = Record<AgentId, AgentState>;

// Meeting Agent Result
export interface MeetingResult {
  summary: string;
  meeting_type: string;
  attendees: string[];
  decisions: MeetingDecision[];
  tasks: MeetingTask[];
  risks: MeetingRisk[];
  follow_up_meeting: {
    needed: boolean;
    suggested_date: string;
    agenda: string;
  };
  sentiment: 'PRODUCTIVE' | 'TENSE' | 'INCONCLUSIVE' | 'ALIGNED';
  audit: string;
}

export interface MeetingDecision {
  id: number;
  text: string;
  owner: string;
  impact: 'HIGH' | 'MED' | 'LOW';
}

export interface MeetingTask {
  id: number;
  title: string;
  owner: string;
  deadline: string;
  priority: 'HIGH' | 'MED' | 'LOW';
  status: string;
  department: string;
}

export interface MeetingRisk {
  text: string;
  severity: 'HIGH' | 'MED' | 'LOW';
  mitigation: string;
}

// Invoice Agent Result
export interface InvoiceResult {
  summary: string;
  vendor: string;
  vendor_type: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount_subtotal: string;
  amount_tax: string;
  amount_total: string;
  currency: string;
  line_items: InvoiceLineItem[];
  payment_terms: string;
  decision: 'AUTO-APPROVE' | 'FLAG' | 'REJECT';
  decision_reason: string;
  anomalies: InvoiceAnomaly[];
  compliance_checks: ComplianceCheck[];
  recommended_approver: string;
  audit: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: string;
  unit_price: string;
  total: string;
}

export interface InvoiceAnomaly {
  type: string;
  description: string;
  severity: 'HIGH' | 'MED' | 'LOW';
}

export interface ComplianceCheck {
  check: string;
  result: 'PASS' | 'FAIL' | 'WARN';
  note: string;
}

// HR Agent Result
export interface HRResult {
  summary: string;
  employee: HREmployee;
  special_notes: string[];
  documents_needed: HRDocument[];
  system_access: HRSystemAccess[];
  checklist: HRChecklist;
  scheduled_meetings: HRMeeting[];
  equipment: string[];
  compliance_requirements: string[];
  buddy_program: {
    assigned: boolean;
    buddy_role: string;
    first_meeting: string;
  };
  audit: string;
}

export interface HREmployee {
  name: string;
  role: string;
  department: string;
  level: string;
  start_date: string;
  manager: string;
  location: string;
  employment_type: string;
}

export interface HRDocument {
  name: string;
  owner: string;
  deadline: string;
  status: string;
}

export interface HRSystemAccess {
  system: string;
  access_level: 'Full' | 'Read-only' | 'Restricted';
  provisioned_by: string;
  eta: string;
}

export interface HRChecklist {
  before_day_one: HRTask[];
  day_one: HRTask[];
  week_one: HRTask[];
  month_one: HRTask[];
}

export interface HRTask {
  task: string;
  owner: string;
  status: string;
  critical?: boolean;
  time?: string;
  milestone?: boolean;
}

export interface HRMeeting {
  title: string;
  with: string;
  when: string;
  duration: string;
  purpose: string;
}

// Procurement Agent Result
export interface ProcurementResult {
  summary: string;
  request_id: string;
  item: string;
  category: string;
  quantity: string;
  estimated_cost: string;
  cost_per_unit: string;
  currency: string;
  requester: string;
  department: string;
  business_justification: string;
  urgency: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  budget_code: string;
  approval_chain: ApprovalStep[];
  vendor_recommendation: VendorRecommendation;
  compliance_flags: ComplianceFlag[];
  policy_checks: PolicyCheck[];
  timeline: ProcurementTimeline;
  decision: 'PROCEED' | 'HOLD' | 'REJECT' | 'ESCALATE';
  decision_reason: string;
  next_steps: string[];
  audit: string;
}

export interface ApprovalStep {
  step: number;
  approver: string;
  role: string;
  threshold: string;
  status: 'PENDING' | 'REQUIRED' | 'OPTIONAL';
}

export interface VendorRecommendation {
  single_source: boolean;
  reason: string;
  suggested_vendors: string[];
  quotes_required: number;
}

export interface ComplianceFlag {
  flag: string;
  severity: 'HIGH' | 'MED' | 'LOW';
  action_required: string;
}

export interface PolicyCheck {
  policy: string;
  result: 'PASS' | 'FAIL' | 'WARN';
  note: string;
}

export interface ProcurementTimeline {
  approval_deadline: string;
  expected_delivery: string;
  contract_required: boolean;
}

// Security Agent Result
export interface SecurityResult {
  summary: string;
  incident_id: string;
  event_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  threat_actor: string;
  affected: SecurityAffected;
  attack_vector: AttackVector;
  timeline: SecurityTimeline;
  immediate_actions: ImmediateAction[];
  containment_steps: string[];
  escalate_to_human: boolean;
  escalation_contact: string;
  escalation_reason: string;
  regulatory_impact: RegulatoryImpact;
  recommended_response_level: string;
  audit: string;
}

export interface SecurityAffected {
  users: string[];
  systems: string[];
  data_at_risk: string[];
  blast_radius: string;
}

export interface AttackVector {
  method: string;
  entry_point: string;
  indicators: string[];
}

export interface SecurityTimeline {
  detected_at: string;
  started_at: string;
  duration: string;
  still_active: boolean;
}

export interface ImmediateAction {
  priority: number;
  action: string;
  owner: string;
  eta: string;
}

export interface RegulatoryImpact {
  gdpr: boolean;
  hipaa: boolean;
  pci: boolean;
  sox: boolean;
  notification_required: boolean;
}

// Union type for all agent results
export type AgentResult = MeetingResult | InvoiceResult | HRResult | ProcurementResult | SecurityResult;

// Audit Types
export interface AuditEntry {
  id: string;
  agentId: AgentId;
  message: string;
  decision: string | null;
  timestamp: string;
  isNew?: boolean;
}

// Metrics Types
export interface Metrics {
  totalWorkflowsRun: number;
  totalTasksCreated: number;
  totalDecisionsMade: number;
  escalationsTriggered: number;
  avgProcessingTimeMs: number;
  agentsActive: number;
  uptimeSeconds: number;
  agentRunCounts: Record<AgentId, number>;
  decisionBreakdown: DecisionBreakdown;
}

export interface DecisionBreakdown {
  approved: number;
  flagged: number;
  rejected: number;
  critical: number;
  proceeded: number;
  escalated: number;
}

// API Response Types
export interface AgentRunResponse {
  success: boolean;
  sessionId: string;
  agentId: AgentId;
  result: AgentResult;
  processingTime: number;
  timestamp: string;
}

export interface NiyantaChatResponse {
  reply: string;
  timestamp: string;
}

export interface AuditResponse {
  entries: AuditEntry[];
  total: number;
}

export interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
  version: string;
  agentsAvailable: number;
  totalProcessed: number;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isError?: boolean;
}

// Toast Types
export interface Toast {
  message: string;
  type: 'info' | 'success' | 'error';
  visible: boolean;
}

// Theme Types
export type Theme = 'dark' | 'light';
