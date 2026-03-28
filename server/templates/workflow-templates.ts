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
      { id: 'n1', type: 'File Upload', name: 'Receive Invoice File', position: { x: 60, y: 220 }, config: { acceptedFormats: ['PDF', 'PNG', 'JPEG'], maxSizeMB: 20, storagePath: '/uploads/invoices', outputPath: 'context.uploadedFile' } },
      { id: 'n2', type: 'OCR', name: 'Extract Invoice Text', position: { x: 340, y: 220 }, config: { language: 'Auto-detect', dpi: 300, preprocessImage: true, outputFormat: 'Structured JSON' } },
      { id: 'n3', type: 'Field Extractor', name: 'Parse Invoice Fields', position: { x: 620, y: 220 }, config: { fields: 'Invoice Number, Vendor Name, Invoice Date, Due Date, Line Items, Subtotal, Tax, Total Amount, Bank Details', inputPath: 'context.ocrOutput', outputPath: 'context.extractedFields', useLLM: false } },
      { id: 'n4', type: 'Validation', name: 'Validate Invoice Data', position: { x: 900, y: 220 }, config: { rules: 'required:Invoice Number,required:Total Amount,required:Vendor Name,positive:Total Amount,date:Invoice Date', inputPath: 'context.extractedFields', failAction: 'Stop Workflow' } },
      { id: 'n5', type: 'Invoice Processor', name: 'Process & Classify Invoice', position: { x: 1180, y: 220 }, config: { extractFields: ['Invoice Number', 'Date', 'Vendor', 'Amount', 'Tax', 'PO Number'], validateAmount: true, requireApproval: 5000, minAmount: 0, maxAmount: 100000 } },
      { id: 'n6', type: 'Risk Analysis', name: 'Fraud Risk Check', position: { x: 1460, y: 220 }, config: { factors: 'vendor_history, amount_anomaly, duplicate_invoice, blacklist', inputPath: 'context.extractedFields', outputPath: 'context.riskScore', threshold: 0.7 } },
      { id: 'n7', type: 'If/Else', name: 'Amount > $5,000?', position: { x: 1740, y: 220 }, config: { condition: 'context.extractedFields.Total_Amount > 5000', operator: 'greater than', value: '5000', caseSensitive: false } },
      { id: 'n8', type: 'Approval', name: 'CFO Approval Required', position: { x: 2020, y: 100 }, config: { title: 'High-Value Invoice Approval', description: 'Invoice exceeds $5,000 threshold. CFO sign-off required.', assignedTo: 'finance-manager', priority: 'high', deadline: '24h', requireComment: true, escalationPolicy: 'escalate-manager' } },
      { id: 'n9', type: 'Purchase Order', name: 'Auto-Approve & Schedule', position: { x: 2020, y: 340 }, config: { autoApprove: true, inputPath: 'context.extractedFields', outputPath: 'context.purchaseOrder', notifyVendor: true } },
      { id: 'n10', type: 'Save Data', name: 'Record in Ledger', position: { x: 2300, y: 220 }, config: { table: 'invoices', operation: 'Insert', dataPath: 'context.extractedFields', primaryKey: 'id' } },
      { id: 'n11', type: 'PDF Report', name: 'Generate Payment Advice', position: { x: 2580, y: 220 }, config: { template: 'invoice', inputPath: 'context.extractedFields', outputPath: 'context.reportFile', includeCharts: false } },
      { id: 'n12', type: 'Notification', name: 'Notify Submitter & Vendor', position: { x: 2860, y: 220 }, config: { title: 'Invoice Processed', message: 'Your invoice {{Invoice Number}} for ${{Total Amount}} has been processed and approved.', priority: 'Normal', recipients: 'finance@company.com, vendor@supplier.com' } },
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
      { id: 'n1', type: 'File Upload', name: 'Upload Transcript / Recording', position: { x: 60, y: 220 }, config: { acceptedFormats: ['TXT', 'DOCX', 'VTT', 'MP3', 'MP4'], maxSizeMB: 500, storagePath: '/uploads/meetings', outputPath: 'context.recordingFile' } },
      { id: 'n2', type: 'Header/Footer Cleaner', name: 'Clean Transcript Text', position: { x: 340, y: 220 }, config: { inputPath: 'context.recordingFile', outputPath: 'context.cleanedTranscript', removePageNumbers: true, removeHeaders: true } },
      { id: 'n3', type: 'LLM Reasoning', name: 'AI: Extract Meeting Intel', position: { x: 620, y: 220 }, config: { model: 'llama-3.3-70b', prompt: 'As an enterprise meeting analyst, extract: 1) Action items (owner, deadline, priority), 2) Decisions made (decision, rationale, stakeholders), 3) Risks identified, 4) Key discussion topics, 5) Attendance summary, 6) Sentiment score (0-10). Return structured JSON.', temperature: 0.2, maxTokens: 4000, inputPath: 'context.cleanedTranscript', outputPath: 'context.meetingIntel' } },
      { id: 'n4', type: 'Classification', name: 'Classify Meeting Type', position: { x: 900, y: 220 }, config: { categories: 'strategy, standup, retrospective, client-call, incident, planning, review', model: 'bert-classifier', confidenceThreshold: 0.75, inputPath: 'context.meetingIntel', outputPath: 'context.meetingType', returnConfidence: false } },
      { id: 'n5', type: 'Risk Analysis', name: 'Flag Escalation Risks', position: { x: 1180, y: 220 }, config: { factors: 'unresolved_blockers, missed_deadlines, escalation_language, negative_sentiment', inputPath: 'context.meetingIntel', outputPath: 'context.riskFlags', threshold: 0.6 } },
      { id: 'n6', type: 'Save Data', name: 'Save Meeting Record', position: { x: 1460, y: 220 }, config: { table: 'meetings', operation: 'Insert', dataPath: 'context.meetingIntel', primaryKey: 'id' } },
      { id: 'n7', type: 'Loop', name: 'Process Each Action Item', position: { x: 1740, y: 220 }, config: { arrayPath: 'context.meetingIntel.actionItems', maxIterations: 100, parallel: false } },
      { id: 'n8', type: 'Task Assignment', name: 'Create Task in System', position: { x: 2020, y: 220 }, config: { title: '{{item.title}}', description: '{{item.description}}', assignTo: '{{item.owner}}', priority: 'medium', dueDate: '{{item.deadline}}', inputPath: 'loop.item', outputPath: 'context.createdTask' } },
      { id: 'n9', type: 'Notification', name: 'Notify Assignees', position: { x: 2300, y: 220 }, config: { title: 'New Action Item from {{meeting.title}}', message: 'You have been assigned: {{item.title}}', priority: 'Normal', recipients: '{{item.owner}}@company.com' } },
      { id: 'n10', type: 'PDF Report', name: 'Generate Meeting Summary PDF', position: { x: 2580, y: 220 }, config: { template: 'meeting-summary', inputPath: 'context.meetingIntel', outputPath: 'context.summaryPDF', includeCharts: false } },
      { id: 'n11', type: 'Dashboard Update', name: 'Update Meeting Dashboard', position: { x: 2860, y: 220 }, config: { dashboardId: 'meetings-overview', metrics: 'total_actions, open_actions, decisions_count, sentiment_score', refreshMode: 'Append', inputPath: 'context.meetingIntel' } },
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
      { id: 'n1', type: 'Webhook', name: 'Document Intake Webhook', position: { x: 60, y: 220 }, config: { method: 'POST', path: '/intake/document', outputPath: 'context.webhookData', authentication: 'API Key' } },
      { id: 'n2', type: 'OCR', name: 'Extract Raw Text', position: { x: 340, y: 220 }, config: { language: 'Auto-detect', dpi: 300, preprocessImage: true, outputFormat:'Plain Text' } },
      { id: 'n3', type: 'Header/Footer Cleaner', name: 'Clean & Normalize Text', position: { x: 620, y: 220 }, config: { inputPath: 'context.ocrOutput', outputPath: 'context.cleanedText', removePageNumbers: true, removeHeaders: true } },
      { id: 'n4', type: 'Document Classifier', name: 'AI Document Classification', position: { x: 900, y: 220 }, config: { categories: 'invoice, purchase_order, contract, nda, receipt, payslip, bank_statement, tax_form, legal_notice, correspondence', model: 'bert-classifier', confidenceThreshold: 0.7, inputPath: 'context.cleanedText', outputPath: 'context.docType' } },
      { id: 'n5', type: 'Field Extractor', name: 'Extract Metadata', position: { x: 1180, y: 220 }, config: { fields: 'Document Number, Date, Sender, Recipient, Amount, Reference', inputPath: 'context.cleanedText', outputPath: 'context.extractedFields', useLLM: true } },
      { id: 'n6', type: 'Validation', name: 'Validate Data Quality', position: { x: 1460, y: 220 }, config: { rules: 'required:Document Number,required:Date,date:Date', inputPath: 'context.extractedFields', failAction: 'Stop Workflow' } },
      { id: 'n7', type: 'Switch', name: 'Route by Type', position: { x: 1740, y: 220 }, config: { field: 'context.docType', cases: 'invoice:n8,contract:n8,receipt:n9,payslip:n9', defaultCase: 'n9', inputPath: 'context.docType' } },
      { id: 'n8', type: 'Task Assignment', name: 'Assign to Department', position: { x: 2020, y: 100 }, config: { title: 'Review {{context.docType}}', description: 'Review document', assignTo: 'document-team', priority: 'medium', dueDate: '+2d', inputPath: 'context.extractedFields', outputPath: 'context.task' } },
      { id: 'n9', type: 'Cache', name: 'Cache Document', position: { x: 2020, y: 340 }, config: { keyPath: 'context.extractedFields.Document_Number', ttlSeconds: 86400, strategy: 'Write-Through', outputPath: 'context.cached' } },
      { id: 'n10', type: 'Save Data', name: 'Archive Document', position: { x: 2300, y: 220 }, config: { table: 'documents', operation: 'Insert', dataPath: 'context.extractedFields', primaryKey: 'id' } },
      { id: 'n11', type: 'Metrics', name: 'Track Metrics', position: { x: 2580, y: 220 }, config: { metricNames: 'documents_processed, classification_confidence', aggregation: 'Sum', dashboardId: 'doc-ops', inputPath: 'context.extractedFields' } },
      { id: 'n12', type: 'Notification', name: 'Confirm Document Received', position: { x: 2860, y: 220 }, config: { title: 'Document Received', message: 'Your {{context.docType}} has been received', priority: 'Low', recipients: 'uploader@company.com' } },
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
      { id: 'n1', type: 'API Trigger', name: 'HRIS New-Hire Event', position: { x: 60, y: 280 }, config: { source: 'Workday', eventType: 'employee.hired', webhook: true, outputPath: 'context.employeeData' } },
      { id: 'n2', type: 'Validation', name: 'Validate Employee Record', position: { x: 340, y: 280 }, config: { rules: 'required:email,required:manager,required:department,required:start_date', inputPath: 'context.employeeData', failAction: 'Stop Workflow' } },
      { id: 'n3', type: 'Save Data', name: 'Create Employee Record', position: { x: 620, y: 280 }, config: { table: 'employees', operation: 'Insert', dataPath: 'context.employeeData', primaryKey: 'id' } },
      { id: 'n4', type: 'Parallel', name: 'Launch Parallel Tracks', position: { x: 900, y: 280 }, config: { maxConcurrent: 4, waitForAll: true, timeoutMs: 259200000 } },
      { id: 'n5', type: 'Task Assignment', name: 'IT: Provision Accounts', position: { x: 1180, y: 80 }, config: { title: 'Provision IT accounts for {{employee.name}}', description: 'Create AD account, setup email, assign laptop', assignTo: 'it-provisioning', priority: 'High', dueDate: '3d', inputPath: 'context.employeeData', outputPath: 'context.itTask' } },
      { id: 'n6', type: 'Task Assignment', name: 'HR: Process Paperwork', position: { x: 1180, y: 220 }, config: { title: 'Complete onboarding docs for {{employee.name}}', description: 'I-9, benefits enrollment, policy acknowledgment', assignTo: 'hr-coordinator', priority: 'High', dueDate: '5d', inputPath: 'context.employeeData', outputPath: 'context.hrTask' } },
      { id: 'n7', type: 'Task Assignment', name: 'Facilities: Setup Workspace', position: { x: 1180, y: 360 }, config: { title: 'Prepare workspace for {{employee.name}}', description: 'Assign desk, order supplies, configure phone', assignTo: 'facilities-manager', priority: 'Normal', dueDate: '2d', inputPath: 'context.employeeData', outputPath: 'context.facilitiesTask' } },
      { id: 'n8', type: 'Task Assignment', name: 'Manager: Prep Onboarding Plan', position: { x: 1180, y: 500 }, config: { title: '30-60-90 day plan for {{employee.name}}', description: 'Create plan, intro meetings, KPI document', assignTo: '{{employee.manager}}', priority: 'High', dueDate: '1w', inputPath: 'context.employeeData', outputPath: 'context.managerTask' } },
      { id: 'n9', type: 'Merge', name: 'Wait for All Tracks', position: { x: 1460, y: 280 }, config: { strategy: 'wait-all', timeout: '72h', outputPath: 'context.completedTasks' } },
      { id: 'n10', type: 'LLM Reasoning', name: 'AI: Generate Welcome Package', position: { x: 1740, y: 280 }, config: { model: 'llama-3.3-70b', prompt: 'Generate a personalized welcome email for {{employee.name}} joining as {{employee.role}}. Include team intro, key contacts, first-week agenda.', temperature: 0.7, maxTokens: 2000, inputPath: 'context.employeeData', outputPath: 'context.welcomeMessage' } },
      { id: 'n11', type: 'Notification', name: 'Welcome Email to New Hire', position: { x: 2020, y: 180 }, config: { title: 'Welcome to the team, {{employee.first_name}}!', message: '{{context.welcomeMessage}}', priority: 'High', recipients: '{{employee.email}}' } },
      { id: 'n12', type: 'Notification', name: 'Announce to Team', position: { x: 2020, y: 380 }, config: { title: 'New team member: {{employee.name}}', message: 'Please welcome {{employee.name}} who joins as {{employee.role}}!', priority: 'Low', recipients: 'team@company.com' } },
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
      { id: 'n1', type: 'API Trigger', name: 'SIEM Alert Ingestion', position: { x: 60, y: 280 }, config: { source: 'Splunk', eventType: 'security.alert', webhook: true, outputPath: 'context.alert' } },
      { id: 'n2', type: 'LLM Reasoning', name: 'AI Threat Analysis', position: { x: 340, y: 280 }, config: { model: 'llama-3.3-70b', prompt: 'Analyze this security event. Provide: threat classification, MITRE ATT&CK mapping, affected systems, indicators of compromise, recommended containment actions, severity score 0-10.', temperature: 0.1, maxTokens: 2000, inputPath: 'context.alert', outputPath: 'context.threatAnalysis' } },
      { id: 'n3', type: 'Risk Analysis', name: 'Score & Prioritize Threat', position: { x: 620, y: 280 }, config: { factors: 'cvss_score, affected_systems, data_sensitivity, active_exploitation, business_impact', inputPath: 'context.threatAnalysis', outputPath: 'context.riskScore', threshold: 0.8 } },
      { id: 'n4', type: 'If/Else', name: 'Critical Incident?', position: { x: 900, y: 280 }, config: { condition: 'context.riskScore >= 8', operator: 'greater than', value: '8', caseSensitive: false } },
      { id: 'n5', type: 'Parallel', name: 'Launch Response Tracks', position: { x: 1180, y: 160 }, config: { maxConcurrent: 3, waitForAll: false, timeoutMs: 7200000 } },
      { id: 'n6', type: 'Notification', name: 'Page Security Team NOW', position: { x: 1460, y: 60 }, config: { title: 'CRITICAL SECURITY INCIDENT', message: 'Immediate response required. Threat: {{threatAnalysis.type}}. Severity: {{riskScore}}/10', priority: 'Critical', recipients: 'security-team@company.com' } },
      { id: 'n7', type: 'Approval', name: 'CISO: Authorize Containment', position: { x: 1460, y: 200 }, config: { title: 'Authorize System Isolation', description: 'Authorize immediate isolation of affected systems', assignedTo: 'ciso', priority: 'high', deadline: '15m', requireComment: true } },
      { id: 'n8', type: 'Task Assignment', name: 'IR Team: Contain Threat', position: { x: 1460, y: 340 }, config: { title: 'Execute containment plan', description: 'Isolate hosts, block IPs, preserve evidence', assignTo: 'ir-team-lead', priority: 'Critical', dueDate: '30m', inputPath: 'context.threatAnalysis', outputPath: 'context.containmentTask' } },
      { id: 'n9', type: 'Alert', name: 'Standard SOC Alert', position: { x: 1180, y: 420 }, config: { severity: 'Warning', title: 'Security Event', message: 'Review security alert', channels: 'Slack, Email' } },
      { id: 'n10', type: 'Merge', name: 'Collect Response Actions', position: { x: 1740, y: 280 }, config: { strategy: 'wait-any', timeout: '2h', outputPath: 'context.responseActions' } },
      { id: 'n11', type: 'Save Data', name: 'Log Incident to SIEM', position: { x: 2020, y: 280 }, config: { table: 'security_incidents', operation: 'Insert', dataPath: 'context.responseActions', primaryKey: 'id' } },
      { id: 'n12', type: 'PDF Report', name: 'Generate Incident Report', position: { x: 2300, y: 280 }, config: { template: 'security-incident', inputPath: 'context.responseActions', outputPath: 'context.reportPDF', includeCharts: false } },
      { id: 'n13', type: 'Metrics', name: 'Update Security Posture', position: { x: 2580, y: 280 }, config: { metricNames: 'mttr, incidents_by_type, false_positive_rate', aggregation: 'Average', dashboardId: 'security-operations', inputPath: 'context.responseActions' } },
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
      { id: 'n1', type: 'Manual Trigger', name: 'Expense Report Submitted', position: { x: 60, y: 220 }, config: { triggerMode: 'Form Submit', requireConfirmation: false, outputPath: 'context.expenseData' } },
      { id: 'n2', type: 'OCR', name: 'Scan All Receipts', position: { x: 340, y: 220 }, config: { language: 'Auto-detect', dpi: 300, preprocessImage: true, outputFormat: 'Structured JSON' } },
      { id: 'n3', type: 'Validation', name: 'Policy Compliance Check', position: { x: 620, y: 220 }, config: { rules: 'required:receipts,required:amount,required:category,number:amount', inputPath: 'context.ocrOutput', failAction: 'Stop Workflow' } },
      { id: 'n4', type: 'LLM Reasoning', name: 'AI Anomaly Detection', position: { x: 900, y: 220 }, config: { model: 'llama-3.3-70b', prompt: 'Analyze this expense report for policy violations, unusual spending patterns, duplicate charges, red flags. Provide risk score 0-10.', temperature: 0.1, maxTokens: 1500, inputPath: 'context.ocrOutput', outputPath: 'context.anomalyAnalysis' } },
      { id: 'n5', type: 'Risk Analysis', name: 'Calculate Risk Score', position: { x: 1180, y: 220 }, config: { factors: 'policy_violations, anomaly_flags, historical_pattern, amount_vs_role', inputPath: 'context.anomalyAnalysis', outputPath: 'context.riskScore', threshold: 0.6 } },
      { id: 'n6', type: 'Switch', name: 'Route by Amount', position: { x: 1460, y: 220 }, config: { field: 'context.expenseData.amount', cases: '500:n7,2000:n8', defaultCase: 'n7', inputPath: 'context.expenseData' } },
      { id: 'n7', type: 'Approval', name: 'Manager Approval', position: { x: 1740, y: 100 }, config: { title: 'Expense Approval: {{employee.name}} - ${{amount}}', description: 'Review expense report. Risk score: {{riskScore}}/10', assignedTo: 'finance-manager', priority: 'medium', deadline: '48h', requireComment: false } },
      { id: 'n8', type: 'Approval', name: 'Finance Team Review', position: { x: 1740, y: 280 }, config: { title: 'Finance Review: ${{amount}} Expense', description: 'High value expense requiring finance validation', assignedTo: 'finance-team', priority: 'high', deadline: '72h', requireComment: true } },
      { id: 'n9', type: 'Save Data', name: 'Record Approved Expense', position: { x: 2020, y: 220 }, config: { table: 'expenses', operation: 'Insert', dataPath: 'context.expenseData', primaryKey: 'id' } },
      { id: 'n10', type: 'Schedule', name: 'Schedule Reimbursement', position: { x: 2300, y: 220 }, config: { cronExpression: '0 9 * * 1', timezone: 'UTC', enabled: true } },
      { id: 'n11', type: 'Notification', name: 'Notify Employee of Status', position: { x: 2580, y: 220 }, config: { title: 'Expense Report {{status}}', message: 'Your expense report has been {{status}}', priority: 'Normal', recipients: '{{employee.email}}' } },
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
