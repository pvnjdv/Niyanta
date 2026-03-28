import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TemplateGallery } from '../components/workflow/TemplateGallery';


interface WorkflowStudioProps {
  workflows: Array<{ id?: string; name?: string; status?: string; description?: string; category?: string }>;
  onSaveWorkflow: (nodes: any[], edges: any[]) => Promise<void>;
}

const WorkflowStudio: React.FC<WorkflowStudioProps> = ({ workflows, onSaveWorkflow }) => {
  const navigate = useNavigate();
  const { workflowId } = useParams<{ workflowId?: string }>();
  
  // State management
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [environment, setEnvironment] = useState<'test' | 'staging' | 'production'>('test');
  const [workflowStatus, setWorkflowStatus] = useState<'idle' | 'running' | 'paused' | 'error'>('idle');
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [bottomTab, setBottomTab] = useState<'logs' | 'errors' | 'context' | 'timeline' | 'audit'>('logs');
  const [bottomPanelHeight, setBottomPanelHeight] = useState(250);
  const [logFilter, setLogFilter] = useState('');
  
  // Workflow metadata (Phase 3)
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowCategory, setWorkflowCategory] = useState('General');
  const [workflowTags, setWorkflowTags] = useState<string[]>([]);
  const [workflowTriggers, setWorkflowTriggers] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [allowAgentInvocation, setAllowAgentInvocation] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [linkedAgents, setLinkedAgents] = useState<Array<{agent_id: string; name: string; icon: string; color: string}>>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [allWorkflows, setAllWorkflows] = useState<any[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(true);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  
  // Mock execution data
  const mockLogs = [
    { time: '12:34:56.123', level: 'INFO', node: 'Manual Trigger', message: 'Workflow execution started' },
    { time: '12:34:56.456', level: 'INFO', node: 'Manual Trigger', message: 'Node executed successfully', data: { status: 'ok' } },
    { time: '12:34:57.789', level: 'INFO', node: 'OCR', message: 'Processing document.pdf', data: { pages: 3 } },
    { time: '12:34:59.012', level: 'SUCCESS', node: 'OCR', message: 'Text extraction complete', data: { chars: 1250 } },
  ];
  
  const mockErrors = [
    { time: '12:35:00.123', node: 'Field Extractor', error: 'Missing required field: invoice_number', stack: 'at extractFields (line 45)' },
  ];
  
  // Node management
  const [nodeSearch, setNodeSearch] = useState('');
  const [canvasNodes, setCanvasNodes] = useState<Array<{ id: string; type: string; name: string; x: number; y: number; category: string; color: string; config?: any }>>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [nodeConfigs, setNodeConfigs] = useState<Record<string, any>>({});
  
  // Canvas controls
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [gridSnapping, setGridSnapping] = useState(true);
  const gridSize = 8;
  
  // Execution state (Phase 4)
  const [executionLogs, setExecutionLogs] = useState<Array<{ time: string; level: string; node: string; message: string; data?: any }>>([]);
  const [executionErrors, setExecutionErrors] = useState<Array<{ time: string; node: string; error: string; stack?: string }>>([]);
  const [nodeExecutionState, setNodeExecutionState] = useState<Record<string, 'pending' | 'running' | 'success' | 'error'>>({});
  const [executionStartTime, setExecutionStartTime] = useState<number | null>(null);
  const [executionContext, setExecutionContext] = useState<any>({});

  // ── True n8n-like canvas state ──────────────────────────────────────────────
  // Edge data model: source → output handle, target → input handle
  const [edges, setEdges] = useState<Array<{ id: string; source: string; target: string }>>([]);
  // Canvas pan offset
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  // While dragging a node
  const draggingNode = useRef<{ nodeId: string; startX: number; startY: number; originX: number; originY: number } | null>(null);
  // While panning canvas
  const panningCanvas = useRef<{ startX: number; startY: number; originPanX: number; originPanY: number } | null>(null);
  // RAF throttling refs — prevents per-mousemove React state updates (jitter fix)
  const dragRafRef = useRef<number | null>(null);
  const pendingDragPos = useRef<{ nodeId: string; x: number; y: number } | null>(null);
  const panRafRef = useRef<number | null>(null);
  const pendingPanPos = useRef<{ x: number; y: number } | null>(null);
  // While drawing a connection from an output handle
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null); // nodeId
  const [mouseCanvasPos, setMouseCanvasPos] = useState({ x: 0, y: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Fetch linked agents when workflow is loaded (Phase 8)
  React.useEffect(() => {
    const fetchLinkedAgents = async () => {
      if (!workflowId || workflowId === 'new') {
        setLinkedAgents([]);
        return;
      }
      
      try {
        const res = await fetch(`http://localhost:3001/api/workflow/${workflowId}/agents`);
        if (res.ok) {
          const data = await res.json();
          setLinkedAgents(data.agents || []);
        }
      } catch (err) {
        console.error('Failed to fetch linked agents:', err);
      }
    };
    fetchLinkedAgents();
  }, [workflowId]);

  React.useEffect(() => {
    const fetchWorkflows = async () => {
      if (workflowId) {
        return;
      }
      setLoadingWorkflows(true);
      try {
        const res = await fetch('http://localhost:3001/api/workflow');
        if (res.ok) {
          const data = await res.json();
          setAllWorkflows(data.workflows || []);
        }
      } catch (err) {
        console.error('Failed to fetch workflows:', err);
      } finally {
        setLoadingWorkflows(false);
      }
    };
    fetchWorkflows();
  }, [workflowId]);

  // Mock data
  const mockWorkflows = [
    { id: 'wf-1', name: 'Invoice-to-Payment Automation', status: 'ACTIVE', category: 'Finance' },
    { id: 'wf-2', name: 'Meeting Action Tracker', status: 'ACTIVE', category: 'Productivity' },
    { id: 'wf-3', name: 'Document Classification Flow', status: 'ACTIVE', category: 'Document' },
  ];

  // Node categories with icons
  const nodeCategories = [
    { name: 'TRIGGER', color: '#7C3AED', icon: '▶', items: ['Manual Trigger', 'File Upload', 'API Trigger', 'Timer', 'Schedule', 'Webhook'] },
    { name: 'DOCUMENT', color: '#EC4899', icon: '■', items: ['OCR', 'PDF Reader', 'Document Classifier', 'Field Extractor', 'Validation', 'Header/Footer Cleaner'] },
    { name: 'DATA', color: '#059669', icon: '●', items: ['Save Data', 'Read Data', 'Cache', 'Metadata'] },
    { name: 'AI', color: '#F59E0B', icon: '◆', items: ['LLM Reasoning', 'Classification', 'Summarization', 'Decision', 'Risk Analysis'] },
    { name: 'LOGIC', color: '#3B82F6', icon: '◈', items: ['If/Else', 'Switch', 'Loop', 'Parallel', 'Merge', 'Delay', 'Retry'] },
    { name: 'BUSINESS', color: '#EF4444', icon: '▲', items: ['Invoice Processor', 'Approval', 'Task Assignment', 'Purchase Order', 'Payment'] },
    { name: 'NOTIFICATION', color: '#7C3AED', icon: '◉', items: ['Notification', 'Alert'] },
    { name: 'MONITORING', color: '#F97316', icon: '◐', items: ['SLA Timer', 'Metrics', 'Bottleneck Detector'] },
    { name: 'OUTPUT', color: '#06B6D4', icon: '◧', items: ['CSV Export', 'Excel Export', 'PDF Report', 'JSON Export', 'Dashboard Update'] },
  ];

  // Node descriptions for tooltips
  const nodeDescriptions: Record<string, string> = {
    'Manual Trigger': 'Manually start the workflow execution',
    'File Upload': 'Trigger workflow when a file is uploaded',
    'API Trigger': 'Start workflow via REST API call',
    'Timer': 'Execute workflow at specific time intervals',
    'Schedule': 'Run workflow on a cron schedule',
    'Webhook': 'Trigger via external webhook call',
    'OCR': 'Extract text from images and scanned documents',
    'PDF Reader': 'Parse and extract data from PDF files',
    'Document Classifier': 'Classify documents by type using AI',
    'Field Extractor': 'Extract specific fields from documents',
    'Validation': 'Validate document structure and contents',
    'Header/Footer Cleaner': 'Remove headers and footers from documents',
    'Save Data': 'Store data to the local database',
    'Read Data': 'Retrieve data from the database',
    'Cache': 'Cache intermediate results for performance',
    'Metadata': 'Extract and store document metadata',
    'LLM Reasoning': 'Use LLM for complex reasoning tasks',
    'Classification': 'Classify content into categories',
    'Summarization': 'Generate summaries of long content',
    'Decision': 'Make intelligent decisions based on context',
    'Risk Analysis': 'Analyze and score risk factors',
    'If/Else': 'Conditional branching based on conditions',
    'Switch': 'Multi-way branching based on value',
    'Loop': 'Iterate over arrays or repeat actions',
    'Parallel': 'Execute multiple branches simultaneously',
    'Merge': 'Combine results from parallel branches',
    'Delay': 'Wait for a specified duration',
    'Retry': 'Retry failed operations with backoff',
    'Invoice Processor': 'Process invoices end-to-end',
    'Approval': 'Request approval from designated approvers',
    'Task Assignment': 'Assign tasks to team members',
    'Purchase Order': 'Create and manage purchase orders',
    'Payment': 'Process payment transactions',
    'Notification': 'Send notifications to users',
    'Alert': 'Send alerts on specific conditions',
    'SLA Timer': 'Track SLA compliance and timeouts',
    'Metrics': 'Collect and report workflow metrics',
    'Bottleneck Detector': 'Identify performance bottlenecks',
    'CSV Export': 'Export results to CSV format',
    'Excel Export': 'Generate Excel spreadsheets',
    'PDF Report': 'Create formatted PDF reports',
    'JSON Export': 'Export data as JSON',
    'Dashboard Update': 'Update dashboard visualizations',
  };

  // Track unsaved changes (Phase 3.1)
  React.useEffect(() => {
    // Don't mark as modified during initialization or when loading a workflow
    if (canvasNodes.length === 0 && Object.keys(nodeConfigs).length === 0) {
      return;
    }
    // If we just saved, don't immediately mark as modified
    if (lastSaved && Date.now() - lastSaved.getTime() < 1000) {
      return;
    }
    setHasUnsavedChanges(true);
  }, [canvasNodes, nodeConfigs, workflowName, workflowDescription, workflowCategory, workflowTags, workflowTriggers]);

  // Node Configuration Schemas (Phase 2)
  const nodeSchemas: Record<string, any> = {
    'OCR': {
      fields: [
        { name: 'language', label: 'Language', type: 'select', required: true, options: ['English', 'Spanish', 'French', 'German', 'Auto-detect'], default: 'Auto-detect' },
        { name: 'dpi', label: 'DPI Quality', type: 'number', min: 150, max: 600, default: 300, help: 'Higher DPI = better quality but slower' },
        { name: 'preprocessImage', label: 'Preprocess Image', type: 'toggle', default: true, help: 'Apply image enhancement before OCR' },
        { name: 'outputFormat', label: 'Output Format', type: 'select', options: ['Plain Text', 'Structured JSON', 'Markdown'], default: 'Plain Text' },
      ]
    },
    'LLM Reasoning': {
      fields: [
        { name: 'model', label: 'Model', type: 'select', required: true, options: ['llama-3.3-70b', 'llama-3.1-8b', 'mixtral-8x7b'], default: 'llama-3.3-70b' },
        { name: 'prompt', label: 'System Prompt', type: 'textarea', rows: 4, required: true, placeholder: 'You are a helpful assistant...', help: 'Define the AI behavior and context' },
        { name: 'temperature', label: 'Temperature', type: 'slider', min: 0, max: 2, step: 0.1, default: 0.7, help: '0=deterministic, 2=creative' },
        { name: 'maxTokens', label: 'Max Tokens', type: 'number', min: 100, max: 8000, default: 2000 },
        { name: 'includeContext', label: 'Include Workflow Context', type: 'toggle', default: true },
      ]
    },
    'If/Else': {
      fields: [
        { name: 'condition', label: 'Condition', type: 'text', required: true, placeholder: 'data.status === "approved"', help: 'JavaScript expression to evaluate' },
        { name: 'operator', label: 'Operator', type: 'select', options: ['equals', 'not equals', 'greater than', 'less than', 'contains', 'regex'], default: 'equals' },
        { name: 'value', label: 'Compare Value', type: 'text', placeholder: 'Enter value...' },
        { name: 'caseSensitive', label: 'Case Sensitive', type: 'toggle', default: false },
      ]
    },
    'Notification': {
      fields: [
        { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Notification title' },
        { name: 'message', label: 'Message', type: 'textarea', rows: 3, required: true, placeholder: 'Message content...' },
        { name: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Normal', 'High', 'Critical'], default: 'Normal' },
        { name: 'recipients', label: 'Recipients', type: 'text', placeholder: 'user@example.com, user2@example.com', help: 'Comma-separated list' },
      ]
    },
    'Save Data': {
      fields: [
        { name: 'table', label: 'Table Name', type: 'text', required: true, placeholder: 'table_name' },
        { name: 'operation', label: 'Operation', type: 'select', options: ['Insert', 'Update', 'Upsert'], default: 'Insert' },
        { name: 'dataPath', label: 'Data Path', type: 'text', placeholder: 'context.extractedData', help: 'Path to data in workflow context' },
        { name: 'primaryKey', label: 'Primary Key', type: 'text', placeholder: 'id' },
      ]
    },
    'Invoice Processor': {
      fields: [
        { name: 'extractFields', label: 'Extract Fields', type: 'multiselect', options: ['Invoice Number', 'Date', 'Vendor', 'Amount', 'Tax', 'Line Items'], default: ['Invoice Number', 'Date', 'Amount'] },
        { name: 'validateAmount', label: 'Validate Amount', type: 'toggle', default: true },
        { name: 'minAmount', label: 'Min Amount', type: 'number', min: 0, default: 0, condition: 'validateAmount' },
        { name: 'maxAmount', label: 'Max Amount', type: 'number', min: 0, default: 100000, condition: 'validateAmount' },
        { name: 'requireApproval', label: 'Require Approval Above', type: 'number', min: 0, default: 5000, help: 'Approval threshold amount' },
      ]
    },
    'Schedule': {
      fields: [
        { name: 'cronExpression', label: 'Cron Expression', type: 'text', required: true, placeholder: '0 9 * * 1-5', help: 'Every weekday at 9 AM' },
        { name: 'timezone', label: 'Timezone', type: 'select', options: ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo'], default: 'UTC' },
        { name: 'enabled', label: 'Enabled', type: 'toggle', default: true },
      ]
    },
    'Loop': {
      fields: [
        { name: 'arrayPath', label: 'Array Path', type: 'text', required: true, placeholder: 'context.items', help: 'Path to array in context' },
        { name: 'maxIterations', label: 'Max Iterations', type: 'number', min: 1, max: 1000, default: 100, help: 'Safety limit' },
        { name: 'parallel', label: 'Run in Parallel', type: 'toggle', default: false },
        { name: 'continueOnError', label: 'Continue on Error', type: 'toggle', default: false },
      ]
    },
    'Approval': {
      fields: [
        { name: 'title', label: 'Approval Title', type: 'text', required: true, placeholder: 'Invoice Approval Request', help: 'Short descriptive title' },
        { name: 'description', label: 'Description', type: 'textarea', rows: 3, placeholder: 'Please review and approve this invoice...', help: 'Detailed description for approver' },
        { name: 'assignedTo', label: 'Assigned To', type: 'select', required: true, options: ['admin', 'finance-manager', 'hr-director', 'it-manager', 'ceo'], default: 'admin', help: 'Who needs to approve' },
        { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'], default: 'medium' },
        { name: 'deadline', label: 'Deadline', type: 'text', placeholder: '24h, 3d, 1w', help: 'Relative time: hours(h), days(d), minutes(m)' },
        { name: 'requireComment', label: 'Require Comment', type: 'toggle', default: false, help: 'Force approver to leave a comment' },
        { name: 'escalationPolicy', label: 'Escalation', type: 'select', options: ['none', 'auto-approve', 'escalate-manager', 'mark-expired'], default: 'none', help: 'Action when deadline expires' },
      ]
    },
    'File Upload': {
      fields: [
        { name: 'acceptedFormats', label: 'Accepted Formats', type: 'multiselect', options: ['PDF', 'PNG', 'JPEG', 'DOCX', 'TXT', 'CSV', 'XLSX', 'MP3', 'MP4'], default: ['PDF'] },
        { name: 'maxSizeMB', label: 'Max File Size (MB)', type: 'number', min: 1, max: 1000, default: 10 },
        { name: 'storagePath', label: 'Storage Path', type: 'text', default: '/uploads', help: 'Where to store uploaded files' },
        { name: 'outputPath', label: 'Output Context Path', type: 'text', default: 'context.uploadedFile', help: 'Where to save file info in context' },
      ]
    },
    'Field Extractor': {
      fields: [
        { name: 'fields', label: 'Fields to Extract', type: 'text', required: true, placeholder: 'field1, field2, field3', help: 'Comma-separated field names' },
        { name: 'inputPath', label: 'Input Data Path', type: 'text', default: 'context.ocrOutput', help: 'Source data location' },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.extractedFields', help: 'Where to store extracted data' },
        { name: 'useLLM', label: 'Use LLM for Extraction', type: 'toggle', default: false },
      ]
    },
    'Validation': {
      fields: [
        { name: 'rules', label: 'Validation Rules', type: 'text', required: true, placeholder: 'required, email, min:5', help: 'Comma-separated rules' },
        { name: 'inputPath', label: 'Data to Validate', type: 'text', default: 'context.extractedFields', help: 'Path to data' },
        { name: 'failAction', label: 'On Failure', type: 'select', options: ['Stop Workflow', 'Continue', 'Retry', 'Alert'], default: 'Stop Workflow' },
      ]
    },
    'Risk Analysis': {
      fields: [
        { name: 'factors', label: 'Risk Factors', type: 'text', required: true, placeholder: 'factor1, factor2', help: 'Comma-separated factors' },
        { name: 'inputPath', label: 'Input Data', type: 'text', default: 'context.data', help: 'Data to analyze' },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.riskScore', help: 'Where to store risk score' },
        { name: 'threshold', label: 'Risk Threshold', type: 'number', min: 0, max: 1, step: 0.1, default: 0.7 },
      ]
    },
    'PDF Report': {
      fields: [
        { name: 'template', label: 'Report Template', type: 'select', options: ['default', 'invoice', 'summary', 'detailed'], default: 'default' },
        { name: 'inputPath', label: 'Data Source', type: 'text', default: 'context.data', help: 'Path to report data' },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.reportFile', help: 'Where to save generated PDF' },
        { name: 'includeCharts', label: 'Include Charts', type: 'toggle', default: false },
      ]
    },
    'Purchase Order': {
      fields: [
        { name: 'autoApprove', label: 'Auto Approve', type: 'toggle', default: false },
        { name: 'inputPath', label: 'PO Data Source', type: 'text', default: 'context.invoice', help: 'Source data for PO' },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.purchaseOrder', help: 'Where to store PO' },
        { name: 'notifyVendor', label: 'Notify Vendor', type: 'toggle', default: true },
      ]
    },
    'Task Assignment': {
      fields: [
        { name: 'title', label: 'Task Title', type: 'text', required: true, placeholder: 'Task name' },
        { name: 'assignTo', label: 'Assign To', type: 'text', required: true, placeholder: 'user@example.com' },
        { name: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Normal', 'High', 'Critical'], default: 'Normal' },
        { name: 'dueDate', label: 'Due Date', type: 'text', placeholder: '24h, 3d, 1w' },
        { name: 'inputPath', label: 'Task Data', type: 'text', default: 'context.data', help: 'Data for task context' },
      ]
    },
    'Read Data': {
      fields: [
        { name: 'table', label: 'Table Name', type: 'text', required: true, placeholder: 'table_name' },
        { name: 'query', label: 'Query', type: 'textarea', rows: 2, placeholder: 'SELECT * FROM table WHERE id = ?', help: 'SQL query' },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.queryResult', help: 'Where to store result' },
      ]
    },
    'Webhook': {
      fields: [
        { name: 'method', label: 'HTTP Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'], default: 'POST' },
        { name: 'path', label: 'Webhook Path', type: 'text', required: true, placeholder: '/webhook/trigger', help: 'URL path' },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.webhookData', help: 'Where to store incoming data' },
        { name: 'authentication', label: 'Authentication', type: 'select', options: ['None', 'API Key', 'Bearer Token', 'OAuth'], default: 'API Key' },
      ]
    },
    'Manual Trigger': {
      fields: [
        { name: 'triggerMode', label: 'Trigger Mode', type: 'select', options: ['Button Click', 'API Call', 'Form Submit'], default: 'Button Click' },
        { name: 'requireConfirmation', label: 'Require Confirmation', type: 'toggle', default: false },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.triggerData', help: 'Store trigger info' },
      ]
    },
    'Timer': {
      fields: [
        { name: 'interval', label: 'Interval', type: 'number', min: 1, max: 3600, default: 60, help: 'Time between runs' },
        { name: 'unit', label: 'Unit', type: 'select', options: ['Seconds', 'Minutes', 'Hours'], default: 'Minutes' },
        { name: 'maxRuns', label: 'Max Runs', type: 'number', min: 1, max: 1000, default: 10, help: '0 = unlimited' },
        { name: 'enabled', label: 'Enabled', type: 'toggle', default: true },
      ]
    },
    'API Trigger': {
      fields: [
        { name: 'source', label: 'API Source', type: 'text', required: true, placeholder: 'Workday, Salesforce, etc.' },
        { name: 'eventType', label: 'Event Type', type: 'text', required: true, placeholder: 'employee.hired, deal.closed' },
        { name: 'webhook', label: 'Use Webhook', type: 'toggle', default: true },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.apiEvent', help: 'Where to store event data' },
      ]
    },
    'PDF Reader': {
      fields: [
        { name: 'inputPath', label: 'PDF File Path', type: 'text', default: 'context.uploadedFile', help: 'Path to PDF' },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.pdfContent', help: 'Where to store text' },
        { name: 'extractImages', label: 'Extract Images', type: 'toggle', default: false },
        { name: 'parseStructure', label: 'Parse Structure', type: 'toggle', default: true, help: 'Headings, paragraphs, lists' },
      ]
    },
    'Document Classifier': {
      fields: [
        { name: 'categories', label: 'Categories', type: 'text', required: true, placeholder: 'invoice, contract, receipt', help: 'Comma-separated' },
        { name: 'model', label: 'Model', type: 'select', options: ['bert-classifier', 'llama-classifier', 'custom'], default: 'bert-classifier' },
        { name: 'confidenceThreshold', label: 'Confidence Threshold', type: 'number', min: 0, max: 1, step: 0.05, default: 0.7 },
        { name: 'inputPath', label: 'Input Text', type: 'text', default: 'context.ocrOutput' },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.docType' },
      ]
    },
    'Header/Footer Cleaner': {
      fields: [
        { name: 'inputPath', label: 'Input Text', type: 'text', default: 'context.ocrOutput' },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.cleanedText' },
        { name: 'removePageNumbers', label: 'Remove Page Numbers', type: 'toggle', default: true },
        { name: 'removeHeaders', label: 'Remove Headers', type: 'toggle', default: true },
      ]
    },
    'Cache': {
      fields: [
        { name: 'keyPath', label: 'Cache Key Path', type: 'text', required: true, placeholder: 'context.id', help: 'Unique key' },
        { name: 'ttlSeconds', label: 'TTL (seconds)', type: 'number', min: 60, max: 604800, default: 3600, help: 'Time to live' },
        { name: 'strategy', label: 'Strategy', type: 'select', options: ['Write-Through', 'Write-Back', 'Write-Around'], default: 'Write-Through' },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.cacheKey' },
      ]
    },
    'Metadata': {
      fields: [
        { name: 'extractFields', label: 'Extract Fields', type: 'text', placeholder: 'author, date, version', help: 'Comma-separated' },
        { name: 'inputPath', label: 'Input Data', type: 'text', default: 'context.data' },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.metadata' },
        { name: 'includeSystemFields', label: 'Include System Fields', type: 'toggle', default: true, help: 'created_at, updated_at, etc.' },
      ]
    },
    'Classification': {
      fields: [
        { name: 'categories', label: 'Categories', type: 'text', required: true, placeholder: 'category1, category2', help: 'Comma-separated' },
        { name: 'model', label: 'Model', type: 'select', options: ['bert-classifier', 'llama-classifier'], default: 'bert-classifier' },
        { name: 'inputPath', label: 'Input Data', type: 'text', default: 'context.data' },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.category' },
        { name: 'returnConfidence', label: 'Return Confidence', type: 'toggle', default: false },
      ]
    },
    'Summarization': {
      fields: [
        { name: 'model', label: 'Model', type: 'select', options: ['llama-3.3-70b', 'mixtral-8x7b'], default: 'llama-3.3-70b' },
        { name: 'maxLength', label: 'Max Length (words)', type: 'number', min: 50, max: 500, default: 150 },
        { name: 'style', label: 'Style', type: 'select', options: ['Concise', 'Detailed', 'Bullet Points'], default: 'Concise' },
        { name: 'inputPath', label: 'Text to Summarize', type: 'text', default: 'context.text' },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.summary' },
      ]
    },
    'Decision': {
      fields: [
        { name: 'rules', label: 'Decision Rules', type: 'textarea', rows: 3, required: true, placeholder: 'if X then Y', help: 'Define decision logic' },
        { name: 'model', label: 'AI Model (optional)', type: 'select', options: ['None', 'llama-3.3-70b'], default: 'None' },
        { name: 'inputPath', label: 'Input Data', type: 'text', default: 'context.data' },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.decision' },
      ]
    },
    'Switch': {
      fields: [
        { name: 'field', label: 'Switch Field', type: 'text', required: true, placeholder: 'context.type', help: 'Field to evaluate' },
        { name: 'cases', label: 'Cases', type: 'text', required: true, placeholder: 'value1:nodeId1,value2:nodeId2', help: 'value:targetNode pairs' },
        { name: 'defaultCase', label: 'Default Case', type: 'text', placeholder: 'nodeId', help: 'Fallback node' },
        { name: 'inputPath', label: 'Input Data', type: 'text', default: 'context.data' },
      ]
    },
    'Parallel': {
      fields: [
        { name: 'maxConcurrent', label: 'Max Concurrent', type: 'number', min: 2, max: 10, default: 4, help: 'Parallel branches' },
        { name: 'waitForAll', label: 'Wait For All', type: 'toggle', default: true, help: 'Wait for all branches to finish' },
        { name: 'timeoutMs', label: 'Timeout (ms)', type: 'number', min: 1000, max: 300000, default: 60000 },
      ]
    },
    'Merge': {
      fields: [
        { name: 'strategy', label: 'Merge Strategy', type: 'select', options: ['wait-all', 'wait-any', 'wait-first'], default: 'wait-all' },
        { name: 'timeout', label: 'Timeout', type: 'text', placeholder: '5m, 1h', default: '5m' },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.mergedData' },
      ]
    },
    'Delay': {
      fields: [
        { name: 'duration', label: 'Duration', type: 'number', min: 1, max: 3600, default: 5 },
        { name: 'unit', label: 'Unit', type: 'select', options: ['Seconds', 'Minutes', 'Hours', 'Days'], default: 'Seconds' },
        { name: 'skipWeekends', label: 'Skip Weekends', type: 'toggle', default: false },
      ]
    },
    'Retry': {
      fields: [
        { name: 'maxAttempts', label: 'Max Attempts', type: 'number', min: 1, max: 10, default: 3 },
        { name: 'backoffMs', label: 'Backoff (ms)', type: 'number', min: 100, max: 60000, default: 1000, help: 'Delay between retries' },
        { name: 'conditions', label: 'Retry Conditions', type: 'text', placeholder: 'error, timeout', help: 'When to retry' },
      ]
    },
    'Payment': {
      fields: [
        { name: 'amount', label: 'Amount', type: 'number', min: 0, required: true },
        { name: 'currency', label: 'Currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'JPY'], default: 'USD' },
        { name: 'method', label: 'Payment Method', type: 'select', options: ['ACH', 'Wire', 'Credit Card', 'Check'], default: 'ACH' },
        { name: 'inputPath', label: 'Payment Data', type: 'text', default: 'context.invoice' },
        { name: 'outputPath', label: 'Output Path', type: 'text', default: 'context.paymentResult' },
      ]
    },
    'SLA Timer': {
      fields: [
        { name: 'deadline', label: 'Deadline', type: 'text', required: true, placeholder: '4h, 2d, 1w', help: 'Time limit' },
        { name: 'warningThreshold', label: 'Warning Threshold', type: 'number', min: 0, max: 100, default: 80, help: '% of deadline' },
        { name: 'escalateTo', label: 'Escalate To', type: 'text', placeholder: 'manager@company.com' },
      ]
    },
    'Alert': {
      fields: [
        { name: 'severity', label: 'Severity', type: 'select', options: ['Info', 'Warning', 'Error', 'Critical'], default: 'Warning' },
        { name: 'title', label: 'Alert Title', type: 'text', required: true },
        { name: 'message', label: 'Message', type: 'textarea', rows: 2, required: true },
        { name: 'channels', label: 'Channels', type: 'text', placeholder: 'Email, Slack, PagerDuty', help: 'Comma-separated' },
      ]
    },
    'Metrics': {
      fields: [
        { name: 'metricNames', label: 'Metrics', type: 'text', required: true, placeholder: 'count, avg_time', help: 'Comma-separated' },
        { name: 'aggregation', label: 'Aggregation', type: 'select', options: ['Sum', 'Average', 'Count', 'Min', 'Max'], default: 'Sum' },
        { name: 'dashboardId', label: 'Dashboard ID', type: 'text', placeholder: 'operations' },
        { name: 'inputPath', label: 'Data Source', type: 'text', default: 'context.data' },
      ]
    },
    'Bottleneck Detector': {
      fields: [
        { name: 'thresholds', label: 'Thresholds', type: 'text', required: true, placeholder: 'latency:500ms,queue:100', help: 'Comma-separated' },
        { name: 'alertOn', label: 'Alert On', type: 'select', options: ['Threshold Exceeded', 'Trend Increasing', 'Both'], default: 'Threshold Exceeded' },
      ]
    },
    'CSV Export': {
      fields: [
        { name: 'inputPath', label: 'Data Source', type: 'text', required: true, default: 'context.data' },
        { name: 'outputPath', label: 'Output File Path', type: 'text', default: 'context.csvFile' },
        { name: 'columns', label: 'Columns', type: 'text', placeholder: 'col1, col2, col3', help: 'Comma-separated, leave empty for all' },
        { name: 'includeHeaders', label: 'Include Headers', type: 'toggle', default: true },
      ]
    },
    'Excel Export': {
      fields: [
        { name: 'inputPath', label: 'Data Source', type: 'text', required: true, default: 'context.data' },
        { name: 'outputPath', label: 'Output File Path', type: 'text', default: 'context.excelFile' },
        { name: 'sheetName', label: 'Sheet Name', type: 'text', default: 'Sheet1' },
        { name: 'includeCharts', label: 'Include Charts', type: 'toggle', default: false },
      ]
    },
    'JSON Export': {
      fields: [
        { name: 'inputPath', label: 'Data Source', type: 'text', required: true, default: 'context.data' },
        { name: 'outputPath', label: 'Output File Path', type: 'text', default: 'context.jsonFile' },
        { name: 'pretty', label: 'Pretty Print', type: 'toggle', default: true },
        { name: 'includeMetadata', label: 'Include Metadata', type: 'toggle', default: false },
      ]
    },
    'Dashboard Update': {
      fields: [
        { name: 'dashboardId', label: 'Dashboard ID', type: 'text', required: true, placeholder: 'operations' },
        { name: 'metrics', label: 'Metrics to Update', type: 'text', required: true, placeholder: 'metric1, metric2', help: 'Comma-separated' },
        { name: 'refreshMode', label: 'Refresh Mode', type: 'select', options: ['Immediate', 'Append', 'Replace'], default: 'Immediate' },
        { name: 'inputPath', label: 'Data Source', type: 'text', default: 'context.data' },
      ]
    },
  };

  // Initialize expanded categories
  React.useEffect(() => {
    setExpandedCats(new Set(nodeCategories.map(c => c.name)));
  }, []);

  const toggleCat = (name: string) => {
    setExpandedCats(prev => {
      const n = new Set(prev);
      if (n.has(name)) n.delete(name); else n.add(name);
      return n;
    });
  };

  const addNode = (name: string, cat: typeof nodeCategories[0]) => {
    const id = `node-${Date.now()}`;
    // Place new node near center of visible canvas
    const container = canvasContainerRef.current;
    const viewW = container ? container.clientWidth : 800;
    const viewH = container ? container.clientHeight : 500;
    const scale = canvasZoom / 100;
    // Center of viewport in canvas coordinates
    const cx = (viewW / 2 - canvasPan.x) / scale;
    const cy = (viewH / 2 - canvasPan.y) / scale;
    let x = cx - 120 + (Math.random() - 0.5) * 100;
    let y = cy - 60 + (Math.random() - 0.5) * 80;
    
    // Apply grid snapping if enabled
    if (gridSnapping) {
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }
    
    // Initialize default config from schema
    const schema = nodeSchemas[name];
    const defaultConfig: any = {};
    if (schema?.fields) {
      schema.fields.forEach((field: any) => {
        if (field.default !== undefined) {
          defaultConfig[field.name] = field.default;
        }
      });
    }
    
    setCanvasNodes(prev => [...prev, { id, type: name, name, x, y, category: cat.name, color: cat.color, config: defaultConfig }]);
    setNodeConfigs(prev => ({ ...prev, [id]: defaultConfig }));
    setSelectedNode(id);
  };

  // ── Canvas coordinate helpers ────────────────────────────────────────────────
  const clientToCanvas = useCallback((clientX: number, clientY: number) => {
    const container = canvasContainerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const scale = canvasZoom / 100;
    return {
      x: (clientX - rect.left - canvasPan.x) / scale,
      y: (clientY - rect.top - canvasPan.y) / scale,
    };
  }, [canvasPan, canvasZoom]);

  // ── Node drag handlers ───────────────────────────────────────────────────────
  const onNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (connectingFrom) return; // don't drag while drawing connection
    e.stopPropagation();
    const node = canvasNodes.find(n => n.id === nodeId);
    if (!node) return;
    draggingNode.current = {
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      originX: node.x,
      originY: node.y,
    };
    setSelectedNode(nodeId);
  }, [canvasNodes, connectingFrom]);

  // ── Canvas pan handler (mousedown on background) ─────────────────────────────
  const onCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // clear connection if clicking empty canvas
    if (connectingFrom) { setConnectingFrom(null); return; }
    setSelectedNode(null);
    panningCanvas.current = {
      startX: e.clientX,
      startY: e.clientY,
      originPanX: canvasPan.x,
      originPanY: canvasPan.y,
    };
  }, [canvasPan, connectingFrom]);

  // ── Global mouse move — RAF-throttled for 60fps smooth dragging ─────────────
  const onCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    // Live connection preview (lightweight setState, acceptable frequency)
    if (connectingFrom) {
      setMouseCanvasPos(clientToCanvas(e.clientX, e.clientY));
    }

    if (draggingNode.current) {
      const { nodeId, startX, startY, originX, originY } = draggingNode.current;
      const scale = canvasZoom / 100;
      let newX = originX + (e.clientX - startX) / scale;
      let newY = originY + (e.clientY - startY) / scale;
      if (gridSnapping) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }
      // Accumulate latest position; RAF commits it once per frame
      pendingDragPos.current = { nodeId, x: newX, y: newY };
      if (!dragRafRef.current) {
        dragRafRef.current = requestAnimationFrame(() => {
          if (pendingDragPos.current) {
            const { nodeId: id, x, y } = pendingDragPos.current;
            setCanvasNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
            pendingDragPos.current = null;
          }
          dragRafRef.current = null;
        });
      }
      return;
    }

    if (panningCanvas.current) {
      const { startX, startY, originPanX, originPanY } = panningCanvas.current;
      const newPan = {
        x: originPanX + (e.clientX - startX),
        y: originPanY + (e.clientY - startY),
      };
      // Also RAF-throttled
      pendingPanPos.current = newPan;
      if (!panRafRef.current) {
        panRafRef.current = requestAnimationFrame(() => {
          if (pendingPanPos.current) {
            setCanvasPan(pendingPanPos.current);
            pendingPanPos.current = null;
          }
          panRafRef.current = null;
        });
      }
    }
  }, [canvasZoom, gridSnapping, gridSize, connectingFrom, clientToCanvas]);

  // ── Global mouse up ──────────────────────────────────────────────────────────
  const onCanvasMouseUp = useCallback(() => {
    // Flush any pending RAF update immediately on release
    if (dragRafRef.current) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
      if (pendingDragPos.current) {
        const { nodeId, x, y } = pendingDragPos.current;
        setCanvasNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x, y } : n));
        pendingDragPos.current = null;
      }
    }
    if (panRafRef.current) {
      cancelAnimationFrame(panRafRef.current);
      panRafRef.current = null;
      if (pendingPanPos.current) {
        setCanvasPan(pendingPanPos.current);
        pendingPanPos.current = null;
      }
    }
    draggingNode.current = null;
    panningCanvas.current = null;
  }, []);

  // ── Wheel zoom (centered on mouse) ──────────────────────────────────────────
  const onCanvasWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const container = canvasContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setCanvasZoom(prev => {
      const newZoom = Math.min(200, Math.max(30, Math.round(prev * zoomFactor)));
      const scale = prev / 100;
      const newScale = newZoom / 100;
      // Adjust pan to keep point under mouse fixed
      setCanvasPan(p => ({
        x: mouseX - (mouseX - p.x) * (newScale / scale),
        y: mouseY - (mouseY - p.y) * (newScale / scale),
      }));
      return newZoom;
    });
  }, []);

  // ── Drop handler for dragging nodes from library ──────────────────────────────
  const onCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType');
    const categoryName = e.dataTransfer.getData('categoryName');
    const categoryColor = e.dataTransfer.getData('categoryColor');
    
    if (!nodeType) return;
    
    // Get drop position in canvas coordinates
    const canvasPos = clientToCanvas(e.clientX, e.clientY);
    const id = `node-${Date.now()}`;
    
    let x = canvasPos.x - 120; // Center the node on drop
    let y = canvasPos.y - 60;
    
    // Apply grid snapping if enabled
    if (gridSnapping) {
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }
    
    // Initialize default config from schema
    const schema = nodeSchemas[nodeType];
    const defaultConfig: any = {};
    if (schema?.fields) {
      schema.fields.forEach((field: any) => {
        if (field.default !== undefined) {
          defaultConfig[field.name] = field.default;
        }
      });
    }
    
    setCanvasNodes(prev => [...prev, { 
      id, 
      type: nodeType, 
      name: nodeType, 
      x, 
      y, 
      category: categoryName, 
      color: categoryColor, 
      config: defaultConfig 
    }]);
    setNodeConfigs(prev => ({ ...prev, [id]: defaultConfig }));
    setSelectedNode(id);
  }, [clientToCanvas, gridSnapping, gridSize, nodeSchemas]);

  const onCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // ── Handle connection (output handle mousedown → input handle mouseup) ───────
  const startConnection = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setConnectingFrom(nodeId);
    setMouseCanvasPos(clientToCanvas(e.clientX, e.clientY));
  }, [clientToCanvas]);

  const finishConnection = useCallback((e: React.MouseEvent, targetNodeId: string) => {
    e.stopPropagation();
    if (!connectingFrom || connectingFrom === targetNodeId) {
      setConnectingFrom(null);
      return;
    }
    // Check for duplicate edge
    setEdges(prev => {
      const duplicate = prev.some(ed => ed.source === connectingFrom && ed.target === targetNodeId);
      if (duplicate) return prev;
      return [...prev, { id: `e-${connectingFrom}-${targetNodeId}`, source: connectingFrom, target: targetNodeId }];
    });
    setConnectingFrom(null);
  }, [connectingFrom]);

  // ── Delete edge ──────────────────────────────────────────────────────────────
  const deleteEdge = useCallback((edgeId: string) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
  }, []);

  // ── Topological sort for execution order ─────────────────────────────────────
  const getTopologicalOrder = useCallback((nodes: typeof canvasNodes, eds: typeof edges): string[] => {
    const nodeIds = nodes.map(n => n.id);
    const inDegree: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    nodeIds.forEach(id => { inDegree[id] = 0; adj[id] = []; });
    eds.forEach(e => {
      if (adj[e.source]) adj[e.source].push(e.target);
      if (e.target in inDegree) inDegree[e.target]++;
    });
    const queue = nodeIds.filter(id => inDegree[id] === 0);
    const result: string[] = [];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      result.push(curr);
      (adj[curr] || []).forEach(next => {
        inDegree[next]--;
        if (inDegree[next] === 0) queue.push(next);
      });
    }
    // Add any unreachable nodes at the end
    nodeIds.forEach(id => { if (!result.includes(id)) result.push(id); });
    return result;
  }, []);

  // Update node configuration
  const updateNodeConfig = (nodeId: string, field: string, value: any) => {
    setNodeConfigs(prev => ({
      ...prev,
      [nodeId]: { ...(prev[nodeId] || {}), [field]: value }
    }));
    
    setCanvasNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, config: { ...(node.config || {}), [field]: value } } : node
    ));
  };

  // Validate node configuration
  const validateNodeConfig = (nodeType: string, config: any): { valid: boolean; errors: string[] } => {
    const schema = nodeSchemas[nodeType];
    if (!schema) return { valid: true, errors: [] };
    
    const errors: string[] = [];
    
    schema.fields.forEach((field: any) => {
      if (field.required && !config[field.name]) {
        errors.push(`${field.label} is required`);
      }
      
      if (field.type === 'number' && config[field.name] !== undefined) {
        const val = config[field.name];
        if (field.min !== undefined && val < field.min) {
          errors.push(`${field.label} must be at least ${field.min}`);
        }
        if (field.max !== undefined && val > field.max) {
          errors.push(`${field.label} must be at most ${field.max}`);
        }
      }
    });
    
    return { valid: errors.length === 0, errors };
  };

  // Configuration Presets
  const configPresets: Record<string, Record<string, any>> = {
    'OCR': {
      'High Quality': { language: 'Auto-detect', dpi: 600, preprocessImage: true, outputFormat: 'Structured JSON' },
      'Fast Processing': { language: 'Auto-detect', dpi: 150, preprocessImage: false, outputFormat: 'Plain Text' },
      'Multilingual': { language: 'Auto-detect', dpi: 300, preprocessImage: true, outputFormat: 'Structured JSON' },
    },
    'LLM Reasoning': {
      'Creative Writer': { model: 'llama-3.3-70b', temperature: 1.5, maxTokens: 4000, includeContext: true },
      'Analytical': { model: 'llama-3.3-70b', temperature: 0.2, maxTokens: 2000, includeContext: true },
      'Balanced': { model: 'llama-3.3-70b', temperature: 0.7, maxTokens: 2000, includeContext: true },
    },
    'Invoice Processor': {
      'Standard Invoice': { extractFields: ['Invoice Number', 'Date', 'Vendor', 'Amount'], validateAmount: true, requireApproval: 5000 },
      'Detailed Processing': { extractFields: ['Invoice Number', 'Date', 'Vendor', 'Amount', 'Tax', 'Line Items'], validateAmount: true, requireApproval: 1000 },
    },
  };

  // Apply preset configuration
  const applyPreset = (nodeId: string, nodeType: string, presetName: string) => {
    const preset = configPresets[nodeType]?.[presetName];
    if (!preset) return;
    
    Object.entries(preset).forEach(([field, value]) => {
      updateNodeConfig(nodeId, field, value);
    });
  };

  // Workflow Execution — graph-based (topological sort)
  const executeWorkflow = async () => {
    if (canvasNodes.length === 0) {
      addLog('ERROR', 'Workflow', 'No nodes to execute');
      return;
    }
    
    // Validate all nodes
    const invalidNodes = canvasNodes.filter(node => {
      const validation = validateNodeConfig(node.type, nodeConfigs[node.id] || {});
      return !validation.valid;
    });
    
    if (invalidNodes.length > 0) {
      addLog('ERROR', 'Workflow', `${invalidNodes.length} node(s) have invalid configuration`);
      setWorkflowStatus('error');
      return;
    }
    
    // Reset execution state
    setWorkflowStatus('running');
    setExecutionLogs([]);
    setExecutionErrors([]);
    setNodeExecutionState({});
    setExecutionStartTime(Date.now());
    setExecutionContext({});
    setShowBottomPanel(true);
    setBottomTab('logs');
    
    addLog('INFO', 'Workflow', `Starting execution: ${workflowName}`);
    addLog('INFO', 'System', `Environment: ${environment} | Graph: ${canvasNodes.length} nodes, ${edges.length} edges`);
    
    // Determine execution order via topological sort
    const order = getTopologicalOrder(canvasNodes, edges);
    addLog('INFO', 'System', `Execution order: ${order.map(id => canvasNodes.find(n => n.id === id)?.name || id).join(' → ')}`);
    
    const startTime = Date.now();
    try {
      for (const nodeId of order) {
        const node = canvasNodes.find(n => n.id === nodeId);
        if (!node) continue;
        await executeNode(node);
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      
      setWorkflowStatus('idle');
      addLog('SUCCESS', 'Workflow', `Execution completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    } catch (error: any) {
      setWorkflowStatus('error');
      addLog('ERROR', 'Workflow', `Execution failed: ${error.message}`);
    }
  };
  
  const executeNode = async (node: any) => {
    setNodeExecutionState(prev => ({ ...prev, [node.id]: 'running' }));
    addLog('INFO', node.name, 'Executing node...');
    
    const processingTime = 500 + Math.random() * 1500;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    const success = Math.random() > 0.05;
    
    if (success) {
      setNodeExecutionState(prev => ({ ...prev, [node.id]: 'success' }));
      
      let output: any;
      switch (node.type) {
        case 'OCR':
          output = { extractedText: 'Sample invoice text...', confidence: 0.95 };
          break;
        case 'LLM Reasoning':
          output = { response: 'AI-generated analysis...', tokensUsed: 250 };
          break;
        case 'Invoice Processor':
          output = { invoiceNumber: 'INV-12345', amount: 1250.00, vendor: 'Acme Corp' };
          break;
        default:
          output = { status: 'completed', timestamp: new Date().toISOString() };
      }
      
      addLog('SUCCESS', node.name, `Completed in ${(processingTime / 1000).toFixed(2)}s`, output);
      setExecutionContext((prev: Record<string, any>) => ({ ...prev, [node.id]: output }));
    } else {
      setNodeExecutionState(prev => ({ ...prev, [node.id]: 'error' }));
      const errorMsg = 'Simulated execution error';
      addLog('ERROR', node.name, errorMsg);
      setExecutionErrors(prev => [...prev, { 
        time: new Date().toLocaleTimeString(), 
        node: node.name, 
        error: errorMsg,
        stack: 'at executeNode (WorkflowStudio.tsx)',
      }]);
      throw new Error(errorMsg);
    }
  };
  
  const addLog = (level: string, node: string, message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString() + '.' + String(Date.now() % 1000).padStart(3, '0');
    setExecutionLogs(prev => [...prev, { time: timestamp, level, node, message, data }]);
  };
  
  const stopWorkflow = () => {
    setWorkflowStatus('idle');
    addLog('INFO', 'System', 'Workflow execution stopped by user');
  };

  // Workflow Persistence (Phase 3)
  const saveWorkflow = async () => {
    if (canvasNodes.length === 0) {
      alert('Cannot save empty workflow. Add at least one node.');
      return;
    }

    if (!workflowName.trim()) {
      alert('Please provide a workflow name');
      return;
    }

    setIsSaving(true);

    try {
      // Build workflow definition
      const nodes = canvasNodes.map(node => ({
        instanceId: node.id,
        nodeType: node.type,
        name: node.name,
        config: nodeConfigs[node.id] || {},
        position: { x: node.x, y: node.y },
        retryConfig: {
          maxRetries: 3,
          timeout: 30,
          failurePolicy: 'retry'
        }
      }));

      // Build edges from real graph edge state
      const workflowEdges = edges.map(e => ({
        id: e.id,
        fromNodeId: e.source,
        toNodeId: e.target,
      }));

      const workflowData = {
        id: workflowId,
        name: workflowName,
        description: workflowDescription,
        category: workflowCategory,
        tags: workflowTags,
        triggers: workflowTriggers,
        nodes,
        edges: workflowEdges,
        status: isPublished ? 'active' : 'draft',
        metadata: {
          allowAgentInvocation,
          environment,
          createdAt: workflowId ? undefined : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };

      // Call API to save
      const response = await fetch('http://localhost:3001/api/workflow' + (workflowId ? `/${workflowId}` : ''), {
        method: workflowId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save workflow');
      }

      const result = await response.json();
      
      if (!workflowId && result.id) {
        navigate(`/workflows/${result.id}`);
      }

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      alert(`Workflow saved successfully! ${isPublished ? '(Published)' : '(Draft)'}`);

    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Failed to save workflow: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const exportWorkflow = () => {
    const workflowExport = {
      version: '1.0',
      workflow: {
        name: workflowName,
        description: workflowDescription,
        category: workflowCategory,
        tags: workflowTags,
        triggers: workflowTriggers,
        nodes: canvasNodes.map(node => ({
          id: node.id,
          type: node.type,
          name: node.name,
          position: { x: node.x, y: node.y },
          config: nodeConfigs[node.id] || {}
        })),
        edges: edges.map(e => ({
          from: e.source,
          to: e.target,
        })),
        metadata: {
          allowAgentInvocation,
          exportedAt: new Date().toISOString(),
          exportedBy: 'user'
        }
      }
    };

    const blob = new Blob([JSON.stringify(workflowExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_workflow.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importWorkflow = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = JSON.parse(text);

        if (!imported.workflow || !imported.workflow.nodes) {
          throw new Error('Invalid workflow file format');
        }

        const wf = imported.workflow;

        // Import workflow data
        setWorkflowName(wf.name || 'Imported Workflow');
        setWorkflowDescription(wf.description || '');
        setWorkflowCategory(wf.category || 'General');
        setWorkflowTags(wf.tags || []);
        setWorkflowTriggers(wf.triggers || []);
        setAllowAgentInvocation(wf.metadata?.allowAgentInvocation ?? true);

        // Import nodes
        const importedNodes = wf.nodes.map((n: any) => ({
          id: n.id,
          type: n.type,
          name: n.name,
          x: n.position.x,
          y: n.position.y,
          category: nodeCategories.find(cat => cat.items.includes(n.type))?.name || 'LOGIC',
          color: nodeCategories.find(cat => cat.items.includes(n.type))?.color || '#3B82F6',
          config: n.config
        }));

        setCanvasNodes(importedNodes);

        // Import configs
        const configs: Record<string, any> = {};
        wf.nodes.forEach((n: any) => {
          configs[n.id] = n.config;
        });
        setNodeConfigs(configs);

        // Imported workflow becomes a new draft workflow until saved
        navigate('/workflows/new');
        setIsPublished(false);
        setHasUnsavedChanges(true); // Mark as modified since it's a new import
        setLastSaved(null);

        alert(`Workflow "${wf.name}" imported successfully! ${importedNodes.length} nodes loaded.`);

      } catch (error: any) {
        console.error('Import error:', error);
        alert(`Failed to import workflow: ${error.message}`);
      }
    };
    input.click();
  };

  // Load workflow from selection
  const loadWorkflow = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/workflow/${id}`);
      if (!response.ok) throw new Error('Failed to load workflow');

      const data = await response.json();
      const wf = data.workflow;

      setWorkflowName(wf.name);
      setWorkflowDescription(wf.description || '');
      setWorkflowCategory(wf.category || 'General');
      setWorkflowTags(JSON.parse(wf.tags || '[]'));
      setWorkflowTriggers(JSON.parse(wf.triggers || '[]'));
      setIsPublished(wf.status === 'active');

      // Load nodes
      const nodes = JSON.parse(wf.nodes || '[]');
      const loadedNodes = nodes.map((n: any) => ({
        id: n.instanceId,
        type: n.nodeType,
        name: n.name,
        x: n.position.x,
        y: n.position.y,
        category: nodeCategories.find(cat => cat.items.includes(n.nodeType))?.name || 'LOGIC',
        color: nodeCategories.find(cat => cat.items.includes(n.nodeType))?.color || '#3B82F6',
        config: n.config
      }));

      setCanvasNodes(loadedNodes);

      // Load edges from saved data
      const savedEdges = JSON.parse(wf.edges || '[]');
      const loadedEdges = savedEdges.map((e: any) => ({
        id: e.id || `e-${e.fromNodeId}-${e.toNodeId}`,
        source: e.fromNodeId,
        target: e.toNodeId,
      }));
      setEdges(loadedEdges);

      // Load configs
      const configs: Record<string, any> = {};
      nodes.forEach((n: any) => {
        configs[n.instanceId] = n.config;
      });
      setNodeConfigs(configs);

      // Reset modification tracking
      setHasUnsavedChanges(false);
      setLastSaved(new Date(wf.updated_at || wf.created_at));

    } catch (error: any) {
      console.error('Load error:', error);
      alert(`Failed to load workflow: ${error.message}`);
    }
  };

  // Load workflow from template (Phase 6)
  const handleTemplateSelect = async (workflowId: string, customName?: string) => {
    try {
      // Load the newly created workflow
      await loadWorkflow(workflowId);
      if (customName) {
        setWorkflowName(customName);
      }
    } catch (error: any) {
      console.error('Template load error:', error);
      alert(`Failed to load template workflow: ${error.message}`);
    }
  };

  // Dynamic Form Field Renderer
  const renderFormField = (field: any, nodeId: string, currentValue: any) => {
    const value = currentValue ?? field.default;
    
    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
              {field.label} {field.required && <span style={{ color: 'var(--status-danger)' }}>*</span>}
            </label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => updateNodeConfig(nodeId, field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              style={{ width: '100%', height: 32, padding: '0 10px', fontSize: 12 }}
            />
            {field.help && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{field.help}</div>}
          </div>
        );
      
      case 'textarea':
        return (
          <div key={field.name} style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
              {field.label} {field.required && <span style={{ color: 'var(--status-danger)' }}>*</span>}
            </label>
            <textarea
              value={value || ''}
              onChange={(e) => updateNodeConfig(nodeId, field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows || 3}
              required={field.required}
              style={{ width: '100%', minHeight: field.rows ? field.rows * 24 : 72, resize: 'vertical', padding: '8px 10px', fontSize: 12 }}
            />
            {field.help && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{field.help}</div>}
          </div>
        );
      
      case 'number':
        return (
          <div key={field.name} style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
              {field.label} {field.required && <span style={{ color: 'var(--status-danger)' }}>*</span>}
            </label>
            <input
              type="number"
              value={value ?? ''}
              onChange={(e) => updateNodeConfig(nodeId, field.name, parseFloat(e.target.value))}
              min={field.min}
              max={field.max}
              required={field.required}
              style={{ width: '100%', height: 32, padding: '0 10px', fontSize: 12 }}
            />
            {field.help && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{field.help}</div>}
          </div>
        );
      
      case 'select':
        return (
          <div key={field.name} style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
              {field.label} {field.required && <span style={{ color: 'var(--status-danger)' }}>*</span>}
            </label>
            <select
              value={value || field.default || ''}
              onChange={(e) => updateNodeConfig(nodeId, field.name, e.target.value)}
              required={field.required}
              style={{ width: '100%', height: 32, padding: '0 8px', fontSize: 12 }}
            >
              {field.options?.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {field.help && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{field.help}</div>}
          </div>
        );
      
      case 'toggle':
        return (
          <div key={field.name} style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={value ?? field.default ?? false}
                onChange={(e) => updateNodeConfig(nodeId, field.name, e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                {field.label}
              </span>
            </label>
            {field.help && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 4, marginLeft: 24 }}>{field.help}</div>}
          </div>
        );
      
      case 'slider':
        return (
          <div key={field.name} style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: 4, textTransform: 'uppercase' }}>
              <span>{field.label}</span>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{value ?? field.default}</span>
            </label>
            <input
              type="range"
              value={value ?? field.default}
              onChange={(e) => updateNodeConfig(nodeId, field.name, parseFloat(e.target.value))}
              min={field.min}
              max={field.max}
              step={field.step || 1}
              style={{ width: '100%' }}
            />
            {field.help && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{field.help}</div>}
          </div>
        );
      
      case 'multiselect':
        const selectedValues = value || field.default || [];
        return (
          <div key={field.name} style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
              {field.label} {field.required && <span style={{ color: 'var(--status-danger)' }}>*</span>}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {field.options?.map((opt: string) => {
                const isSelected = selectedValues.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      const newValues = isSelected
                        ? selectedValues.filter((v: string) => v !== opt)
                        : [...selectedValues, opt];
                      updateNodeConfig(nodeId, field.name, newValues);
                    }}
                    style={{
                      padding: '4px 10px', fontSize: 10, fontFamily: 'var(--font-mono)',
                      background: isSelected ? 'var(--accent-dim)' : 'var(--bg-base)',
                      border: isSelected ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                      color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer', borderRadius: 2,
                    }}
                  >{opt}</button>
                );
              })}
            </div>
            {field.help && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{field.help}</div>}
          </div>
        );
      
      default:
        return null;
    }
  };

  const statusColors = {
    idle: 'var(--text-muted)',
    running: 'var(--accent)',
    paused: 'var(--status-warning)',
    error: 'var(--status-danger)',
  };

  const selNode = canvasNodes.find(n => n.id === selectedNode);

  // Load workflow data when workflowId changes
  React.useEffect(() => {
    if (workflowId && workflowId !== 'new') {
      loadWorkflow(workflowId);
    } else if (workflowId === 'new') {
      // Reset for new workflow
      setWorkflowName('');
      setWorkflowDescription('');
      setWorkflowCategory('General');
      setWorkflowTags([]);
      setWorkflowTriggers([]);
      setCanvasNodes([]);
      setEdges([]);
      setNodeConfigs({});
      setIsPublished(false);
      setSelectedNode(null);
    }
  }, [workflowId]);

  // ===== WORKFLOW LIST VIEW =====
  if (!workflowId) {
    const filteredWorkflows = allWorkflows.filter(wf => 
      wf.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (wf.description || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (wf.category || '').toLowerCase().includes(searchFilter.toLowerCase())
    );

    const handleDelete = async (id: string, name: string) => {
      if (!confirm(`Delete workflow "${name}"? This cannot be undone.`)) return;
      
      try {
        const res = await fetch(`http://localhost:3001/api/workflow/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setAllWorkflows(prev => prev.filter(w => w.id !== id));
        }
      } catch (err) {
        console.error('Failed to delete workflow:', err);
      }
    };

    const getCategoryColor = (category: string) => {
      const colors: Record<string, string> = {
        'Finance': '#059669',
        'HR': '#EC4899',
        'Operations': '#3B82F6',
        'Security': '#EF4444',
        'Compliance': '#F59E0B',
        'IT': '#7C3AED',
        'Document Processing': '#06B6D4',
        'General': '#6B7280',
      };
      return colors[category] || '#6B7280';
    };

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
        {/* Top Bar */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12,
          borderBottom: '1px solid var(--border)', background: 'var(--bg-dock)', flexShrink: 0,
        }}>
          <input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search workflows..."
            style={{
              flex: 1, maxWidth: 400, height: 36, padding: '0 14px', fontSize: 13,
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              borderRadius: 4, color: 'var(--text-primary)', outline: 'none',
            }}
          />
          <button
            onClick={() => navigate('/workflows/new')}
            style={{
              height: 36, padding: '0 20px', borderRadius: 4, fontWeight: 600,
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              color: 'var(--accent)', cursor: 'pointer', fontSize: 13,
              fontFamily: 'var(--font-mono)', marginLeft: 'auto',
            }}
          >
            + CREATE
          </button>
          <button
            onClick={() => setShowTemplateGallery(true)}
            style={{
              height: 36, padding: '0 20px', borderRadius: 4, fontWeight: 600,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
              fontFamily: 'var(--font-mono)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            TEMPLATES
          </button>
        </div>

        {/* Workflow Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loadingWorkflows ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading workflows...</div>
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div>
                <div style={{ fontSize: 48, opacity: 0.1, marginBottom: 16 }}>◈</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {searchFilter ? 'No workflows found' : 'No workflows yet'}
                </div>
                {!searchFilter && (
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
                    <button
                      onClick={() => navigate('/workflows/new')}
                      style={{
                        height: 36, padding: '0 20px', borderRadius: 4,
                        background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                        color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      }}
                    >
                      Create Your First Workflow
                    </button>
                    <button
                      onClick={() => setShowTemplateGallery(true)}
                      style={{
                        height: 36, padding: '0 20px', borderRadius: 4,
                        background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.5)',
                        color: '#7C3AED', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      }}
                    >
                      Browse Templates
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16,
            }}>
              {filteredWorkflows.map(workflow => {
                const catColor = getCategoryColor(workflow.category || 'General');
                return (
                  <div
                    key={workflow.id}
                    style={{
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--border)',
                      borderLeft: `3px solid ${catColor}`,
                      borderRadius: 6,
                      padding: '16px 18px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = catColor; }}
                    onMouseLeave={e => { (e.currentTarget.style as any).border = '1px solid var(--border)'; e.currentTarget.style.borderLeft = `3px solid ${catColor}`; }}
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest('.delete-btn')) {
                        navigate(`/workflows/${workflow.id}`);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {workflow.name}
                        </div>
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 600,
                        padding: '2px 5px', borderRadius: 3, letterSpacing: '0.04em',
                        background: workflow.is_default ? 'rgba(124,58,237,0.15)' : 'rgba(5,150,105,0.15)',
                        color: workflow.is_default ? '#7C3AED' : '#059669',
                        border: `1px solid ${workflow.is_default ? 'rgba(124,58,237,0.4)' : 'rgba(5,150,105,0.4)'}`,
                        flexShrink: 0,
                      }}>
                        {workflow.is_default ? 'DEFAULT' : 'CUSTOM'}
                      </span>
                      <button
                        className="delete-btn"
                        onClick={(e) => { e.stopPropagation(); handleDelete(workflow.id, workflow.name); }}
                        style={{
                          width: 24, height: 24, borderRadius: 3,
                          background: 'transparent', border: '1px solid var(--border)',
                          color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--status-danger)'; e.currentTarget.style.color = 'var(--status-danger)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        title="Delete workflow"
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                      {workflow.description || 'No description'}
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                      paddingTop: 10, borderTop: '1px solid var(--border)',
                    }}>
                      <span style={{ textTransform: 'uppercase', color: catColor, fontWeight: 600 }}>{workflow.category || 'General'}</span>
                      <span style={{ opacity: 0.3 }}>·</span>
                      <span style={{ textTransform: 'uppercase' }}>{workflow.status || 'draft'}</span>
                      <span style={{ marginLeft: 'auto' }}>Updated {new Date(workflow.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
        {showTemplateGallery && (
          <TemplateGallery
            onTemplateSelect={(newWorkflowId) => {
              setShowTemplateGallery(false);
              navigate(`/workflows/${newWorkflowId}`);
              setAllWorkflows(prev => prev); // trigger re-fetch on next render
            }}
            onClose={() => setShowTemplateGallery(false)}
          />
        )}
      </div>
    );
  }

  // ===== WORKFLOW CANVAS EDITOR =====
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ===== TOP BAR ===== */}
      <div style={{
        height: 56, borderBottom: '1px solid var(--border)', display: 'flex',
        alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, background: 'var(--bg-dock)',
      }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/workflows')}
          style={{
            height: 36, padding: '0 12px', borderRadius: 4,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ← Back
        </button>

        {/* Workflow Name (Editable) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 500 }}>
          <input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow name..."
            style={{
              height: 32, padding: '0 12px', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
              background: 'transparent', border: '1px solid transparent', flex: 1,
            }}
            onFocus={(e) => { e.target.style.border = '1px solid var(--border)'; e.target.style.background = 'var(--bg-tile)'; }}
            onBlur={(e) => { e.target.style.border = '1px solid transparent'; e.target.style.background = 'transparent'; }}
          />
          {hasUnsavedChanges && (
            <div 
              title="Unsaved changes"
              style={{
                width: 8, height: 8, borderRadius: '50%', 
                background: '#F59E0B', flexShrink: 0
              }}
            />
          )}
          {lastSaved && !hasUnsavedChanges && (
            <span 
              style={{ 
                fontFamily: 'var(--font-mono)', fontSize: 9, 
                color: 'var(--text-muted)', whiteSpace: 'nowrap' 
              }}
              title={lastSaved.toLocaleString()}
            >
              Saved {(() => {
                const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
                if (seconds < 60) return 'just now';
                const minutes = Math.floor(seconds / 60);
                if (minutes < 60) return `${minutes}m ago`;
                const hours = Math.floor(minutes / 60);
                return `${hours}h ago`;
              })()}
            </span>
          )}
        </div>

        {/* Environment Selector */}
        <select
          value={environment}
          onChange={(e) => setEnvironment(e.target.value as any)}
          style={{
            height: 28, padding: '0 8px', fontFamily: 'var(--font-mono)', fontSize: 10,
            background: 'var(--bg-tile)', border: '1px solid var(--border)', textTransform: 'uppercase',
          }}
        >
          <option value="test">Test</option>
          <option value="staging">Staging</option>
          <option value="production">Production</option>
        </select>

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button 
            onClick={() => workflowStatus === 'running' ? stopWorkflow() : executeWorkflow()}
            style={{
              height: 32, padding: '0 16px', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>{workflowStatus === 'running' ? '■' : '▶'}</span>
            <span>{workflowStatus === 'running' ? 'STOP' : 'RUN'}</span>
          </button>

          <button 
            onClick={saveWorkflow}
            disabled={isSaving}
            style={{
              height: 32, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 10,
              background: isSaving ? 'var(--bg-base)' : 'transparent', 
              border: '1px solid var(--border)',
              color: isSaving ? 'var(--text-muted)' : 'var(--text-secondary)', 
              cursor: isSaving ? 'not-allowed' : 'pointer',
            }}
          >{isSaving ? 'SAVING...' : 'SAVE'}</button>

          <button 
            onClick={exportWorkflow}
            disabled={canvasNodes.length === 0}
            style={{
              height: 32, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 10,
              background: 'transparent', border: '1px solid var(--border)',
              color: canvasNodes.length === 0 ? 'var(--text-muted)' : 'var(--text-secondary)', 
              cursor: canvasNodes.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >EXPORT</button>

          <button 
            onClick={importWorkflow}
            style={{
              height: 32, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 10,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >IMPORT</button>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />


        {/* Undo/Redo */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button 
            style={{
              height: 28, width: 28, fontFamily: 'var(--font-mono)', fontSize: 12,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
            title="Undo (Ctrl+Z)"
          >↶</button>

          <button 
            style={{
              height: 28, width: 28, fontFamily: 'var(--font-mono)', fontSize: 12,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
            title="Redo (Ctrl+Shift+Z)"
          >↷</button>
        </div>

        <button style={{
          height: 28, padding: '0 10px', fontFamily: 'var(--font-mono)', fontSize: 10,
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--text-secondary)', cursor: 'pointer',
        }}>HISTORY</button>

        <div style={{ flex: 1 }} />

        {/* Status Indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
          border: '1px solid var(--border)', borderRadius: 2,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: statusColors[workflowStatus],
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: statusColors[workflowStatus], textTransform: 'uppercase' }}>
            {workflowStatus}
          </span>
        </div>

        {/* Node Count */}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          {canvasNodes.length} nodes
        </span>
      </div>

      {/* ===== MAIN CONTENT (3-panel layout) ===== */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* LEFT PANEL - Node Library */}
        <div style={{ width: 260, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'var(--bg-panel)' }}>
          <div style={{ height: 40, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
              NODE LIBRARY
            </span>
          </div>

          <div style={{ borderBottom: '1px solid var(--border)' }}>
            <input
              value={nodeSearch}
              onChange={e => setNodeSearch(e.target.value)}
              placeholder="Search nodes..."
              style={{ 
                width: '100%', height: 40, border: 'none', padding: '0 12px', 
                fontSize: 12, fontFamily: 'var(--font-body)',
                background: 'var(--bg-tile)',
              }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {nodeCategories.map(cat => {
              const items = nodeSearch ? cat.items.filter(n => n.toLowerCase().includes(nodeSearch.toLowerCase())) : cat.items;
              if (nodeSearch && items.length === 0) return null;
              return (
                <div key={cat.name}>
                  <button
                    onClick={() => toggleCat(cat.name)}
                    style={{
                      width: '100%', height: 36, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8,
                      fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)',
                      background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    <span style={{ fontSize: 8 }}>{expandedCats.has(cat.name) ? '▼' : '▶'}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: cat.color }}>{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--text-muted)' }}>{items.length}</span>
                  </button>
                  {expandedCats.has(cat.name) && items.map((n, i) => (
                    <button
                      key={i}
                      onClick={() => addNode(n, cat)}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'copy';
                        e.dataTransfer.setData('nodeType', n);
                        e.dataTransfer.setData('categoryName', cat.name);
                        e.dataTransfer.setData('categoryColor', cat.color);
                      }}
                      title={nodeDescriptions[n] || n}
                      style={{
                        width: '100%', height: 40, padding: '0 12px 0 32px', display: 'flex', alignItems: 'center', gap: 8,
                        fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', textAlign: 'left',
                        cursor: 'grab', background: 'none', border: 'none', borderLeft: '2px solid transparent',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => { 
                        e.currentTarget.style.background = 'var(--bg-tile-hover)'; 
                        e.currentTarget.style.borderLeft = `2px solid ${cat.color}`; 
                      }}
                      onMouseLeave={e => { 
                        e.currentTarget.style.background = 'transparent'; 
                        e.currentTarget.style.borderLeft = '2px solid transparent'; 
                      }}
                    >
                      <span style={{ fontSize: 14, flexShrink: 0, fontWeight: 600 }}>{cat.icon}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Create Node Button */}
          <div style={{ borderTop: '1px solid var(--border)', padding: 12 }}>
            <button
              onClick={() => {
                // Add a node at the center of the canvas
                const firstCategory = nodeCategories[0];
                const firstNode = firstCategory.items[0];
                addNode(firstNode, firstCategory);
              }}
              style={{
                width: '100%', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                background: 'var(--bg-panel)', color: 'var(--accent)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span style={{ fontSize: 16 }}>+</span>
              <span>CREATE NODE</span>
            </button>
          </div>
        </div>

        {/* CENTER PANEL - n8n-like Canvas */}
        <div
          ref={canvasContainerRef}
          style={{
            flex: 1, position: 'relative', overflow: 'hidden',
            background: 'var(--bg-base)',
            cursor: connectingFrom ? 'crosshair' : panningCanvas.current ? 'grabbing' : 'default',
          }}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onWheel={onCanvasWheel}
          onDrop={onCanvasDrop}
          onDragOver={onCanvasDragOver}
        >
          {/* Dot grid — moves with pan/zoom */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, var(--accent-glow) 1px, transparent 1px)',
            backgroundSize: `${gridSize * (canvasZoom / 100)}px ${gridSize * (canvasZoom / 100)}px`,
            backgroundPosition: `${canvasPan.x % (gridSize * canvasZoom / 100)}px ${canvasPan.y % (gridSize * canvasZoom / 100)}px`,
          }} />

          {/* Empty state */}
          {canvasNodes.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column', gap: 12, pointerEvents: 'none',
            }}>
              <span style={{ fontSize: 48, opacity: 0.08 }}>◈</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>
                Click nodes in the library to add them • Drag to move • Scroll to zoom
              </span>
            </div>
          )}

          {/* ── SVG layer for edges ─────────────────────────────────────── */}
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="var(--accent-border)" />
              </marker>
              <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="var(--accent)" />
              </marker>
            </defs>

            {/* Rendered edges */}
            {edges.map(edge => {
              const src = canvasNodes.find(n => n.id === edge.source);
              const tgt = canvasNodes.find(n => n.id === edge.target);
              if (!src || !tgt) return null;
              const scale = canvasZoom / 100;
              const NODE_W = 240;
              const NODE_H = 120;
              // Output handle = right center of source node
              const x1 = canvasPan.x + (src.x + NODE_W) * scale;
              const y1 = canvasPan.y + (src.y + NODE_H / 2) * scale;
              // Input handle = left center of target node
              const x2 = canvasPan.x + tgt.x * scale;
              const y2 = canvasPan.y + (tgt.y + NODE_H / 2) * scale;
              const dx = Math.abs(x2 - x1) * 0.5;
              const isRunning = nodeExecutionState[edge.source] === 'running' || nodeExecutionState[edge.target] === 'running';
              const isSuccess = nodeExecutionState[edge.source] === 'success';
              return (
                <g key={edge.id} style={{ pointerEvents: 'stroke' }}>
                  <path
                    d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                    stroke={isRunning ? 'var(--accent)' : isSuccess ? 'var(--status-success)' : 'var(--accent-border)'}
                    strokeWidth={isRunning ? 2.5 : 1.5}
                    fill="none"
                    markerEnd={isRunning ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                    strokeDasharray={isRunning ? '6 3' : undefined}
                    style={{ animation: isRunning ? 'dashFlow 0.5s linear infinite' : undefined }}
                  />
                  {/* Invisible wider hit area for deleting */}
                  <path
                    d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                    stroke="transparent"
                    strokeWidth={12}
                    fill="none"
                    style={{ pointerEvents: 'stroke' as const, cursor: 'pointer' }}
                    onClick={(e) => { e.stopPropagation(); deleteEdge(edge.id); }}
                  />
                </g>
              );
            })}

            {/* Live connection line while drawing */}
            {connectingFrom && (() => {
              const src = canvasNodes.find(n => n.id === connectingFrom);
              if (!src) return null;
              const scale = canvasZoom / 100;
              const NODE_W = 240;
              const NODE_H = 120;
              const x1 = canvasPan.x + (src.x + NODE_W) * scale;
              const y1 = canvasPan.y + (src.y + NODE_H / 2) * scale;
              const x2 = canvasPan.x + mouseCanvasPos.x * scale;
              const y2 = canvasPan.y + mouseCanvasPos.y * scale;
              const dx = Math.abs(x2 - x1) * 0.5;
              return (
                <path
                  d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                  stroke="var(--accent)"
                  strokeWidth={1.5}
                  fill="none"
                  strokeDasharray="5 4"
                  opacity={0.8}
                />
              );
            })()}
          </svg>

          {/* ── Nodes layer ──────────────────────────────────────────────── */}
          {canvasNodes.map(node => {
            const execState = nodeExecutionState[node.id];
            const isExecuting = execState === 'running';
            const hasCompleted = execState === 'success';
            const hasFailed = execState === 'error';
            const scale = canvasZoom / 100;
            const NODE_W = 240;
            const NODE_H = 120;
            const left = canvasPan.x + node.x * scale;
            const top = canvasPan.y + node.y * scale;

            // Category icon map
            const catIcons: Record<string, string> = {
              TRIGGER: '⚡', DOCUMENT: '📄', DATA: '💾', AI: '🧠',
              LOGIC: '🔀', BUSINESS: '💼', MONITORING: '📊', OUTPUT: '📤',
            };
            const catIcon = catIcons[node.category] || '⚙';

            // Short config summary (first meaningful config value)
            const cfg = nodeConfigs[node.id] || {};
            const cfgEntries = Object.entries(cfg).filter(([, v]) => v !== undefined && v !== '' && v !== null && !Array.isArray(v));
            const cfgSummary = cfgEntries.length > 0
              ? `${cfgEntries[0][0]}: ${String(cfgEntries[0][1]).slice(0, 20)}`
              : nodeDescriptions[node.type]?.slice(0, 38) || '';

            // Edge counts for this node
            const inCount = edges.filter(e => e.target === node.id).length;
            const outCount = edges.filter(e => e.source === node.id).length;

            const borderColor = selectedNode === node.id ? node.color
              : hasFailed ? 'var(--status-danger)'
              : hasCompleted ? 'var(--status-success)'
              : isExecuting ? node.color
              : 'var(--border)';
            const borderW = (selectedNode === node.id || hasFailed || hasCompleted || isExecuting) ? 2 : 1;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => onNodeMouseDown(e, node.id)}
                onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id); }}
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width: NODE_W * scale,
                  height: NODE_H * scale,
                  background: hasFailed ? 'rgba(239,68,68,0.1)' : 'var(--bg-tile)',
                  border: `${borderW * scale}px solid ${borderColor}`,
                  boxShadow: selectedNode === node.id
                    ? `0 0 0 ${3 * scale}px ${node.color}22, 0 4px 20px rgba(0,0,0,0.4)`
                    : isExecuting
                      ? `0 0 0 ${3 * scale}px ${node.color}40, 0 0 ${20 * scale}px ${node.color}50`
                      : `0 2px 8px rgba(0,0,0,0.25)`,
                  borderRadius: 6 * scale,
                  cursor: 'move',
                  userSelect: 'none',
                  animation: isExecuting ? 'pulse 1.5s ease-in-out infinite' : undefined,
                  zIndex: selectedNode === node.id ? 10 : 1,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* ── Colored top accent bar ── */}
                <div style={{
                  height: 3 * scale,
                  background: `linear-gradient(90deg, ${node.color}, ${node.color}88)`,
                  flexShrink: 0,
                }} />

                {/* ── Header row: icon + name + delete ── */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8 * scale,
                  padding: `${7 * scale}px ${10 * scale}px ${4 * scale}px`,
                  background: isExecuting ? `${node.color}12` : hasCompleted ? 'rgba(16,185,129,0.06)' : undefined,
                }}>
                  {/* Category icon circle */}
                  <div style={{
                    width: 28 * scale, height: 28 * scale, borderRadius: 6 * scale,
                    background: `${node.color}22`, border: `${scale}px solid ${node.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13 * scale, flexShrink: 0,
                  }}>
                    {catIcon}
                  </div>
                  {/* Name + category label */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-body)', fontWeight: 600,
                      fontSize: 12 * scale, color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                      lineHeight: 1.3,
                    }}>{node.name}</div>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 8.5 * scale,
                      color: node.color, textTransform: 'uppercase' as const,
                      letterSpacing: '0.04em', opacity: 0.85,
                    }}>{node.type}</div>
                  </div>
                  {/* Exec status badge */}
                  {execState && (
                    <div style={{
                      fontSize: 11 * scale, flexShrink: 0,
                      color: isExecuting ? node.color : hasCompleted ? 'var(--status-success)' : 'var(--status-danger)',
                      animation: isExecuting ? 'spin 1s linear infinite' : undefined,
                    }}>
                      {isExecuting ? '⟳' : hasCompleted ? '✓' : '✕'}
                    </div>
                  )}
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCanvasNodes(prev => prev.filter(n => n.id !== node.id));
                      setEdges(prev => prev.filter(ed => ed.source !== node.id && ed.target !== node.id));
                      if (selectedNode === node.id) setSelectedNode(null);
                    }}
                    style={{
                      fontSize: 10 * scale, color: 'var(--text-muted)', opacity: 0.4,
                      background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                      lineHeight: 1, padding: 0,
                    }}
                  >✕</button>
                </div>

                {/* ── Config summary line ── */}
                <div style={{
                  padding: `0 ${10 * scale}px`,
                  fontFamily: 'var(--font-mono)', fontSize: 8 * scale,
                  color: 'var(--text-muted)', flex: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                }}>
                  {cfgSummary || <span style={{ opacity: 0.4 }}>not configured</span>}
                </div>

                {/* ── Footer: in/out counts ── */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: `${4 * scale}px ${10 * scale}px ${6 * scale}px`,
                  marginTop: 'auto',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4 * scale,
                    fontFamily: 'var(--font-mono)', fontSize: 7.5 * scale, color: 'var(--text-muted)',
                  }}>
                    <span style={{ color: '#64748b' }}>↘</span>
                    <span>{inCount} in</span>
                    <span style={{ margin: `0 ${2 * scale}px`, opacity: 0.3 }}>·</span>
                    <span style={{ color: node.color }}>↗</span>
                    <span>{outCount} out</span>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 7 * scale,
                    padding: `${1.5 * scale}px ${5 * scale}px`,
                    borderRadius: 2 * scale,
                    background: execState
                      ? (isExecuting ? `${node.color}22` : hasCompleted ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)')
                      : 'var(--bg-base)',
                    color: execState
                      ? (isExecuting ? node.color : hasCompleted ? 'var(--status-success)' : 'var(--status-danger)')
                      : 'var(--text-muted)',
                    border: `${scale * 0.5}px solid ${execState ? (isExecuting ? node.color : hasCompleted ? 'var(--status-success)' : 'var(--status-danger)') : 'var(--border)'}`,
                  }}>
                    {execState ? execState.toUpperCase() : 'IDLE'}
                  </div>
                </div>

                {/* ── INPUT HANDLE (left center) ── */}
                <div
                  onMouseDown={e => e.stopPropagation()}
                  onMouseUp={(e) => { e.stopPropagation(); finishConnection(e, node.id); }}
                  style={{
                    position: 'absolute', left: -8 * scale, top: '50%', transform: 'translateY(-50%)',
                    width: 15 * scale, height: 15 * scale, borderRadius: '50%',
                    border: `${2 * scale}px solid ${connectingFrom && connectingFrom !== node.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: connectingFrom && connectingFrom !== node.id ? 'var(--accent)' : 'var(--bg-panel)',
                    cursor: 'crosshair', zIndex: 20,
                    boxShadow: connectingFrom && connectingFrom !== node.id ? `0 0 0 ${3 * scale}px rgba(0,212,255,0.3)` : undefined,
                    transition: 'all 0.15s ease',
                  }}
                />

                {/* ── OUTPUT HANDLE (right center) ── */}
                <div
                  onMouseDown={(e) => { e.stopPropagation(); startConnection(e, node.id); }}
                  style={{
                    position: 'absolute', right: -8 * scale, top: '50%', transform: 'translateY(-50%)',
                    width: 15 * scale, height: 15 * scale, borderRadius: '50%',
                    border: `${2 * scale}px solid ${node.color}`,
                    background: connectingFrom === node.id ? node.color : 'var(--bg-panel)',
                    cursor: 'crosshair', zIndex: 20,
                    boxShadow: connectingFrom === node.id ? `0 0 0 ${3 * scale}px ${node.color}40` : undefined,
                    transition: 'all 0.15s ease',
                  }}
                />
              </div>
            );
          })}

          {/* Hint */}
          {canvasNodes.length > 0 && canvasNodes.length < 3 && edges.length === 0 && (
            <div style={{
              position: 'absolute', bottom: 16, left: 16,
              fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)',
              opacity: 0.7, pointerEvents: 'none',
            }}>
              Drag the ◉ right handle to connect nodes
            </div>
          )}

          {connectingFrom && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              padding: '6px 14px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 10, borderRadius: 2,
              pointerEvents: 'none', zIndex: 200,
            }}>
              Click the ◎ input handle of a target node — or click canvas to cancel
            </div>
          )}
        </div>

        {/* RIGHT PANEL - Node Config */}
        <div style={{ width: 320, borderLeft: '1px solid var(--border)', overflowY: 'auto', background: 'var(--bg-panel)', flexShrink: 0 }}>
          {selNode ? (
            <>
              <div style={{
                height: 48, borderBottom: '1px solid var(--border)', display: 'flex',
                alignItems: 'center', gap: 8, padding: '0 16px',
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: selNode.color }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {selNode.category}
                </span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, flex: 1 }}>{selNode.name}</div>
                  {(() => {
                    const validation = validateNodeConfig(selNode.type, nodeConfigs[selNode.id] || {});
                    return (
                      <div 
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9, padding: '4px 8px',
                          background: validation.valid ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                          color: validation.valid ? 'var(--status-success)' : 'var(--status-danger)',
                          border: `1px solid ${validation.valid ? 'var(--status-success)' : 'var(--status-danger)'}`,
                          borderRadius: 2,
                        }}
                        title={validation.errors.join(', ')}
                      >
                        {validation.valid ? '✓ VALID' : '⚠ ' + validation.errors.length + ' ERROR' + (validation.errors.length > 1 ? 'S' : '')}
                      </div>
                    );
                  })()}
                </div>
                
                {/* Configuration Presets */}
                {configPresets[selNode.type] && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                      LOAD PRESET
                    </label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          applyPreset(selNode.id, selNode.type, e.target.value);
                          e.target.value = ''; // Reset selector
                        }
                      }}
                      style={{ width: '100%', height: 32, padding: '0 8px', fontSize: 12 }}
                    >
                      <option value="">Select a preset...</option>
                      {Object.keys(configPresets[selNode.type]).map(presetName => (
                        <option key={presetName} value={presetName}>{presetName}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    NODE NAME
                  </label>
                  <input defaultValue={selNode.name} style={{ width: '100%', height: 36, padding: '0 10px', fontSize: 13 }} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    DESCRIPTION
                  </label>
                  <textarea rows={3} placeholder="Node description..." style={{ width: '100%', minHeight: 80, resize: 'vertical', padding: '8px 10px', fontSize: 13 }} />
                </div>

                {/* Dynamic Node Configuration */}
                {nodeSchemas[selNode.type] ? (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ 
                      fontFamily: 'var(--font-mono)', fontSize: 9, 
                      textTransform: 'uppercase', color: 'var(--text-secondary)', 
                      marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border)',
                      fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span>⚙</span>
                      <span>NODE CONFIGURATION</span>
                    </div>
                    {nodeSchemas[selNode.type].fields.map((field: any) => 
                      renderFormField(field, selNode.id, nodeConfigs[selNode.id]?.[field.name])
                    )}
                  </div>
                ) : (
                  <div style={{ 
                    padding: 12, background: 'var(--bg-base)', 
                    border: '1px solid var(--border)', borderRadius: 2, marginBottom: 12 
                  }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 6 }}>
                      NO CONFIGURATION NEEDED
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)' }}>
                      This node type doesn't require additional configuration
                    </div>
                  </div>
                )}

                {/* Output Preview */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16, marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
                    OUTPUT PREVIEW
                  </div>
                  <div style={{ 
                    padding: 10, background: 'var(--bg-base)', 
                    border: '1px solid var(--border)', borderRadius: 2,
                    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                  }}>
                    Execute workflow to see output
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16, marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 600 }}>
                    ADVANCED SETTINGS
                  </div>
                  
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>MAX RETRIES</label>
                    <input type="number" defaultValue={3} min={0} max={10} style={{ width: '100%', height: 32, padding: '0 10px' }} />
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>TIMEOUT (seconds)</label>
                    <input type="number" defaultValue={30} style={{ width: '100%', height: 32, padding: '0 10px' }} />
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>FAILURE POLICY</label>
                    <select style={{ width: '100%', height: 32, padding: '0 8px' }}>
                      <option>Retry</option>
                      <option>Escalate</option>
                      <option>Abort</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{
                    flex: 1, height: 40, background: 'var(--accent-dim)',
                    border: '1px solid var(--accent-border)', fontFamily: 'var(--font-mono)',
                    fontSize: 11, textTransform: 'uppercase', color: 'var(--accent)',
                    cursor: 'pointer', fontWeight: 600,
                  }}>▶ TEST</button>
                  <button style={{
                    width: 40, height: 40, background: 'transparent',
                    border: '1px solid var(--border)', fontFamily: 'var(--font-mono)',
                    fontSize: 14, color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }} title="Duplicate Node">⧉</button>
                  <button style={{
                    width: 40, height: 40, background: 'transparent',
                    border: '1px solid var(--status-danger)', fontFamily: 'var(--font-mono)',
                    fontSize: 14, color: 'var(--status-danger)',
                    cursor: 'pointer',
                  }} title="Delete Node">🗑</button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                NO NODE SELECTED
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Click any node on the canvas to edit its properties and configuration
              </div>

              <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 20 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 600 }}>
                  WORKFLOW SETTINGS
                </div>
                
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>CATEGORY</label>
                  <select 
                    value={workflowCategory}
                    onChange={(e) => setWorkflowCategory(e.target.value)}
                    style={{ width: '100%', height: 32, padding: '0 8px', background: 'var(--bg-tile)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <option value="General">General</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="Operations">Operations</option>
                    <option value="Security">Security</option>
                    <option value="Compliance">Compliance</option>
                    <option value="IT">IT</option>
                    <option value="Document Processing">Document Processing</option>
                  </select>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
                  <textarea 
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    rows={3} 
                    placeholder="What does this workflow do?" 
                    style={{ width: '100%', minHeight: 80, resize: 'vertical', padding: '8px 10px', background: 'var(--bg-tile)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 12 }} 
                  />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    TAGS (comma separated)
                  </label>
                  <input 
                    value={workflowTags.join(', ')}
                    onChange={(e) => setWorkflowTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                    placeholder="invoice, approval, finance..." 
                    style={{ width: '100%', height: 32, padding: '0 10px', background: 'var(--bg-tile)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11 }} 
                  />
                  {workflowTags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                      {workflowTags.map(tag => (
                        <span key={tag} style={{ 
                          fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 6px',
                          background: 'var(--bg-accent)', color: 'var(--text-secondary)',
                          borderRadius: 2, border: '1px solid var(--border)'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    TRIGGERS (comma separated)
                  </label>
                  <input 
                    value={workflowTriggers.join(', ')}
                    onChange={(e) => setWorkflowTriggers(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                    placeholder="invoice_uploaded, approval_needed..." 
                    style={{ width: '100%', height: 32, padding: '0 10px', background: 'var(--bg-tile)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11 }} 
                  />
                  {workflowTriggers.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                      {workflowTriggers.map(trigger => (
                        <span key={trigger} style={{ 
                          fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 6px',
                          background: 'var(--bg-accent)', color: 'var(--text-secondary)',
                          borderRadius: 2, border: '1px solid var(--border)'
                        }}>
                          ⚡ {trigger}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
                    <input 
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
                      PUBLISH (status = active)
                    </span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input 
                      type="checkbox"
                      checked={allowAgentInvocation}
                      onChange={(e) => setAllowAgentInvocation(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
                      ALLOW AGENT INVOCATION
                    </span>
                  </label>
                  
                  {isPublished && allowAgentInvocation && (
                    <div style={{ 
                      marginTop: 12, padding: 8, 
                      background: 'rgba(34, 197, 94, 0.1)', 
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: 4,
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      color: 'var(--status-success)'
                    }}>
                      ✓ Available for agent discovery
                    </div>
                  )}
                </div>

                {/* Linked Agents Section */}
                {workflowId && (
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
                    <div style={{ 
                      fontFamily: 'var(--font-mono)', fontSize: 10, 
                      textTransform: 'uppercase', color: 'var(--text-secondary)', 
                      marginBottom: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 
                    }}>
                      <span>🤖</span>
                      <span>LINKED AGENTS</span>
                      {linkedAgents.length > 0 && (
                        <span style={{ 
                          marginLeft: 'auto', fontSize: 9, padding: '2px 6px', 
                          background: 'var(--accent-dim)', color: 'var(--accent)', 
                          borderRadius: 3, border: '1px solid var(--accent-border)' 
                        }}>
                          {linkedAgents.length}
                        </span>
                      )}
                    </div>
                    
                    {linkedAgents.length === 0 ? (
                      <div style={{ 
                        padding: 12, background: 'rgba(255, 165, 0, 0.05)', 
                        border: '1px solid rgba(255, 165, 0, 0.2)',
                        borderRadius: 4, fontSize: 11, color: 'var(--text-muted)',
                        lineHeight: 1.5
                      }}>
                        No agents linked yet. Create agents in Agent Studio and link them to this workflow.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {linkedAgents.map(agent => (
                          <div
                            key={agent.agent_id}
                            style={{
                              padding: '10px 12px',
                              background: 'var(--bg-tile)',
                              border: '1px solid var(--border)',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = agent.color;
                              e.currentTarget.style.background = 'var(--bg-tile-hover)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = 'var(--border)';
                              e.currentTarget.style.background = 'var(--bg-tile)';
                            }}
                            onClick={() => window.open(`/agents/${agent.agent_id}`, '_blank')}
                            title="Click to open agent chat"
                          >
                            <div style={{
                              width: 32, height: 32, borderRadius: 6,
                              background: agent.color,
                              display: 'grid', placeItems: 'center',
                              color: '#fff', fontSize: 14, fontWeight: 700,
                              flexShrink: 0,
                            }}>
                              {agent.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                fontWeight: 500, fontSize: 12, 
                                color: 'var(--text-primary)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                              }}>
                                {agent.name}
                              </div>
                              <div style={{ 
                                fontSize: 9, color: 'var(--text-muted)', 
                                fontFamily: 'var(--font-mono)' 
                              }}>
                                CAN EXECUTE
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>→</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div style={{ 
                      marginTop: 10, padding: 8, 
                      background: 'rgba(0, 212, 255, 0.05)',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                      borderRadius: 4,
                      fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5,
                      fontFamily: 'var(--font-body)'
                    }}>
                      💡 Agents can execute this workflow when it's published and "Allow Agent Invocation" is enabled.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== BOTTOM BAR ===== */}
      <div style={{
        height: 48, borderTop: '1px solid var(--border)', display: 'flex',
        alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, background: 'var(--bg-dock)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          {canvasNodes.length} nodes · {edges.length} connections
        </span>

        <div style={{ flex: 1 }} />

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => {
              const next = Math.max(30, canvasZoom - 15);
              const container = canvasContainerRef.current;
              if (container) {
                const cx = container.clientWidth / 2;
                const cy = container.clientHeight / 2;
                const scale = canvasZoom / 100;
                const newScale = next / 100;
                setCanvasPan(p => ({
                  x: cx - (cx - p.x) * (newScale / scale),
                  y: cy - (cy - p.y) * (newScale / scale),
                }));
              }
              setCanvasZoom(next);
            }}
            style={{
              height: 32, width: 32, fontFamily: 'var(--font-mono)', fontSize: 16,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 2,
            }}
            title="Zoom Out"
          >−</button>

          <button
            onClick={() => { setCanvasZoom(100); setCanvasPan({ x: 0, y: 0 }); }}
            style={{
              height: 32, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 11,
              background: 'transparent', border: '1px solid var(--border)',
              color: canvasZoom === 100 ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: 600, borderRadius: 2,
            }}
            title="Reset Zoom (100%)"
          >{canvasZoom}%</button>

          <button
            onClick={() => {
              const next = Math.min(200, canvasZoom + 15);
              const container = canvasContainerRef.current;
              if (container) {
                const cx = container.clientWidth / 2;
                const cy = container.clientHeight / 2;
                const scale = canvasZoom / 100;
                const newScale = next / 100;
                setCanvasPan(p => ({
                  x: cx - (cx - p.x) * (newScale / scale),
                  y: cy - (cy - p.y) * (newScale / scale),
                }));
              }
              setCanvasZoom(next);
            }}
            style={{
              height: 32, width: 32, fontFamily: 'var(--font-mono)', fontSize: 16,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 2,
            }}
            title="Zoom In"
          >+</button>
        </div>
      </div>

      {/* ===== BOTTOM PANEL ===== */}
      {showBottomPanel && (
        <div style={{ 
          height: bottomPanelHeight, borderTop: '1px solid var(--border)', 
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          background: 'var(--bg-panel)', position: 'relative',
        }}>
          {/* Resize Handle */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              const startY = e.clientY;
              const startHeight = bottomPanelHeight;
              const onMouseMove = (e: MouseEvent) => {
                const delta = startY - e.clientY;
                setBottomPanelHeight(Math.max(150, Math.min(600, startHeight + delta)));
              };
              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
              };
              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }}
            style={{
              height: 4, width: '100%', cursor: 'ns-resize',
              background: 'transparent', position: 'absolute', top: -2, zIndex: 10,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          />
          
          {/* Tab Bar */}
          <div style={{ 
            height: 36, borderBottom: '1px solid var(--border)', 
            display: 'flex', alignItems: 'center', padding: '0 12px', gap: 4,
          }}>
            {(['logs', 'errors', 'context', 'timeline', 'audit'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setBottomTab(tab)}
                style={{
                  height: 28, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 10,
                  textTransform: 'uppercase', background: 'transparent', border: 'none',
                  color: bottomTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: bottomTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                {tab}
                {tab === 'errors' && executionErrors.length > 0 && (
                  <span style={{ 
                    marginLeft: 6, fontSize: 9, padding: '2px 5px', 
                    background: 'var(--status-danger)', color: 'white', borderRadius: 2 
                  }}>{executionErrors.length}</span>
                )}
              </button>
            ))}
            
            <div style={{ flex: 1 }} />
            
            {bottomTab === 'logs' && (
              <input
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                placeholder="Filter logs..."
                style={{
                  height: 24, padding: '0 8px', fontSize: 10, width: 150,
                  background: 'var(--bg-base)', border: '1px solid var(--border)',
                }}
              />
            )}
            
            <button
              onClick={() => setShowBottomPanel(false)}
              style={{
                height: 24, width: 24, fontFamily: 'var(--font-mono)', fontSize: 12,
                background: 'transparent', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer',
              }}
              title="Close panel (Ctrl+`)"
            >✕</button>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {bottomTab === 'logs' && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                {executionLogs.filter(log => 
                  !logFilter || log.message.toLowerCase().includes(logFilter.toLowerCase()) || 
                  log.node.toLowerCase().includes(logFilter.toLowerCase())
                ).map((log, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start',
                      padding: '6px 8px', borderLeft: `2px solid ${
                        log.level === 'SUCCESS' ? 'var(--status-success)' : 
                        log.level === 'ERROR' ? 'var(--status-danger)' : 
                        'var(--accent-border)'
                      }`,
                      background: i % 2 === 0 ? 'var(--bg-base)' : 'transparent',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', minWidth: 90 }}>{log.time}</span>
                    <span style={{ 
                      color: log.level === 'SUCCESS' ? 'var(--status-success)' : 
                             log.level === 'ERROR' ? 'var(--status-danger)' : 
                             'var(--accent)', 
                      minWidth: 60, fontWeight: 600 
                    }}>{log.level}</span>
                    <span style={{ color: 'var(--text-secondary)', minWidth: 120 }}>{log.node}</span>
                    <span style={{ color: 'var(--text-primary)', flex: 1 }}>{log.message}</span>
                    {log.data && (
                      <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                        {JSON.stringify(log.data)}
                      </span>
                    )}
                  </div>
                ))}
                {executionLogs.length === 0 && (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                    No execution logs yet. Click RUN to execute the workflow.
                  </div>
                )}
              </div>
            )}
            
            {bottomTab === 'errors' && (
              <div>
                {executionErrors.length > 0 ? executionErrors.map((err, i) => (
                  <div 
                    key={i}
                    style={{ 
                      marginBottom: 12, padding: 12, 
                      background: 'var(--status-danger-bg)', 
                      border: '1px solid var(--status-danger)',
                      borderRadius: 2,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{err.time}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--status-danger)', fontWeight: 600 }}>{err.node}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--status-danger)', marginBottom: 6 }}>
                      {err.error}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                      {err.stack}
                    </div>
                  </div>
                )) : (
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>
                    ✓ No errors
                  </div>
                )}
              </div>
            )}

            {bottomTab === 'context' && (
              <div>
                <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
                  <button style={{
                    height: 28, padding: '0 10px', fontFamily: 'var(--font-mono)', fontSize: 9,
                    background: 'var(--bg-tile)', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', cursor: 'pointer',
                  }}>📋 COPY</button>
                  <button style={{
                    height: 28, padding: '0 10px', fontFamily: 'var(--font-mono)', fontSize: 9,
                    background: 'var(--bg-tile)', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', cursor: 'pointer',
                  }}>💾 EXPORT</button>
                </div>
                <div style={{ 
                  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)',
                  background: 'var(--bg-base)', padding: 12, borderRadius: 2,
                  border: '1px solid var(--border)',
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify({
                    workflow: { id: 'wf-001', name: workflowName, status: workflowStatus },
                    nodes: canvasNodes.map(n => ({ id: n.id, type: n.type, name: n.name })),
                    context: { environment, zoom: canvasZoom, gridSnapping },
                    execution: { started: null, duration: null, status: 'idle' }
                  }, null, 2)}</pre>
                </div>
              </div>
            )}

            {bottomTab === 'timeline' && (
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Execution timeline (Gantt chart - Phase 4)
                </div>
                {canvasNodes.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {canvasNodes.map((node, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, minWidth: 120, color: 'var(--text-secondary)' }}>{node.name}</span>
                        <div style={{ flex: 1, height: 20, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 2, position: 'relative' }}>
                          <div style={{ 
                            position: 'absolute', left: 0, top: 0, bottom: 0, 
                            width: '0%', background: node.color, opacity: 0.3,
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, minWidth: 60, color: 'var(--text-muted)' }}>0ms</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {bottomTab === 'audit' && (
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <div style={{ marginBottom: 12, padding: 10, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 2 }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>2026-03-28 12:30:00</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>USER</span>
                    </div>
                    <div>Workflow created: {workflowName}</div>
                  </div>
                  <div style={{ marginBottom: 12, padding: 10, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 2 }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>2026-03-28 12:31:15</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>SYSTEM</span>
                    </div>
                    <div>{canvasNodes.length} nodes added to workflow</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show Bottom Panel button when hidden */}
      {!showBottomPanel && (
        <button
          onClick={() => setShowBottomPanel(true)}
          style={{
            position: 'fixed', bottom: 16, right: 16,
            height: 36, padding: '0 16px', fontFamily: 'var(--font-mono)', fontSize: 10,
            background: 'var(--bg-tile)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer', textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >SHOW LOGS</button>
      )}
    </div>
  );
};

export default WorkflowStudio;
