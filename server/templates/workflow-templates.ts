export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Finance' | 'HR' | 'Operations' | 'Security' | 'Compliance' | 'IT' | 'Document Processing' | 'General';
  tags: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  icon: string;
  nodes: any[];
  edges: any[];
  triggers: string[];
  defaultConfig?: Record<string, any>;
}

// Layout helpers: nodes are spaced 270px horizontally, 160px vertically
// Multi-branch: same x, different y offsets

export const workflowTemplates: WorkflowTemplate[] = [
  // ─────────────────────────────────────────────────────────────────
  //  1. INVOICE APPROVAL (Finance) — 12 nodes
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'invoice-approval-flow',
    name: 'Invoice Approval Workflow',
    description: 'Full end-to-end automated invoice processing: file upload → OCR extraction → validation → amount-based routing → manager approval → payment scheduling → archival.',
    category: 'Finance',
    tags: ['invoice', 'approval', 'ocr', 'finance', 'payment'],
    complexity: 'intermediate',
    estimatedTime: '5-10 min',
    icon: '💰',
    triggers: ['invoice_uploaded', 'email_received'],
    nodes: [
      { id: 'n1', type: 'File Upload', name: 'Receive Invoice File', position: { x: 60, y: 220 }, config: { acceptedFormats: ['PDF', 'PNG', 'JPEG'], maxSizeMB: 20, storagePath: '/uploads/invoices' } },
      { id: 'n2', type: 'OCR', name: 'Extract Invoice Text', position: { x: 340, y: 220 }, config: { language: 'Auto-detect', dpi: 300, preprocessImage: true, outputFormat: 'Structured JSON', confidenceThreshold: 0.85 } },
      { id: 'n3', type: 'Field Extractor', name: 'Parse Invoice Fields', position: { x: 620, y: 220 }, config: { fields: ['Invoice Number', 'Vendor Name', 'Invoice Date', 'Due Date', 'Line Items', 'Subtotal', 'Tax', 'Total Amount', 'Bank Details'], requiredFields: ['Invoice Number', 'Total Amount', 'Vendor Name'] } },
      { id: 'n4', type: 'Validation', name: 'Validate Invoice Data', position: { x: 900, y: 220 }, config: { rules: ['invoice_number_format', 'amount_positive', 'date_valid', 'vendor_exists', 'duplicate_check'], failAction: 'Reject and Notify' } },
      { id: 'n5', type: 'Invoice Processor', name: 'Process & Classify Invoice', position: { x: 1180, y: 220 }, config: { extractFields: ['Invoice Number', 'Date', 'Vendor', 'Amount', 'Tax', 'PO Number'], validateAmount: true, requireApproval: 5000, currencyNormalize: true, taxCalculation: 'Auto' } },
      { id: 'n6', type: 'Risk Analysis', name: 'Fraud Risk Check', position: { x: 1460, y: 220 }, config: { factors: ['vendor_history', 'amount_anomaly', 'duplicate_invoice', 'blacklist'], threshold: 0.7, blockOnHigh: true } },
      { id: 'n7', type: 'If/Else', name: 'Amount > $5,000?', position: { x: 1740, y: 220 }, config: { condition: 'invoice.total_amount > 5000', operator: 'greater than', value: '5000', trueLabel: 'Requires Approval', falseLabel: 'Auto-Approve' } },
      { id: 'n8', type: 'Approval', name: 'CFO Approval Required', position: { x: 2020, y: 100 }, config: { title: 'High-Value Invoice Approval', description: 'Invoice exceeds $5,000 threshold. CFO sign-off required.', assignedTo: 'cfo', priority: 'high', deadline: '24h', requireComment: true, escalateTo: 'board', escalateAfter: '48h' } },
      { id: 'n9', type: 'Purchase Order', name: 'Auto-Approve & Schedule', position: { x: 2020, y: 340 }, config: { autoApprove: true, paymentTerms: 'Net 30', schedulePayment: true, notifyVendor: true } },
      { id: 'n10', type: 'Save Data', name: 'Record in Ledger', position: { x: 2300, y: 220 }, config: { table: 'invoices', operation: 'Insert', dataPath: 'context.invoice', generateAuditTrail: true, indexFields: ['invoice_number', 'vendor_id', 'status'] } },
      { id: 'n11', type: 'PDF Report', name: 'Generate Payment Advice', position: { x: 2580, y: 220 }, config: { template: 'payment_advice', includeLineItems: true, includeAuditTrail: true, watermark: false } },
      { id: 'n12', type: 'Notification', name: 'Notify Submitter & Vendor', position: { x: 2860, y: 220 }, config: { channels: ['Email', 'In-App'], title: 'Invoice Processed', message: 'Your invoice {{invoice_number}} for {{amount}} has been {{status}}.', priority: 'Normal', includeAttachment: true } },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2' },
      { id: 'e2', fromNodeId: 'n2', toNodeId: 'n3' },
      { id: 'e3', fromNodeId: 'n3', toNodeId: 'n4' },
      { id: 'e4', fromNodeId: 'n4', toNodeId: 'n5' },
      { id: 'e5', fromNodeId: 'n5', toNodeId: 'n6' },
      { id: 'e6', fromNodeId: 'n6', toNodeId: 'n7' },
      { id: 'e7', fromNodeId: 'n7', toNodeId: 'n8', condition: 'true' },
      { id: 'e8', fromNodeId: 'n7', toNodeId: 'n9', condition: 'false' },
      { id: 'e9', fromNodeId: 'n8', toNodeId: 'n10' },
      { id: 'e10', fromNodeId: 'n9', toNodeId: 'n10' },
      { id: 'e11', fromNodeId: 'n10', toNodeId: 'n11' },
      { id: 'e12', fromNodeId: 'n11', toNodeId: 'n12' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  2. MEETING INTELLIGENCE (Operations) — 11 nodes
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'meeting-intelligence',
    name: 'Meeting Intelligence Workflow',
    description: 'Process meeting recordings/transcripts: AI extraction of action items, decisions, risks, sentiment scoring, and automated assignee notifications with follow-up tracking.',
    category: 'Operations',
    tags: ['meeting', 'transcript', 'ai', 'productivity', 'action-items'],
    complexity: 'intermediate',
    estimatedTime: '3-5 min',
    icon: '🎯',
    triggers: ['transcript_uploaded', 'meeting_ended', 'recording_ready'],
    nodes: [
      { id: 'n1', type: 'File Upload', name: 'Upload Transcript / Recording', position: { x: 60, y: 220 }, config: { acceptedFormats: ['TXT', 'DOCX', 'VTT', 'MP3', 'MP4'], maxSizeMB: 500, autoTranscribe: true } },
      { id: 'n2', type: 'Header/Footer Cleaner', name: 'Clean Transcript Text', position: { x: 340, y: 220 }, config: { removeTimestamps: false, removeSpeakerLabels: false, normalizeSpacing: true, removeFiller: true } },
      { id: 'n3', type: 'LLM Reasoning', name: 'AI: Extract Meeting Intel', position: { x: 620, y: 220 }, config: { model: 'llama-3.3-70b', prompt: 'As an enterprise meeting analyst, extract: 1) Action items (owner, deadline, priority), 2) Decisions made (decision, rationale, stakeholders), 3) Risks identified, 4) Key discussion topics, 5) Attendance summary, 6) Sentiment score (0-10). Return structured JSON.', temperature: 0.2, maxTokens: 4000, includeContext: true, retryOnFailure: true } },
      { id: 'n4', type: 'Classification', name: 'Classify Meeting Type', position: { x: 900, y: 220 }, config: { categories: ['strategy', 'standup', 'retrospective', 'client-call', 'incident', 'planning', 'review'], confidenceThreshold: 0.75 } },
      { id: 'n5', type: 'Risk Analysis', name: 'Flag Escalation Risks', position: { x: 1180, y: 220 }, config: { factors: ['unresolved_blockers', 'missed_deadlines', 'escalation_language', 'negative_sentiment'], threshold: 0.6, autoEscalate: true } },
      { id: 'n6', type: 'Save Data', name: 'Save Meeting Record', position: { x: 1460, y: 220 }, config: { table: 'meetings', operation: 'Insert', includeFullTranscript: true, indexFields: ['meeting_date', 'meeting_type', 'participants'], generateSummary: true } },
      { id: 'n7', type: 'Loop', name: 'Process Each Action Item', position: { x: 1740, y: 220 }, config: { arrayPath: 'context.actionItems', maxIterations: 100, parallel: false, breakOnError: false } },
      { id: 'n8', type: 'Task Assignment', name: 'Create Task in System', position: { x: 2020, y: 220 }, config: { title: '{{item.title}}', description: '{{item.description}}', assignTo: '{{item.owner}}', dueDate: '{{item.deadline}}', priority: '{{item.priority}}', tags: ['meeting-action'], linkToMeeting: true } },
      { id: 'n9', type: 'Notification', name: 'Notify Assignees', position: { x: 2300, y: 220 }, config: { channels: ['Email', 'Slack', 'In-App'], title: 'New Action Item from {{meeting.title}}', message: 'You have been assigned: {{item.title}}\nDeadline: {{item.deadline}}\nPriority: {{item.priority}}', priority: 'Normal' } },
      { id: 'n10', type: 'PDF Report', name: 'Generate Meeting Summary PDF', position: { x: 2580, y: 220 }, config: { template: 'meeting_summary', sections: ['overview', 'decisions', 'action_items', 'risks', 'next_steps'], includeTranscript: false } },
      { id: 'n11', type: 'Dashboard Update', name: 'Update Meeting Dashboard', position: { x: 2860, y: 220 }, config: { dashboardId: 'meetings-overview', metrics: ['total_actions', 'open_actions', 'decisions_count', 'sentiment_score'], refreshMode: 'append' } },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2' },
      { id: 'e2', fromNodeId: 'n2', toNodeId: 'n3' },
      { id: 'e3', fromNodeId: 'n3', toNodeId: 'n4' },
      { id: 'e4', fromNodeId: 'n4', toNodeId: 'n5' },
      { id: 'e5', fromNodeId: 'n5', toNodeId: 'n6' },
      { id: 'e6', fromNodeId: 'n6', toNodeId: 'n7' },
      { id: 'e7', fromNodeId: 'n7', toNodeId: 'n8' },
      { id: 'e8', fromNodeId: 'n8', toNodeId: 'n9' },
      { id: 'e9', fromNodeId: 'n9', toNodeId: 'n10' },
      { id: 'e10', fromNodeId: 'n10', toNodeId: 'n11' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  3. DOCUMENT CLASSIFICATION (Document Processing) — 12 nodes
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'document-classification',
    name: 'Smart Document Classification & Routing',
    description: 'AI-powered document intake: OCR → cleaning → classification → field extraction → department routing → validation → archival with full audit trail.',
    category: 'Document Processing',
    tags: ['document', 'classification', 'ai', 'routing', 'ocr'],
    complexity: 'beginner',
    estimatedTime: '2-4 min',
    icon: '📄',
    triggers: ['document_uploaded', 'email_attachment', 'fax_received'],
    nodes: [
      { id: 'n1', type: 'Webhook', name: 'Document Intake Webhook', position: { x: 60, y: 220 }, config: { method: 'POST', path: '/intake/document', authentication: 'API Key', rateLimit: 100, payloadSchema: 'document_intake_v1' } },
      { id: 'n2', type: 'OCR', name: 'Extract Raw Text', position: { x: 340, y: 220 }, config: { language: 'Auto-detect', dpi: 300, preprocessImage: true, outputFormat: 'Plain Text', handwritingMode: false, tableExtraction: true } },
      { id: 'n3', type: 'Header/Footer Cleaner', name: 'Clean & Normalize Text', position: { x: 620, y: 220 }, config: { removePageNumbers: true, removeStandardHeaders: true, normalizeWhitespace: true, removeBoilerplate: true, minContentLength: 50 } },
      { id: 'n4', type: 'Document Classifier', name: 'AI Document Classification', position: { x: 900, y: 220 }, config: { categories: ['invoice', 'purchase_order', 'contract', 'nda', 'receipt', 'payslip', 'bank_statement', 'tax_form', 'legal_notice', 'correspondence'], model: 'classifier-v2', confidenceThreshold: 0.7, fallbackCategory: 'unclassified' } },
      { id: 'n5', type: 'Field Extractor', name: 'Extract Structured Fields', position: { x: 1180, y: 220 }, config: { fields: ['document_date', 'reference_number', 'issuer', 'recipient', 'amount', 'currency', 'due_date', 'subject', 'signatures'], useLLM: true, validateFormats: true } },
      { id: 'n6', type: 'Validation', name: 'Validate Extracted Data', position: { x: 1460, y: 220 }, config: { rules: ['required_fields_present', 'date_format_valid', 'amount_numeric', 'reference_unique'], confidenceMin: 0.8, quarantineLow: true } },
      { id: 'n7', type: 'Switch', name: 'Route by Document Type', position: { x: 1740, y: 220 }, config: { field: 'documentType', cases: ['invoice → Finance', 'contract → Legal', 'payslip → HR', 'tax_form → Compliance', 'default → General'], preserveContext: true } },
      { id: 'n8', type: 'Task Assignment', name: 'Assign to Department', position: { x: 2020, y: 120 }, config: { title: 'Review {{documentType}}: {{reference_number}}', assignRule: 'round-robin', departmentMap: { invoice: 'finance-team', contract: 'legal-team', payslip: 'hr-team' }, priority: 'Normal', slaHours: 24 } },
      { id: 'n9', type: 'Cache', name: 'Cache for Dedup', position: { x: 2020, y: 280 }, config: { keyField: 'document_hash', ttlHours: 720, deduplicateMode: true, alertOnDuplicate: true } },
      { id: 'n10', type: 'Save Data', name: 'Archive Document', position: { x: 2300, y: 220 }, config: { table: 'documents', operation: 'Insert', storageBackend: 'S3', generateThumbnail: true, fullTextIndex: true, retentionYears: 7 } },
      { id: 'n11', type: 'Metrics', name: 'Update Classification Metrics', position: { x: 2580, y: 220 }, config: { metrics: ['documents_processed', 'classification_accuracy', 'avg_processing_time', 'documents_by_type'], granularity: 'daily' } },
      { id: 'n12', type: 'Notification', name: 'Confirm Document Received', position: { x: 2860, y: 220 }, config: { channels: ['Email'], title: 'Document Received: {{reference_number}}', message: 'Your {{documentType}} has been received and routed to {{department}}. Reference: {{reference_number}}', priority: 'Low' } },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2' },
      { id: 'e2', fromNodeId: 'n2', toNodeId: 'n3' },
      { id: 'e3', fromNodeId: 'n3', toNodeId: 'n4' },
      { id: 'e4', fromNodeId: 'n4', toNodeId: 'n5' },
      { id: 'e5', fromNodeId: 'n5', toNodeId: 'n6' },
      { id: 'e6', fromNodeId: 'n6', toNodeId: 'n7' },
      { id: 'e7', fromNodeId: 'n7', toNodeId: 'n8', condition: 'department-assigned' },
      { id: 'e8', fromNodeId: 'n7', toNodeId: 'n9', condition: 'cache-check' },
      { id: 'e9', fromNodeId: 'n8', toNodeId: 'n10' },
      { id: 'e10', fromNodeId: 'n9', toNodeId: 'n10' },
      { id: 'e11', fromNodeId: 'n10', toNodeId: 'n11' },
      { id: 'e12', fromNodeId: 'n11', toNodeId: 'n12' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  4. EMPLOYEE ONBOARDING (HR) — 14 nodes
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding Automation',
    description: 'Complete new-hire workflow: record creation → parallel provisioning (IT, HR paperwork, workspace, access) → AI-generated welcome package → task tracking → 30-day check-in scheduling.',
    category: 'HR',
    tags: ['hr', 'onboarding', 'automation', 'employee', 'provisioning'],
    complexity: 'advanced',
    estimatedTime: '10-15 min',
    icon: '👥',
    triggers: ['employee_hired', 'offer_accepted', 'hris_event'],
    nodes: [
      { id: 'n1', type: 'API Trigger', name: 'HRIS New-Hire Event', position: { x: 60, y: 280 }, config: { source: 'Workday', eventType: 'employee.hired', webhook: true, validation: true, enrichWithProfile: true } },
      { id: 'n2', type: 'Validation', name: 'Validate Employee Record', position: { x: 340, y: 280 }, config: { rules: ['email_unique', 'manager_exists', 'department_valid', 'start_date_future', 'role_approved'], failAction: 'Alert HR and Hold' } },
      { id: 'n3', type: 'Save Data', name: 'Create Employee Record', position: { x: 620, y: 280 }, config: { table: 'employees', operation: 'Insert', generateEmployeeId: true, encryptSensitiveFields: ['ssn', 'bank_details'], auditLog: true } },
      { id: 'n4', type: 'Parallel', name: 'Launch Parallel Tracks', position: { x: 900, y: 280 }, config: { maxConcurrent: 4, waitForAll: true, timeoutHours: 72 } },
      { id: 'n5', type: 'Task Assignment', name: 'IT: Provision Accounts', position: { x: 1180, y: 80 }, config: { title: 'Provision IT accounts for {{employee.name}}', assignTo: 'it-provisioning', priority: 'High', checklist: ['Create AD account', 'Setup email', 'Assign laptop', 'Configure VPN', 'Enable MFA', 'Install software bundle'], dueDate: 'start_date - 1' } },
      { id: 'n6', type: 'Task Assignment', name: 'HR: Process Paperwork', position: { x: 1180, y: 220 }, config: { title: 'Complete onboarding docs for {{employee.name}}', assignTo: 'hr-coordinator', priority: 'High', checklist: ['Collect I-9', 'Benefits enrollment', 'Policy acknowledgment', 'W-4 form', 'Direct deposit setup'], dueDate: 'start_date' } },
      { id: 'n7', type: 'Task Assignment', name: 'Facilities: Setup Workspace', position: { x: 1180, y: 360 }, config: { title: 'Prepare workspace for {{employee.name}}', assignTo: 'facilities-manager', priority: 'Medium', checklist: ['Assign desk/office', 'Order supplies', 'Configure phone', 'Setup security badge'], dueDate: 'start_date - 2' } },
      { id: 'n8', type: 'Task Assignment', name: 'Manager: Prep Onboarding Plan', position: { x: 1180, y: 500 }, config: { title: '30-60-90 day plan for {{employee.name}}', assignTo: '{{employee.manager}}', priority: 'High', checklist: ['Create 30-day plan', 'Intro meetings', 'KPI document', 'Buddy assignment'], dueDate: 'start_date - 3' } },
      { id: 'n9', type: 'Merge', name: 'Wait for All Tracks', position: { x: 1460, y: 280 }, config: { strategy: 'wait-all', timeout: '72h', partialResultsOnTimeout: true } },
      { id: 'n10', type: 'LLM Reasoning', name: 'AI: Generate Welcome Package', position: { x: 1740, y: 280 }, config: { model: 'llama-3.3-70b', prompt: 'Generate a personalized welcome email and 30-day onboarding schedule for {{employee.name}} joining as {{employee.role}} in {{employee.department}}. Include team introductions, key contacts, first-week agenda, and useful resources. Tone: professional and welcoming.', temperature: 0.7, maxTokens: 2000 } },
      { id: 'n11', type: 'Notification', name: 'Welcome Email to New Hire', position: { x: 2020, y: 180 }, config: { channels: ['Email'], title: 'Welcome to the team, {{employee.first_name}}! 🎉', message: '{{context.welcomeMessage}}', priority: 'High', sendAt: 'start_date morning', includeCalendarInvites: true } },
      { id: 'n12', type: 'Notification', name: 'Announce to Team', position: { x: 2020, y: 380 }, config: { channels: ['Slack', 'Email'], title: 'New team member: {{employee.name}}', message: 'Please welcome {{employee.name}} who joins as {{employee.role}}!', audience: 'department', priority: 'Low' } },
      { id: 'n13', type: 'Schedule', name: 'Schedule 30-Day Check-In', position: { x: 2300, y: 280 }, config: { triggerAt: 'start_date + 30 days', eventTitle: '30-Day Check-In: {{employee.name}}', participants: ['{{employee.email}}', '{{employee.manager}}', 'hr-coordinator'], duration: '30min', createCalendarEvent: true } },
      { id: 'n14', type: 'Dashboard Update', name: 'Update HR Dashboard', position: { x: 2580, y: 280 }, config: { dashboardId: 'hr-onboarding', metrics: ['new_hires_this_month', 'onboarding_completion_rate', 'days_to_productive'], refreshMode: 'upsert' } },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2' },
      { id: 'e2', fromNodeId: 'n2', toNodeId: 'n3' },
      { id: 'e3', fromNodeId: 'n3', toNodeId: 'n4' },
      { id: 'e4', fromNodeId: 'n4', toNodeId: 'n5' },
      { id: 'e5', fromNodeId: 'n4', toNodeId: 'n6' },
      { id: 'e6', fromNodeId: 'n4', toNodeId: 'n7' },
      { id: 'e7', fromNodeId: 'n4', toNodeId: 'n8' },
      { id: 'e8', fromNodeId: 'n5', toNodeId: 'n9' },
      { id: 'e9', fromNodeId: 'n6', toNodeId: 'n9' },
      { id: 'e10', fromNodeId: 'n7', toNodeId: 'n9' },
      { id: 'e11', fromNodeId: 'n8', toNodeId: 'n9' },
      { id: 'e12', fromNodeId: 'n9', toNodeId: 'n10' },
      { id: 'e13', fromNodeId: 'n10', toNodeId: 'n11' },
      { id: 'e14', fromNodeId: 'n10', toNodeId: 'n12' },
      { id: 'e15', fromNodeId: 'n11', toNodeId: 'n13' },
      { id: 'e16', fromNodeId: 'n12', toNodeId: 'n13' },
      { id: 'e17', fromNodeId: 'n13', toNodeId: 'n14' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  5. SECURITY INCIDENT RESPONSE (Security) — 13 nodes
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'security-incident-response',
    name: 'Security Incident Response',
    description: 'Automated SIEM-triggered response flow: threat ingestion → AI severity scoring → parallel investigation tracks → executive escalation → containment approval → remediation → compliance logging.',
    category: 'Security',
    tags: ['security', 'incident', 'alert', 'compliance', 'siem', 'threat'],
    complexity: 'advanced',
    estimatedTime: '8-12 min',
    icon: '🔒',
    triggers: ['security_alert', 'anomaly_detected', 'siem_event', 'ids_alert'],
    nodes: [
      { id: 'n1', type: 'API Trigger', name: 'SIEM Alert Ingestion', position: { x: 60, y: 280 }, config: { source: 'Splunk', authentication: 'OAuth2', filterSeverity: 'medium,high,critical', enrichWithThreatIntel: true, deduplicateWindow: '5m' } },
      { id: 'n2', type: 'LLM Reasoning', name: 'AI Threat Analysis', position: { x: 340, y: 280 }, config: { model: 'llama-3.3-70b', prompt: 'Analyze this security event. Provide: 1) Threat classification (malware/phishing/intrusion/data-breach/DoS/insider), 2) MITRE ATT&CK mapping, 3) Affected systems and blast radius, 4) Immediate indicators of compromise, 5) Recommended containment actions, 6) Severity score 0-10. Be precise and concise.', temperature: 0.1, maxTokens: 2000 } },
      { id: 'n3', type: 'Risk Analysis', name: 'Score & Prioritize Threat', position: { x: 620, y: 280 }, config: { factors: ['cvss_score', 'affected_systems', 'data_sensitivity', 'active_exploitation', 'business_impact', 'lateral_movement'], weights: { cvss_score: 0.3, business_impact: 0.4, active_exploitation: 0.3 }, threshold: { low: 3, medium: 6, high: 8, critical: 9 } } },
      { id: 'n4', type: 'If/Else', name: 'Critical Incident?', position: { x: 900, y: 280 }, config: { condition: 'risk.score >= 8', operator: 'greater than or equal', value: '8', trueLabel: 'Critical Response', falseLabel: 'Standard Response' } },
      { id: 'n5', type: 'Parallel', name: 'Launch Response Tracks', position: { x: 1180, y: 160 }, config: { maxConcurrent: 3, waitForAll: false, fireAndForget: false } },
      { id: 'n6', type: 'Notification', name: 'Page Security Team NOW', position: { x: 1460, y: 60 }, config: { channels: ['PagerDuty', 'SMS', 'Slack', 'Email'], title: '🚨 CRITICAL SECURITY INCIDENT', message: 'Immediate response required. Threat: {{analysis.threat_type}}. Severity: {{risk.score}}/10. Affected: {{affected_systems}}', priority: 'Critical', escalateAfterMinutes: 5 } },
      { id: 'n7', type: 'Approval', name: 'CISO: Authorize Containment', position: { x: 1460, y: 200 }, config: { title: 'Authorize System Isolation', description: 'Critical incident detected. Authorize immediate isolation of affected systems: {{affected_systems}}. Estimated business impact: {{impact_assessment}}.', assignedTo: 'ciso', priority: 'critical', deadline: '15m', alternatives: ['Isolate All', 'Partial Isolation', 'Monitor Only'], requireComment: true } },
      { id: 'n8', type: 'Task Assignment', name: 'IR Team: Contain Threat', position: { x: 1460, y: 340 }, config: { title: 'Execute containment plan for {{incident.id}}', assignTo: 'ir-team-lead', priority: 'Critical', checklist: ['Isolate affected hosts', 'Block malicious IPs', 'Preserve forensic evidence', 'Revoke compromised credentials', 'Enable enhanced monitoring'], deadline: 'now + 30min' } },
      { id: 'n9', type: 'Alert', name: 'Standard SOC Alert', position: { x: 1180, y: 420 }, config: { severity: 'medium', channels: ['Slack', 'Email'], assignTo: 'soc-analyst', title: 'Security Event: {{event.type}}', autoAssign: true, slaHours: 4 } },
      { id: 'n10', type: 'Merge', name: 'Collect Response Actions', position: { x: 1740, y: 280 }, config: { strategy: 'wait-any', timeout: '2h' } },
      { id: 'n11', type: 'Save Data', name: 'Log Incident to SIEM', position: { x: 2020, y: 280 }, config: { table: 'security_incidents', operation: 'Insert', fields: ['incident_id', 'threat_type', 'severity', 'affected_systems', 'threat_analysis', 'containment_actions', 'timeline', 'responders'], retentionYears: 7, exportToSIEM: true } },
      { id: 'n12', type: 'PDF Report', name: 'Generate Incident Report', position: { x: 2300, y: 280 }, config: { template: 'security_incident', sections: ['executive_summary', 'technical_details', 'timeline', 'impact', 'containment', 'lessons_learned'], classification: 'CONFIDENTIAL' } },
      { id: 'n13', type: 'Metrics', name: 'Update Security Posture', position: { x: 2580, y: 280 }, config: { metrics: ['mttr', 'incidents_by_type', 'false_positive_rate', 'mean_detection_time'], dashboardId: 'security-operations', realtime: true } },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2' },
      { id: 'e2', fromNodeId: 'n2', toNodeId: 'n3' },
      { id: 'e3', fromNodeId: 'n3', toNodeId: 'n4' },
      { id: 'e4', fromNodeId: 'n4', toNodeId: 'n5', condition: 'true' },
      { id: 'e5', fromNodeId: 'n4', toNodeId: 'n9', condition: 'false' },
      { id: 'e6', fromNodeId: 'n5', toNodeId: 'n6' },
      { id: 'e7', fromNodeId: 'n5', toNodeId: 'n7' },
      { id: 'e8', fromNodeId: 'n5', toNodeId: 'n8' },
      { id: 'e9', fromNodeId: 'n6', toNodeId: 'n10' },
      { id: 'e10', fromNodeId: 'n7', toNodeId: 'n10' },
      { id: 'e11', fromNodeId: 'n8', toNodeId: 'n10' },
      { id: 'e12', fromNodeId: 'n9', toNodeId: 'n10' },
      { id: 'e13', fromNodeId: 'n10', toNodeId: 'n11' },
      { id: 'e14', fromNodeId: 'n11', toNodeId: 'n12' },
      { id: 'e15', fromNodeId: 'n12', toNodeId: 'n13' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  6. EXPENSE REPORT REVIEW (Finance) — 11 nodes
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'expense-report-review',
    name: 'Expense Report Review & Reimbursement',
    description: 'Smart expense processing: OCR receipt scanning → AI anomaly detection → policy validation → multi-tier approval based on amount → ERP sync → reimbursement scheduling.',
    category: 'Finance',
    tags: ['expense', 'finance', 'approval', 'compliance', 'reimbursement'],
    complexity: 'intermediate',
    estimatedTime: '5-8 min',
    icon: '💳',
    triggers: ['expense_submitted', 'concur_event', 'form_submitted'],
    nodes: [
      { id: 'n1', type: 'Manual Trigger', name: 'Expense Report Submitted', position: { x: 60, y: 220 }, config: { formId: 'expense-report-v2', requiredFields: ['receipts', 'amount', 'category', 'business_purpose', 'date'], maxAttachments: 20 } },
      { id: 'n2', type: 'OCR', name: 'Scan All Receipts', position: { x: 340, y: 220 }, config: { language: 'Auto-detect', dpi: 300, extractFields: ['merchant', 'date', 'amount', 'currency', 'category', 'tax_amount'], batchMode: true, preprocessImage: true } },
      { id: 'n3', type: 'Validation', name: 'Policy Compliance Check', position: { x: 620, y: 220 }, config: { rules: ['receipt_required_above_25', 'per_diem_limit', 'alcohol_policy', 'travel_advance_check', 'duplicate_receipt', 'date_within_30days', 'approved_vendors_only'], strictMode: false, flagViolations: true } },
      { id: 'n4', type: 'LLM Reasoning', name: 'AI Anomaly Detection', position: { x: 900, y: 220 }, config: { model: 'llama-3.3-70b', prompt: 'Analyze this expense report for: 1) Policy violations, 2) Unusual spending patterns vs historical baseline, 3) Potential duplicate charges, 4) Red flags (personal expenses, restricted categories), 5) Fraud indicators. Provide risk score 0-10 and specific flags.', temperature: 0.1, maxTokens: 1500, compareToHistory: true } },
      { id: 'n5', type: 'Risk Analysis', name: 'Calculate Risk Score', position: { x: 1180, y: 220 }, config: { factors: ['policy_violations', 'anomaly_flags', 'historical_pattern', 'amount_vs_role', 'category_mix'], threshold: { low: 3, medium: 6, high: 8 } } },
      { id: 'n6', type: 'Switch', name: 'Route by Amount', position: { x: 1460, y: 220 }, config: { field: 'total_amount', cases: ['< 500 → Auto-approve', '500-2000 → Manager', '2000-10000 → Finance Manager', '> 10000 → CFO + Finance'], defaultCase: 'Manager' } },
      { id: 'n7', type: 'Approval', name: 'Manager Approval', position: { x: 1740, y: 100 }, config: { title: 'Expense Approval: {{employee.name}} - ${{amount}}', description: 'Review expense report for business travel and expenses. Risk score: {{risk.score}}/10', assignedTo: '{{employee.manager}}', priority: 'normal', deadline: '48h', allowPartialApproval: true } },
      { id: 'n8', type: 'Approval', name: 'Finance Team Review', position: { x: 1740, y: 280 }, config: { title: 'Finance Review: ${{amount}} Expense', description: 'Mid-tier expense requiring finance team validation. Anomalies: {{flags}}', assignedTo: 'finance-team', priority: 'medium', deadline: '72h', requireComment: true } },
      { id: 'n9', type: 'Save Data', name: 'Record Approved Expense', position: { x: 2020, y: 220 }, config: { table: 'expenses', operation: 'Insert', syncToERP: true, erpSystem: 'SAP', generateJournalEntry: true, costCenter: '{{employee.cost_center}}' } },
      { id: 'n10', type: 'Schedule', name: 'Schedule Reimbursement', position: { x: 2300, y: 220 }, config: { triggerAt: 'next_payroll_run', paymentMethod: '{{employee.preferred_payment}}', amount: '{{approved_amount}}', currency: '{{currency}}', generatePaymentAdvice: true } },
      { id: 'n11', type: 'Notification', name: 'Notify Employee of Status', position: { x: 2580, y: 220 }, config: { channels: ['Email', 'In-App'], title: 'Expense Report {{status}}', message: 'Your expense report of ${{amount}} for {{business_purpose}} has been {{status}}. {{#if rejected}}Reason: {{rejection_reason}}{{/if}} Expected reimbursement: {{reimbursement_date}}', priority: 'Normal' } },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2' },
      { id: 'e2', fromNodeId: 'n2', toNodeId: 'n3' },
      { id: 'e3', fromNodeId: 'n3', toNodeId: 'n4' },
      { id: 'e4', fromNodeId: 'n4', toNodeId: 'n5' },
      { id: 'e5', fromNodeId: 'n5', toNodeId: 'n6' },
      { id: 'e6', fromNodeId: 'n6', toNodeId: 'n7', condition: 'manager' },
      { id: 'e7', fromNodeId: 'n6', toNodeId: 'n8', condition: 'finance' },
      { id: 'e8', fromNodeId: 'n7', toNodeId: 'n9' },
      { id: 'e9', fromNodeId: 'n8', toNodeId: 'n9' },
      { id: 'e10', fromNodeId: 'n9', toNodeId: 'n10' },
      { id: 'e11', fromNodeId: 'n10', toNodeId: 'n11' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  7. PROCUREMENT ORDER FLOW (Operations) — 12 nodes — NEW
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'procurement-order-flow',
    name: 'Procurement & Purchase Order Flow',
    description: 'End-to-end procurement: purchase request → vendor comparison → AI recommendation → budget check → multi-level approval → PO generation → vendor notification → delivery tracking.',
    category: 'Operations',
    tags: ['procurement', 'purchase-order', 'vendor', 'budget', 'approval'],
    complexity: 'advanced',
    estimatedTime: '10-15 min',
    icon: '🛒',
    triggers: ['purchase_request', 'stock_threshold', 'manual'],
    nodes: [
      { id: 'n1', type: 'Manual Trigger', name: 'Purchase Request Submitted', position: { x: 60, y: 220 }, config: { formId: 'purchase-request-v1', requiredFields: ['item_description', 'quantity', 'estimated_cost', 'department', 'justification', 'required_by_date'] } },
      { id: 'n2', type: 'Validation', name: 'Validate Request', position: { x: 340, y: 220 }, config: { rules: ['budget_available', 'department_has_authority', 'vendor_approved_or_new', 'not_duplicate', 'reasonable_quantity'], autoRejectOnFail: false } },
      { id: 'n3', type: 'Read Data', name: 'Fetch Vendor Quotes', position: { x: 620, y: 220 }, config: { table: 'vendor_catalog', query: 'SELECT * FROM vendors WHERE category = {{item.category}} AND status = active', enrichWithHistory: true, maxVendors: 5 } },
      { id: 'n4', type: 'LLM Reasoning', name: 'AI Vendor Recommendation', position: { x: 900, y: 220 }, config: { model: 'llama-3.3-70b', prompt: 'Compare these vendor quotes for {{item_description}}. Evaluate: price competitiveness, historical reliability, delivery time, quality ratings, and payment terms. Recommend the best vendor with reasoning. Consider our preferred vendor list.', temperature: 0.3, maxTokens: 1500 } },
      { id: 'n5', type: 'If/Else', name: 'Budget Available?', position: { x: 1180, y: 220 }, config: { condition: 'department.budget_remaining >= estimated_cost', operator: 'greater than or equal', value: 'estimated_cost', trueLabel: 'Budget OK', falseLabel: 'Budget Override Needed' } },
      { id: 'n6', type: 'Approval', name: 'Manager Approval', position: { x: 1460, y: 120 }, config: { title: 'PO Approval: {{item_description}} - ${{estimated_cost}}', description: 'Recommended vendor: {{recommended_vendor.name}} at ${{recommended_vendor.price}}. AI recommendation: {{ai_reasoning}}', assignedTo: '{{department.manager}}', priority: 'normal', deadline: '48h', includeVendorComparison: true } },
      { id: 'n7', type: 'Approval', name: 'Finance: Budget Override', position: { x: 1460, y: 340 }, config: { title: 'Budget Override Required: ${{estimated_cost}}', description: 'Department budget insufficient. Requesting override from Finance.', assignedTo: 'finance-director', priority: 'high', deadline: '24h', requireComment: true } },
      { id: 'n8', type: 'Purchase Order', name: 'Generate PO', position: { x: 1740, y: 220 }, config: { autoGeneratePONumber: true, includeTerms: true, paymentTerms: 'Net 45', deliveryInstructions: 'standard', signatureRequired: false, format: 'PDF + EDI', sendToERP: true } },
      { id: 'n9', type: 'Save Data', name: 'Record PO in ERP', position: { x: 2020, y: 220 }, config: { table: 'purchase_orders', operation: 'Insert', syncToERP: true, erpSystem: 'SAP', updateBudgetLedger: true, generateCommitmentEntry: true } },
      { id: 'n10', type: 'Notification', name: 'Send PO to Vendor', position: { x: 2300, y: 120 }, config: { channels: ['Email', 'EDI', 'Vendor Portal'], title: 'Purchase Order {{po_number}}', message: 'Please find attached Purchase Order {{po_number}} for {{item_description}}. Required delivery: {{required_by_date}}.', priority: 'Normal', attachPDF: true, requireAcknowledgment: true } },
      { id: 'n11', type: 'SLA Timer', name: 'Track Delivery SLA', position: { x: 2300, y: 340 }, config: { deadline: '{{required_by_date}}', warningDays: 3, escalateTo: 'procurement-manager', checkInterval: 'daily', autoEscalateOnMiss: true } },
      { id: 'n12', type: 'Dashboard Update', name: 'Update Procurement Dashboard', position: { x: 2580, y: 220 }, config: { dashboardId: 'procurement-ops', metrics: ['pending_pos', 'spend_by_dept', 'vendor_performance', 'budget_utilization'], refreshMode: 'increment' } },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2' },
      { id: 'e2', fromNodeId: 'n2', toNodeId: 'n3' },
      { id: 'e3', fromNodeId: 'n3', toNodeId: 'n4' },
      { id: 'e4', fromNodeId: 'n4', toNodeId: 'n5' },
      { id: 'e5', fromNodeId: 'n5', toNodeId: 'n6', condition: 'true' },
      { id: 'e6', fromNodeId: 'n5', toNodeId: 'n7', condition: 'false' },
      { id: 'e7', fromNodeId: 'n6', toNodeId: 'n8' },
      { id: 'e8', fromNodeId: 'n7', toNodeId: 'n8' },
      { id: 'e9', fromNodeId: 'n8', toNodeId: 'n9' },
      { id: 'e10', fromNodeId: 'n9', toNodeId: 'n10' },
      { id: 'e11', fromNodeId: 'n9', toNodeId: 'n11' },
      { id: 'e12', fromNodeId: 'n10', toNodeId: 'n12' },
      { id: 'e13', fromNodeId: 'n11', toNodeId: 'n12' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  //  8. COMPLIANCE AUDIT WORKFLOW (Compliance) — 11 nodes — NEW
  // ─────────────────────────────────────────────────────────────────
  {
    id: 'compliance-audit-workflow',
    name: 'Regulatory Compliance Audit',
    description: 'Automated compliance assessment: data collection → AI gap analysis → risk scoring → remediation task generation → evidence documentation → regulator-ready report generation.',
    category: 'Compliance',
    tags: ['compliance', 'audit', 'gdpr', 'sox', 'risk', 'reporting'],
    complexity: 'advanced',
    estimatedTime: '12-20 min',
    icon: '⚖️',
    triggers: ['audit_scheduled', 'regulation_change', 'manual', 'periodic_review'],
    nodes: [
      { id: 'n1', type: 'Schedule', name: 'Quarterly Audit Trigger', position: { x: 60, y: 220 }, config: { cronExpression: '0 9 1 1,4,7,10 *', timezone: 'UTC', description: 'Quarterly compliance review', skipHolidays: true, alertBeforeDays: 7 } },
      { id: 'n2', type: 'Read Data', name: 'Collect Compliance Data', position: { x: 340, y: 220 }, config: { sources: ['access_logs', 'policy_documents', 'incident_history', 'training_records', 'vendor_assessments', 'data_inventory'], dateRange: 'last_quarter', includeChildren: true } },
      { id: 'n3', type: 'LLM Reasoning', name: 'AI Gap Analysis', position: { x: 620, y: 220 }, config: { model: 'llama-3.3-70b', prompt: 'Perform a comprehensive compliance gap analysis against GDPR, SOX, ISO 27001, and relevant industry regulations. For each control area: 1) Current status (compliant/non-compliant/partial), 2) Evidence available, 3) Gaps identified, 4) Risk level, 5) Remediation priority. Be thorough and specific.', temperature: 0.1, maxTokens: 5000, regulatoryFrameworks: ['GDPR', 'SOX', 'ISO27001', 'PCI-DSS'] } },
      { id: 'n4', type: 'Risk Analysis', name: 'Prioritize Compliance Risks', position: { x: 900, y: 220 }, config: { factors: ['regulatory_exposure', 'financial_penalty_risk', 'operational_impact', 'data_sensitivity', 'likelihood_of_audit'], rankBy: 'composite_risk_score', topN: 20 } },
      { id: 'n5', type: 'Parallel', name: 'Parallel Remediation Planning', position: { x: 1180, y: 220 }, config: { maxConcurrent: 3, waitForAll: true } },
      { id: 'n6', type: 'Task Assignment', name: 'Critical: Immediate Fixes', position: { x: 1460, y: 80 }, config: { title: 'Critical Compliance Gaps — Immediate Action', assignTo: 'compliance-officer', priority: 'Critical', items: '{{critical_gaps}}', deadline: 'now + 7 days', requireEvidence: true, escalateTo: 'cco' } },
      { id: 'n7', type: 'Task Assignment', name: 'Medium: Policy Updates', position: { x: 1460, y: 240 }, config: { title: 'Policy & Process Updates Q{{quarter}}', assignTo: 'department-leads', priority: 'High', items: '{{medium_gaps}}', deadline: 'now + 30 days', generateTemplates: true } },
      { id: 'n8', type: 'Task Assignment', name: 'Low: Documentation Tasks', position: { x: 1460, y: 400 }, config: { title: 'Documentation & Evidence Collection Q{{quarter}}', assignTo: 'compliance-team', priority: 'Normal', items: '{{low_gaps}}', deadline: 'end_of_quarter' } },
      { id: 'n9', type: 'Merge', name: 'Compile Remediation Plan', position: { x: 1740, y: 220 }, config: { strategy: 'wait-all', aggregateResults: true } },
      { id: 'n10', type: 'Save Data', name: 'Save Audit Record', position: { x: 2020, y: 220 }, config: { table: 'compliance_audits', operation: 'Insert', includeEvidence: true, retentionYears: 10, encryptSensitive: true, generateAuditId: true } },
      { id: 'n11', type: 'PDF Report', name: 'Generate Regulator Report', position: { x: 2300, y: 220 }, config: { template: 'compliance_audit_report', sections: ['executive_summary', 'scope', 'methodology', 'findings', 'risk_matrix', 'remediation_plan', 'management_response', 'appendices'], classification: 'CONFIDENTIAL', includeEvidence: true, digitalSignature: true } },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2' },
      { id: 'e2', fromNodeId: 'n2', toNodeId: 'n3' },
      { id: 'e3', fromNodeId: 'n3', toNodeId: 'n4' },
      { id: 'e4', fromNodeId: 'n4', toNodeId: 'n5' },
      { id: 'e5', fromNodeId: 'n5', toNodeId: 'n6' },
      { id: 'e6', fromNodeId: 'n5', toNodeId: 'n7' },
      { id: 'e7', fromNodeId: 'n5', toNodeId: 'n8' },
      { id: 'e8', fromNodeId: 'n6', toNodeId: 'n9' },
      { id: 'e9', fromNodeId: 'n7', toNodeId: 'n9' },
      { id: 'e10', fromNodeId: 'n8', toNodeId: 'n9' },
      { id: 'e11', fromNodeId: 'n9', toNodeId: 'n10' },
      { id: 'e12', fromNodeId: 'n10', toNodeId: 'n11' },
    ],
  },
];

export const getTemplateById = (id: string): WorkflowTemplate | undefined => {
  return workflowTemplates.find(t => t.id === id);
};

export const getTemplatesByCategory = (category: string): WorkflowTemplate[] => {
  return workflowTemplates.filter(t => t.category === category);
};

export const getTemplatesByTag = (tag: string): WorkflowTemplate[] => {
  return workflowTemplates.filter(t => t.tags.includes(tag));
};

export const getTemplatesByComplexity = (complexity: 'beginner' | 'intermediate' | 'advanced'): WorkflowTemplate[] => {
  return workflowTemplates.filter(t => t.complexity === complexity);
};
