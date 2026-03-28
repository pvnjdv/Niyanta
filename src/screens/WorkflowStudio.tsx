import React, { useState } from 'react';
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
  const [workflowName, setWorkflowName] = useState('New Workflow');
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
  const gridSize = 28;
  
  // Execution state (Phase 4)
  const [executionLogs, setExecutionLogs] = useState<Array<{ time: string; level: string; node: string; message: string; data?: any }>>([]);
  const [executionErrors, setExecutionErrors] = useState<Array<{ time: string; node: string; error: string; stack?: string }>>([]);
  const [nodeExecutionState, setNodeExecutionState] = useState<Record<string, 'pending' | 'running' | 'success' | 'error'>>({});
  const [executionStartTime, setExecutionStartTime] = useState<number | null>(null);
  const [executionContext, setExecutionContext] = useState<any>({});

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
    { name: 'TRIGGER', color: '#8B5CF6', icon: '⚡', items: ['Manual Trigger', 'File Upload', 'API Trigger', 'Timer', 'Schedule', 'Webhook'] },
    { name: 'DOCUMENT', color: '#EC4899', icon: '📄', items: ['OCR', 'PDF Reader', 'Document Classifier', 'Field Extractor', 'Validation', 'Header/Footer Cleaner'] },
    { name: 'DATA', color: '#10B981', icon: '💾', items: ['Save Data', 'Read Data', 'Cache', 'Metadata', 'Dataset Loader'] },
    { name: 'AI', color: '#F59E0B', icon: '🧠', items: ['LLM Reasoning', 'Classification', 'Summarization', 'Decision', 'Risk Analysis'] },
    { name: 'LOGIC', color: '#3B82F6', icon: '🔀', items: ['If/Else', 'Switch', 'Loop', 'Parallel', 'Merge', 'Delay', 'Retry'] },
    { name: 'BUSINESS', color: '#EF4444', icon: '💼', items: ['Invoice Processor', 'Approval', 'Notification', 'Task Assignment', 'Purchase Order', 'Payment'] },
    { name: 'MONITORING', color: '#F97316', icon: '📊', items: ['SLA Timer', 'Alert', 'Metrics', 'Bottleneck Detector'] },
    { name: 'OUTPUT', color: '#06B6D4', icon: '📤', items: ['CSV Export', 'Excel Export', 'PDF Report', 'JSON Export', 'Dashboard Update'] },
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
    'Dataset Loader': 'Load datasets for processing',
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
    'Notification': 'Send notifications to users',
    'Task Assignment': 'Assign tasks to team members',
    'Purchase Order': 'Create and manage purchase orders',
    'Payment': 'Process payment transactions',
    'SLA Timer': 'Track SLA compliance and timeouts',
    'Alert': 'Send alerts on specific conditions',
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
    let x = 200 + Math.random() * 300;
    let y = 100 + Math.random() * 200;
    
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

  // Workflow Execution (Phase 4)
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
    addLog('INFO', 'System', `Environment: ${environment}`);
    addLog('INFO', 'System', `${canvasNodes.length} nodes in workflow`);
    
    // Simulate execution (sequential)
    try {
      for (let i = 0; i < canvasNodes.length; i++) {
        const node = canvasNodes[i];
        await executeNode(node);
        
        // Wait between nodes
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      setWorkflowStatus('idle');
      addLog('SUCCESS', 'Workflow', `Execution completed successfully in ${((Date.now() - (executionStartTime || 0)) / 1000).toFixed(2)}s`);
    } catch (error: any) {
      setWorkflowStatus('error');
      addLog('ERROR', 'Workflow', `Execution failed: ${error.message}`);
    }
  };
  
  const executeNode = async (node: any) => {
    setNodeExecutionState(prev => ({ ...prev, [node.id]: 'running' }));
    addLog('INFO', node.name, 'Executing node...');
    
    // Simulate processing time
    const processingTime = 500 + Math.random() * 1500;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Simulate success/failure (95% success rate)
    const success = Math.random() > 0.05;
    
    if (success) {
      setNodeExecutionState(prev => ({ ...prev, [node.id]: 'success' }));
      
      // Generate mock output based on node type
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
      
      addLog('SUCCESS', node.name, `Execution completed in ${(processingTime / 1000).toFixed(2)}s`, output);
      
      // Update context
      setExecutionContext((prev: Record<string, any>) => ({ ...prev, [node.id]: output }));
    } else {
      setNodeExecutionState(prev => ({ ...prev, [node.id]: 'error' }));
      const errorMsg = 'Simulated execution error';
      addLog('ERROR', node.name, errorMsg);
      setExecutionErrors(prev => [...prev, { 
        time: new Date().toLocaleTimeString(), 
        node: node.name, 
        error: errorMsg,
        stack: 'at executeNode (WorkflowStudio.tsx:line 123)'
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

      // Build edges (connections between nodes based on sequential order)
      const edges = canvasNodes.slice(0, -1).map((node, i) => ({
        id: `edge-${node.id}-${canvasNodes[i + 1].id}`,
        fromNodeId: node.id,
        toNodeId: canvasNodes[i + 1].id,
      }));

      const workflowData = {
        id: workflowId,
        name: workflowName,
        description: workflowDescription,
        category: workflowCategory,
        tags: workflowTags,
        triggers: workflowTriggers,
        nodes,
        edges,
        status: isPublished ? 'active' : 'draft',
        metadata: {
          allowAgentInvocation,
          environment,
          createdAt: workflowId ? undefined : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };

      // Call API to save
      const response = await fetch('/api/workflows' + (workflowId ? `/${workflowId}` : ''), {
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
        edges: canvasNodes.slice(0, -1).map((node, i) => ({
          from: node.id,
          to: canvasNodes[i + 1].id
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
      const response = await fetch(`/api/workflows/${id}`);
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
        'Finance': '#10B981',
        'HR': '#EC4899',
        'Operations': '#3B82F6',
        'Security': '#EF4444',
        'Compliance': '#F59E0B',
        'IT': '#8B5CF6',
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
              fontFamily: 'var(--font-mono)',
            }}
          >
            + CREATE NEW WORKFLOW
          </button>
        </div>

        {/* Workflow Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loadingWorkflows ? (
            <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading workflows...</div>
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div style={{ display: 'grid', placeItems: 'center', height: '100%', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 48, opacity: 0.1, marginBottom: 16 }}>◈</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {searchFilter ? 'No workflows found' : 'No workflows yet'}
                </div>
                {!searchFilter && (
                  <button
                    onClick={() => navigate('/workflows/new')}
                    style={{
                      marginTop: 12, height: 36, padding: '0 20px', borderRadius: 4,
                      background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                      color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}
                  >
                    Create Your First Workflow
                  </button>
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
                const categoryColor = getCategoryColor(workflow.category || 'General');
                return (
                  <div
                    key={workflow.id}
                    style={{
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: 20,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = categoryColor;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${categoryColor}30`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={(e) => {
                      // Don't navigate if clicking delete button
                      if (!(e.target as HTMLElement).closest('.delete-btn')) {
                        navigate(`/workflows/${workflow.id}`);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 8,
                        background: categoryColor,
                        display: 'grid', placeItems: 'center',
                        fontSize: 20, flexShrink: 0,
                        boxShadow: `0 4px 12px ${categoryColor}40`,
                      }}>
                        ◈
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {workflow.name}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                          {workflow.category || 'General'}
                        </div>
                      </div>
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(workflow.id, workflow.name);
                        }}
                        style={{
                          width: 28, height: 28, borderRadius: 4,
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--status-danger)';
                          e.currentTarget.style.color = 'var(--status-danger)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                        title="Delete workflow"
                      >
                        🗑
                      </button>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5, minHeight: 36 }}>
                      {workflow.description || 'No description'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                      <div style={{
                        padding: '4px 8px', borderRadius: 4, fontSize: 10,
                        background: workflow.status === 'active' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 165, 0, 0.1)',
                        color: workflow.status === 'active' ? '#00ff88' : '#ffa500',
                        fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 600,
                      }}>
                        {workflow.status || 'draft'}
                      </div>
                      {workflow.allow_agent_invocation === 1 && (
                        <div style={{
                          padding: '4px 8px', borderRadius: 4, fontSize: 10,
                          background: 'rgba(0, 212, 255, 0.1)',
                          color: '#00d4ff',
                          fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                        }}>
                          🤖 AGENT-READY
                        </div>
                      )}
                    </div>

                    <div style={{
                      fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                      paddingTop: 12, borderTop: '1px solid var(--border)',
                    }}>
                      Updated {new Date(workflow.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== WORKFLOW CANVAS EDITOR =====
  // Load workflow data when workflowId changes
  React.useEffect(() => {
    if (workflowId && workflowId !== 'new') {
      loadWorkflow(workflowId);
    } else if (workflowId === 'new') {
      // Reset for new workflow
      setWorkflowName('New Workflow');
      setWorkflowDescription('');
      setWorkflowCategory('General');
      setWorkflowTags([]);
      setWorkflowTriggers([]);
      setCanvasNodes([]);
      setNodeConfigs({});
      setIsPublished(false);
      setSelectedNode(null);
    }
  }, [workflowId]);

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
                    <span style={{ fontSize: 14 }}>{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--text-muted)' }}>{items.length}</span>
                  </button>
                  {expandedCats.has(cat.name) && items.map((n, i) => (
                    <button
                      key={i}
                      onClick={() => addNode(n, cat)}
                      draggable
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
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{cat.icon}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER PANEL - Canvas */}
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--bg-base)',
          backgroundImage: 'radial-gradient(circle, var(--accent-glow) 1px, transparent 1px)',
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) setSelectedNode(null); }}
        >
          {/* Canvas Transform Container */}
          <div style={{
            transform: `scale(${canvasZoom / 100})`,
            transformOrigin: 'top left',
            width: `${10000 / (canvasZoom / 100)}px`,
            height: `${10000 / (canvasZoom / 100)}px`,
          }}>
          {canvasNodes.length === 0 && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 12,
            }}>
              <span style={{ fontSize: 48, opacity: 0.1 }}>◈</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>
                Drag nodes from the palette to build your workflow
              </span>
            </div>
          )}

          {/* Node connections */}
          {canvasNodes.length > 1 && (
            <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {canvasNodes.slice(0, -1).map((n, i) => {
                const next = canvasNodes[i + 1];
                return (
                  <path
                    key={i}
                    d={`M ${n.x + 180} ${n.y + 32} C ${n.x + 240} ${n.y + 32}, ${next.x - 60} ${next.y + 32}, ${next.x} ${next.y + 32}`}
                    stroke="var(--accent-border)" strokeWidth={1.5} fill="none"
                  />
                );
              })}
            </svg>
          )}

          {/* Nodes */}
          {canvasNodes.map(node => {
            const execState = nodeExecutionState[node.id];
            const isExecuting = execState === 'running';
            const hasCompleted = execState === 'success';
            const hasFailed = execState === 'error';
            
            return (
            <div
              key={node.id}
              onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id); }}
              style={{
                position: 'absolute', left: node.x, top: node.y, width: 180, minHeight: 64,
                background: hasFailed ? 'var(--status-danger-bg)' : 'var(--bg-tile)',
                border: selectedNode === node.id ? `2px solid ${node.color}` : 
                        hasFailed ? '2px solid var(--status-danger)' :
                        hasCompleted ? '2px solid var(--status-success)' :
                        isExecuting ? `2px solid ${node.color}` :
                        '1px solid var(--border)',
                boxShadow: selectedNode === node.id ? `0 0 0 3px ${node.color}20` : 
                           isExecuting ? `0 0 0 3px ${node.color}40, 0 0 20px ${node.color}60` : undefined,
                cursor: 'move',
                borderRadius: 4,
                animation: isExecuting ? 'pulse 1.5s ease-in-out infinite' : undefined,
              }}
            >
              <div style={{
                height: 32, borderBottom: '1px solid var(--border)', display: 'flex',
                alignItems: 'center', gap: 6, padding: '0 10px',
                background: isExecuting ? `${node.color}20` : undefined,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: node.color }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{node.category}</span>
                
                {/* Execution Status Indicator */}
                {execState && (
                  <span style={{ marginLeft: 'auto', marginRight: 4, fontSize: 12 }}>
                    {isExecuting && '⟳'}
                    {hasCompleted && '✓'}
                    {hasFailed && '✕'}
                  </span>
                )}
                
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setCanvasNodes(prev => prev.filter(n => n.id !== node.id)); 
                    if (selectedNode === node.id) setSelectedNode(null);
                  }}
                  style={{ marginLeft: execState ? 0 : 'auto', fontSize: 10, color: 'var(--text-muted)', opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer' }}
                >✕</button>
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13 }}>{node.name}</div>
              </div>
              {/* Connection dots */}
              <div style={{
                position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)',
                width: 10, height: 10, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-base)',
              }} />
              <div style={{
                position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)',
                width: 10, height: 10, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-base)',
              }} />
            </div>
          );
          })}

          </div>
          {/* End Canvas Transform Container */}

          {/* Canvas Controls (bottom-right) */}
          <div style={{
            position: 'absolute', bottom: 16, right: 16,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {/* Zoom Controls */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              background: 'var(--bg-tile)', border: '1px solid var(--border)',
              borderRadius: 2, overflow: 'hidden',
            }}>
              <button 
                onClick={() => setCanvasZoom(Math.min(200, canvasZoom + 25))}
                style={{
                  height: 28, width: 36, fontFamily: 'var(--font-mono)', fontSize: 14,
                  background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}
                title="Zoom In (+)"
              >+</button>
              
              <button
                onClick={() => setCanvasZoom(100)}
                style={{
                  height: 32, padding: '0 8px', fontFamily: 'var(--font-mono)', fontSize: 10,
                  background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
                  color: canvasZoom === 100 ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: 600,
                }}
                title="Reset Zoom (100%)"
              >{canvasZoom}%</button>
              
              <button 
                onClick={() => setCanvasZoom(Math.max(50, canvasZoom - 25))}
                style={{
                  height: 28, width: 36, fontFamily: 'var(--font-mono)', fontSize: 14,
                  background: 'transparent', border: 'none',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}
                title="Zoom Out (-)"
              >−</button>
            </div>

            {/* Grid Snapping Toggle */}
            <button 
              onClick={() => setGridSnapping(!gridSnapping)}
              style={{
                height: 32, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 10,
                background: gridSnapping ? 'var(--accent-dim)' : 'var(--bg-tile)',
                border: gridSnapping ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                color: gridSnapping ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer', fontWeight: 600,
              }}
              title="Toggle Grid Snapping (G)"
            >⊞ SNAP</button>

            {/* Auto-Layout */}
            <button style={{
              height: 32, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 10,
              background: 'var(--bg-tile)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
            title="Auto-arrange nodes (A)"
            >⚡ LAYOUT</button>
          </div>

          {/* Keyboard Shortcuts Hint */}
          {canvasNodes.length === 0 && (
            <div style={{
              position: 'absolute', bottom: 16, left: 16,
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: 'var(--text-muted)', opacity: 0.6,
            }}>
              <div>SHORTCUTS: +/- zoom • G grid snap • A auto-layout • Del delete node</div>
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
