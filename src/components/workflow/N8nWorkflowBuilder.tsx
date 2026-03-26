import React, { useState, useRef, useEffect } from 'react';
import { NODE_CATEGORIES, NODE_GROUPS } from '../../constants/nodes';
import './N8nWorkflowBuilder.css';

interface Node {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  data?: Record<string, unknown>;
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

interface N8nWorkflowBuilderProps {
  workflowName?: string;
  onSave?: (nodes: Array<{ instanceId: string; nodeType: string; name: string; config: Record<string, unknown>; position: { x: number; y: number } }>, edges: Array<{ id: string; fromNodeId: string; toNodeId: string; condition?: string }>) => Promise<void>;
  onExecute?: (nodes: Array<{ instanceId: string; nodeType: string; name: string; config: Record<string, unknown>; position: { x: number; y: number } }>, edges: Array<{ id: string; fromNodeId: string; toNodeId: string; condition?: string }>) => Promise<void>;
  onBack?: () => void;
}

export const N8nWorkflowBuilder: React.FC<N8nWorkflowBuilderProps> = ({
  workflowName = 'My Workflow',
  onSave,
  onExecute,
  onBack,
}) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{ from: string } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  // Scroll handler for canvas
  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  };

  // Get node by ID
  const getNode = (id: string) => nodes.find((n) => n.id === id);

  // Get connected nodes
  const getOutgoing = (nodeId: string) => edges.filter((e) => e.source === nodeId).map((e) => e.target);
  const getIncoming = (nodeId: string) => edges.filter((e) => e.target === nodeId).map((e) => e.source);

  // Add node to canvas
  const addNode = (e: React.DragEvent) => {
    if (!draggedNodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - canvasOffset.x;
    const y = e.clientY - rect.top - canvasOffset.y;

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: draggedNodeType,
      name: draggedNodeType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      position: { x, y },
      config: {},
    };

    setNodes([...nodes, newNode]);
    setDraggedNodeType(null);
  };

  // Handle drag start from palette
  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    setDraggedNodeType(nodeType);
    setIsDragging(true);
  };

  // Update node position
  const updateNodePosition = (nodeId: string, x: number, y: number) => {
    setNodes(
      nodes.map((n) =>
        n.id === nodeId
          ? { ...n, position: { x: Math.max(0, x), y: Math.max(0, y) } }
          : n
      )
    );
  };

  // Delete node
  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter((n) => n.id !== nodeId));
    setEdges(edges.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNode === nodeId) setSelectedNode(null);
  };

  // Connect nodes
  const connectNodes = (fromId: string, toId: string) => {
    if (fromId === toId) return; // Prevent self-connection
    if (edges.some((e) => e.source === fromId && e.target === toId)) return; // Prevent duplicate

    const newEdge: Edge = {
      id: `edge-${fromId}-${toId}`,
      source: fromId,
      target: toId,
    };

    setEdges([...edges, newEdge]);
    setConnecting(null);
  };

  // Delete edge
  const deleteEdge = (edgeId: string) => {
    setEdges(edges.filter((e) => e.id !== edgeId));
  };

  // Update node config
  const updateNodeConfig = (nodeId: string, config: Record<string, unknown>) => {
    setNodes(
      nodes.map((n) => (n.id === nodeId ? { ...n, config } : n))
    );
  };

  // Filter nodes based on search
  const filteredCategories = NODE_GROUPS.map((group) => ({
    ...group,
    nodes: group.nodes.filter((n) =>
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.type.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((g) => g.nodes.length > 0);

  const selectedNodeData = getNode(selectedNode || '');

  // Render node-specific configuration fields based on node type
  const renderNodeConfig = () => {
    if (!selectedNodeData) return null;

    const { type, config, id } = selectedNodeData;
    const updateConfig = (key: string, value: unknown) => {
      updateNodeConfig(id, { ...config, [key]: value });
    };

    switch (type) {
      // ==================== TRIGGERS ====================
      case 'manual_trigger':
        return (
          <div className="n8n-config-section">
            <label className="n8n-label">Configuration</label>
            <div className="n8n-empty-text">No configuration needed. This node starts the workflow manually.</div>
          </div>
        );

      case 'webhook':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">URL</label>
              <input
                type="text"
                value={(config.url as string) || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
                className="n8n-input"
                placeholder="https://example.com/webhook"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Method</label>
              <select
                value={(config.method as string) || 'POST'}
                onChange={(e) => updateConfig('method', e.target.value)}
                className="n8n-select"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
          </>
        );

      case 'schedule':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Cron Expression</label>
              <input
                type="text"
                value={(config.cron as string) || ''}
                onChange={(e) => updateConfig('cron', e.target.value)}
                className="n8n-input"
                placeholder="0 * * * * (every hour)"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Timezone</label>
              <input
                type="text"
                value={(config.timezone as string) || ''}
                onChange={(e) => updateConfig('timezone', e.target.value)}
                className="n8n-input"
                placeholder="America/New_York"
              />
            </div>
          </>
        );

      case 'form_submission':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Form Fields (JSON Array)</label>
              <textarea
                value={(config.formFields as string) || ''}
                onChange={(e) => updateConfig('formFields', e.target.value)}
                className="n8n-textarea"
                rows={4}
                placeholder='[{"name": "email", "type": "text"}, ...]'
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Required Fields</label>
              <textarea
                value={(config.requiredFields as string) || ''}
                onChange={(e) => updateConfig('requiredFields', e.target.value)}
                className="n8n-textarea"
                rows={3}
                placeholder="email, name, department"
              />
            </div>
          </>
        );

      case 'api_trigger':
        return (
          <div className="n8n-config-section">
            <label className="n8n-label">Event Name</label>
            <input
              type="text"
              value={(config.eventName as string) || ''}
              onChange={(e) => updateConfig('eventName', e.target.value)}
              className="n8n-input"
              placeholder="invoice.created"
            />
          </div>
        );

      case 'file_upload_trigger':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Allowed Types</label>
              <input
                type="text"
                value={(config.allowedTypes as string) || ''}
                onChange={(e) => updateConfig('allowedTypes', e.target.value)}
                className="n8n-input"
                placeholder=".pdf, .csv, .xlsx"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Max Size (MB)</label>
              <input
                type="number"
                value={(config.maxSizeMB as number) || ''}
                onChange={(e) => updateConfig('maxSizeMB', Number(e.target.value))}
                className="n8n-input"
                placeholder="10"
              />
            </div>
          </>
        );

      case 'timer_trigger':
        return (
          <div className="n8n-config-section">
            <label className="n8n-label">Delay (ms)</label>
            <input
              type="number"
              value={(config.delayMs as number) || ''}
              onChange={(e) => updateConfig('delayMs', Number(e.target.value))}
              className="n8n-input"
              placeholder="5000"
            />
          </div>
        );

      // ==================== AI & ANALYSIS ====================
      case 'llm_analysis':
        return (
          <div className="n8n-config-section">
            <label className="n8n-label">Prompt</label>
            <textarea
              value={(config.prompt as string) || ''}
              onChange={(e) => updateConfig('prompt', e.target.value)}
              className="n8n-textarea"
              rows={4}
              placeholder="Analyze the following data..."
            />
          </div>
        );

      case 'classification':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Categories</label>
              <textarea
                value={(config.categories as string) || ''}
                onChange={(e) => updateConfig('categories', e.target.value)}
                className="n8n-textarea"
                rows={3}
                placeholder="urgent, normal, low-priority"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Instructions</label>
              <textarea
                value={(config.instructions as string) || ''}
                onChange={(e) => updateConfig('instructions', e.target.value)}
                className="n8n-textarea"
                rows={3}
                placeholder="Classify based on severity and impact..."
              />
            </div>
          </>
        );

      case 'summarization':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Max Length</label>
              <input
                type="number"
                value={(config.maxLength as number) || ''}
                onChange={(e) => updateConfig('maxLength', Number(e.target.value))}
                className="n8n-input"
                placeholder="500"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Style</label>
              <select
                value={(config.style as string) || 'brief'}
                onChange={(e) => updateConfig('style', e.target.value)}
                className="n8n-select"
              >
                <option value="brief">Brief</option>
                <option value="detailed">Detailed</option>
                <option value="bullets">Bullets</option>
              </select>
            </div>
          </>
        );

      case 'risk_analysis':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Risk Factors</label>
              <textarea
                value={(config.riskFactors as string) || ''}
                onChange={(e) => updateConfig('riskFactors', e.target.value)}
                className="n8n-textarea"
                rows={4}
                placeholder="financial exposure, compliance risk, ..."
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Threshold (0-100)</label>
              <input
                type="number"
                value={(config.threshold as number) || ''}
                onChange={(e) => updateConfig('threshold', Number(e.target.value))}
                className="n8n-input"
                min={0}
                max={100}
                placeholder="75"
              />
            </div>
          </>
        );

      case 'decision_generation':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Decision Criteria</label>
              <textarea
                value={(config.decisionCriteria as string) || ''}
                onChange={(e) => updateConfig('decisionCriteria', e.target.value)}
                className="n8n-textarea"
                rows={3}
                placeholder="cost, timeline, risk level, ..."
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Options</label>
              <textarea
                value={(config.options as string) || ''}
                onChange={(e) => updateConfig('options', e.target.value)}
                className="n8n-textarea"
                rows={3}
                placeholder="approve, reject, defer, escalate"
              />
            </div>
          </>
        );

      // ==================== AGENT OPERATIONS ====================
      case 'agent_invoke':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Target Agent ID</label>
              <input
                type="text"
                value={(config.targetAgentId as string) || ''}
                onChange={(e) => updateConfig('targetAgentId', e.target.value)}
                className="n8n-input"
                placeholder="meeting, invoice, hr, ..."
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Input Template</label>
              <textarea
                value={(config.inputTemplate as string) || ''}
                onChange={(e) => updateConfig('inputTemplate', e.target.value)}
                className="n8n-textarea"
                rows={4}
                placeholder='{"data": "{{input}}"}'
              />
            </div>
          </>
        );

      case 'agent_message':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Target Agent</label>
              <input
                type="text"
                value={(config.targetAgent as string) || ''}
                onChange={(e) => updateConfig('targetAgent', e.target.value)}
                className="n8n-input"
                placeholder="hr-agent"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Message Type</label>
              <select
                value={(config.messageType as string) || 'request'}
                onChange={(e) => updateConfig('messageType', e.target.value)}
                className="n8n-select"
              >
                <option value="request">Request</option>
                <option value="response">Response</option>
                <option value="notification">Notification</option>
              </select>
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Message Template</label>
              <textarea
                value={(config.messageTemplate as string) || ''}
                onChange={(e) => updateConfig('messageTemplate', e.target.value)}
                className="n8n-textarea"
                rows={4}
                placeholder="Please process {{input}}..."
              />
            </div>
          </>
        );

      // ==================== FLOW CONTROL ====================
      case 'condition':
      case 'conditional_routing':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Field</label>
              <input
                type="text"
                value={(config.field as string) || ''}
                onChange={(e) => updateConfig('field', e.target.value)}
                className="n8n-input"
                placeholder="data.status"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Operator</label>
              <select
                value={(config.operator as string) || 'eq'}
                onChange={(e) => updateConfig('operator', e.target.value)}
                className="n8n-select"
              >
                <option value="eq">Equals (eq)</option>
                <option value="neq">Not Equals (neq)</option>
                <option value="gt">Greater Than (gt)</option>
                <option value="lt">Less Than (lt)</option>
                <option value="gte">Greater or Equal (gte)</option>
                <option value="lte">Less or Equal (lte)</option>
                <option value="contains">Contains</option>
                <option value="startsWith">Starts With</option>
                <option value="endsWith">Ends With</option>
              </select>
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Value</label>
              <input
                type="text"
                value={(config.value as string) || ''}
                onChange={(e) => updateConfig('value', e.target.value)}
                className="n8n-input"
                placeholder="approved"
              />
            </div>
          </>
        );

      case 'approval':
        return (
          <div className="n8n-config-section">
            <label className="n8n-label">Approver Email</label>
            <input
              type="email"
              value={(config.approver as string) || ''}
              onChange={(e) => updateConfig('approver', e.target.value)}
              className="n8n-input"
              placeholder="manager@company.com"
            />
          </div>
        );

      case 'approval_chain':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Approvers (comma-separated)</label>
              <textarea
                value={(config.approvers as string) || ''}
                onChange={(e) => updateConfig('approvers', e.target.value)}
                className="n8n-textarea"
                rows={3}
                placeholder="manager@co.com, director@co.com, vp@co.com"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">
                <input
                  type="checkbox"
                  checked={(config.requireAll as boolean) || false}
                  onChange={(e) => updateConfig('requireAll', e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                Require All Approvers
              </label>
            </div>
          </>
        );

      case 'threshold_decision':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Field</label>
              <input
                type="text"
                value={(config.field as string) || ''}
                onChange={(e) => updateConfig('field', e.target.value)}
                className="n8n-input"
                placeholder="data.score"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Threshold</label>
              <input
                type="number"
                value={(config.threshold as number) || ''}
                onChange={(e) => updateConfig('threshold', Number(e.target.value))}
                className="n8n-input"
                placeholder="80"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Above Action</label>
              <input
                type="text"
                value={(config.aboveAction as string) || ''}
                onChange={(e) => updateConfig('aboveAction', e.target.value)}
                className="n8n-input"
                placeholder="auto-approve"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Below Action</label>
              <input
                type="text"
                value={(config.belowAction as string) || ''}
                onChange={(e) => updateConfig('belowAction', e.target.value)}
                className="n8n-input"
                placeholder="escalate"
              />
            </div>
          </>
        );

      // ==================== ACTIONS ====================
      case 'notification':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Channel</label>
              <select
                value={(config.channel as string) || 'email'}
                onChange={(e) => updateConfig('channel', e.target.value)}
                className="n8n-select"
              >
                <option value="email">Email</option>
                <option value="slack">Slack</option>
                <option value="webhook">Webhook</option>
              </select>
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Recipient</label>
              <input
                type="text"
                value={(config.recipient as string) || ''}
                onChange={(e) => updateConfig('recipient', e.target.value)}
                className="n8n-input"
                placeholder="user@company.com or #channel"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Subject</label>
              <input
                type="text"
                value={(config.subject as string) || ''}
                onChange={(e) => updateConfig('subject', e.target.value)}
                className="n8n-input"
                placeholder="Workflow Notification"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Message Template</label>
              <textarea
                value={(config.messageTemplate as string) || ''}
                onChange={(e) => updateConfig('messageTemplate', e.target.value)}
                className="n8n-textarea"
                rows={4}
                placeholder="Hello, {{name}}. Your request has been {{status}}."
              />
            </div>
          </>
        );

      case 'api_call':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">URL</label>
              <input
                type="text"
                value={(config.url as string) || ''}
                onChange={(e) => updateConfig('url', e.target.value)}
                className="n8n-input"
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Method</label>
              <select
                value={(config.method as string) || 'GET'}
                onChange={(e) => updateConfig('method', e.target.value)}
                className="n8n-select"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Headers (JSON)</label>
              <textarea
                value={(config.headers as string) || ''}
                onChange={(e) => updateConfig('headers', e.target.value)}
                className="n8n-textarea"
                rows={3}
                placeholder='{"Authorization": "Bearer {{token}}"}'
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Body Template</label>
              <textarea
                value={(config.bodyTemplate as string) || ''}
                onChange={(e) => updateConfig('bodyTemplate', e.target.value)}
                className="n8n-textarea"
                rows={4}
                placeholder='{"data": "{{input}}"}'
              />
            </div>
          </>
        );

      case 'file_operation':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Operation</label>
              <select
                value={(config.operation as string) || 'create'}
                onChange={(e) => updateConfig('operation', e.target.value)}
                className="n8n-select"
              >
                <option value="create">Create</option>
                <option value="read">Read</option>
                <option value="delete">Delete</option>
              </select>
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">File Path</label>
              <input
                type="text"
                value={(config.filePath as string) || ''}
                onChange={(e) => updateConfig('filePath', e.target.value)}
                className="n8n-input"
                placeholder="/reports/output.pdf"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Content Template</label>
              <textarea
                value={(config.contentTemplate as string) || ''}
                onChange={(e) => updateConfig('contentTemplate', e.target.value)}
                className="n8n-textarea"
                rows={4}
                placeholder="File content or template..."
              />
            </div>
          </>
        );

      case 'database_write':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Table</label>
              <input
                type="text"
                value={(config.table as string) || ''}
                onChange={(e) => updateConfig('table', e.target.value)}
                className="n8n-input"
                placeholder="audit_records"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Data Template (JSON)</label>
              <textarea
                value={(config.dataTemplate as string) || ''}
                onChange={(e) => updateConfig('dataTemplate', e.target.value)}
                className="n8n-textarea"
                rows={4}
                placeholder='{"field1": "{{value1}}", "field2": "{{value2}}"}'
              />
            </div>
          </>
        );

      case 'task_assignment':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Assignee</label>
              <input
                type="text"
                value={(config.assignee as string) || ''}
                onChange={(e) => updateConfig('assignee', e.target.value)}
                className="n8n-input"
                placeholder="john.doe@company.com"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Title</label>
              <input
                type="text"
                value={(config.title as string) || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
                className="n8n-input"
                placeholder="Review submitted invoice"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Priority</label>
              <select
                value={(config.priority as string) || 'medium'}
                onChange={(e) => updateConfig('priority', e.target.value)}
                className="n8n-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </>
        );

      case 'invoice_processing':
        return (
          <div className="n8n-config-section">
            <label className="n8n-label">Validation Rules</label>
            <textarea
              value={(config.validationRules as string) || ''}
              onChange={(e) => updateConfig('validationRules', e.target.value)}
              className="n8n-textarea"
              rows={4}
              placeholder="amount > 0, vendor is not empty, ..."
            />
          </div>
        );

      case 'report_generation':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Template</label>
              <select
                value={(config.template as string) || 'summary'}
                onChange={(e) => updateConfig('template', e.target.value)}
                className="n8n-select"
              >
                <option value="summary">Summary</option>
                <option value="detailed">Detailed</option>
                <option value="financial">Financial</option>
              </select>
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Title</label>
              <input
                type="text"
                value={(config.title as string) || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
                className="n8n-input"
                placeholder="Monthly Summary Report"
              />
            </div>
          </>
        );

      // ==================== DATA ====================
      case 'data_transformation':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Operation</label>
              <select
                value={(config.operation as string) || 'map'}
                onChange={(e) => updateConfig('operation', e.target.value)}
                className="n8n-select"
              >
                <option value="map">Map</option>
                <option value="filter">Filter</option>
                <option value="merge">Merge</option>
                <option value="extract">Extract</option>
              </select>
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Expression</label>
              <textarea
                value={(config.expression as string) || ''}
                onChange={(e) => updateConfig('expression', e.target.value)}
                className="n8n-textarea"
                rows={4}
                placeholder="item => item.value * 2"
              />
            </div>
          </>
        );

      case 'data_storage':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Key</label>
              <input
                type="text"
                value={(config.key as string) || ''}
                onChange={(e) => updateConfig('key', e.target.value)}
                className="n8n-input"
                placeholder="session_data"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">TTL (seconds)</label>
              <input
                type="number"
                value={(config.ttlSeconds as number) || ''}
                onChange={(e) => updateConfig('ttlSeconds', Number(e.target.value))}
                className="n8n-input"
                placeholder="3600"
              />
            </div>
          </>
        );

      case 'data_retrieval':
        return (
          <div className="n8n-config-section">
            <label className="n8n-label">Key</label>
            <input
              type="text"
              value={(config.key as string) || ''}
              onChange={(e) => updateConfig('key', e.target.value)}
              className="n8n-input"
              placeholder="session_data"
            />
          </div>
        );

      // ==================== MONITORING ====================
      case 'metrics_collection':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Metric Name</label>
              <input
                type="text"
                value={(config.metricName as string) || ''}
                onChange={(e) => updateConfig('metricName', e.target.value)}
                className="n8n-input"
                placeholder="processing_time"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Value Expression</label>
              <input
                type="text"
                value={(config.valueExpression as string) || ''}
                onChange={(e) => updateConfig('valueExpression', e.target.value)}
                className="n8n-input"
                placeholder="data.duration_ms"
              />
            </div>
          </>
        );

      case 'audit_log':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Event Type</label>
              <input
                type="text"
                value={(config.eventType as string) || ''}
                onChange={(e) => updateConfig('eventType', e.target.value)}
                className="n8n-input"
                placeholder="approval_granted"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Description Template</label>
              <textarea
                value={(config.descriptionTemplate as string) || ''}
                onChange={(e) => updateConfig('descriptionTemplate', e.target.value)}
                className="n8n-textarea"
                rows={3}
                placeholder="User {{user}} approved request {{id}}"
              />
            </div>
          </>
        );

      case 'sla_monitoring':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Threshold</label>
              <input
                type="text"
                value={(config.threshold as string) || ''}
                onChange={(e) => updateConfig('threshold', e.target.value)}
                className="n8n-input"
                placeholder="24h"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Metric</label>
              <input
                type="text"
                value={(config.metric as string) || ''}
                onChange={(e) => updateConfig('metric', e.target.value)}
                className="n8n-input"
                placeholder="response_time"
              />
            </div>
          </>
        );

      case 'bottleneck_detection':
        return (
          <div className="n8n-config-section">
            <label className="n8n-label">Configuration</label>
            <div className="n8n-empty-text">Automatic detection. No configuration needed.</div>
          </div>
        );

      // ==================== UTILITY ====================
      case 'delay':
        return (
          <div className="n8n-config-section">
            <label className="n8n-label">Delay (ms)</label>
            <input
              type="number"
              value={(config.delayMs as number) || ''}
              onChange={(e) => updateConfig('delayMs', Number(e.target.value))}
              className="n8n-input"
              placeholder="1000"
            />
          </div>
        );

      case 'debug':
        return (
          <>
            <div className="n8n-config-section">
              <label className="n8n-label">Label</label>
              <input
                type="text"
                value={(config.label as string) || ''}
                onChange={(e) => updateConfig('label', e.target.value)}
                className="n8n-input"
                placeholder="Debug checkpoint 1"
              />
            </div>
            <div className="n8n-config-section">
              <label className="n8n-label">Log Level</label>
              <select
                value={(config.logLevel as string) || 'info'}
                onChange={(e) => updateConfig('logLevel', e.target.value)}
                className="n8n-select"
              >
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
              </select>
            </div>
          </>
        );

      case 'merge':
        return (
          <div className="n8n-config-section">
            <label className="n8n-label">Strategy</label>
            <select
              value={(config.strategy as string) || 'append'}
              onChange={(e) => updateConfig('strategy', e.target.value)}
              className="n8n-select"
            >
              <option value="append">Append</option>
              <option value="merge">Merge</option>
              <option value="zip">Zip</option>
            </select>
          </div>
        );

      // ==================== DEFAULT ====================
      default:
        return (
          <div className="n8n-config-section">
            <label className="n8n-label">Configuration</label>
            <div className="n8n-empty-text">No configuration available for this node type.</div>
          </div>
        );
    }
  };

  return (
    <div className="n8n-workflow-builder">
      {/* Header */}
      <div className="n8n-header">
        <div className="n8n-header-left">
          {onBack && (
            <button className="n8n-back-btn" onClick={onBack} title="Back to dashboard">
              ←
            </button>
          )}
          <h1 className="n8n-workflow-title">{workflowName}</h1>
        </div>
        <div className="n8n-header-center">
          <span className="n8n-status">●</span>
          <span className="n8n-status-text">Ready</span>
        </div>
        <div className="n8n-header-right">
          <button
            className="n8n-btn n8n-btn-secondary"
            onClick={() => onSave?.(
              nodes.map((n) => ({
                instanceId: n.id,
                nodeType: n.type,
                name: n.name,
                config: n.config,
                position: n.position,
              })),
              edges.map((e) => ({
                id: e.id,
                fromNodeId: e.source,
                toNodeId: e.target,
              }))
            )}
          >
            Save
          </button>
          <button
            className="n8n-btn n8n-btn-primary"
            onClick={() => onExecute?.(
              nodes.map((n) => ({
                instanceId: n.id,
                nodeType: n.type,
                name: n.name,
                config: n.config,
                position: n.position,
              })),
              edges.map((e) => ({
                id: e.id,
                fromNodeId: e.source,
                toNodeId: e.target,
              }))
            )}
          >
            ▶ Execute
          </button>
        </div>
      </div>

      <div className="n8n-container">
        {/* Left Sidebar - Node Palette */}
        <div className="n8n-sidebar n8n-sidebar-left">
          <div className="n8n-sidebar-header">
            <h2>Add Nodes</h2>
          </div>

          <div className="n8n-search-box">
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="n8n-search-input"
            />
          </div>

          <div className="n8n-node-palette">
            {filteredCategories.map((category) => (
              <div key={category.id} className="n8n-node-category">
                <h3 className="n8n-category-title">{category.name}</h3>
                <div className="n8n-node-list">
                  {category.nodes.map((node) => (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, node.type)}
                      className="n8n-node-item"
                      title={node.description}
                    >
                      <div className="n8n-node-icon" style={{ backgroundColor: category.color }}>
                        {node.icon || '⚙'}
                      </div>
                      <div className="n8n-node-label">
                        <div className="n8n-node-name">{node.name}</div>
                        <div className="n8n-node-subtitle">{category.name}</div>
                      </div>
                      <div className="n8n-drag-handle">☰</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="n8n-canvas-container">
          <div
            ref={canvasRef}
            className="n8n-canvas"
            onDrop={addNode}
            onDragOver={(e) => e.preventDefault()}
            onWheel={handleCanvasWheel}
          >
            {/* Grid Background */}
            <div className="n8n-grid"></div>

            {/* SVG for connections */}
            <svg className="n8n-connections">
              {edges.map((edge) => {
                const fromNode = getNode(edge.source);
                const toNode = getNode(edge.target);
                if (!fromNode || !toNode) return null;

                const from = {
                  x: fromNode.position.x + 140,
                  y: fromNode.position.y + 40,
                };
                const to = {
                  x: toNode.position.x,
                  y: toNode.position.y + 40,
                };

                const midX = (from.x + to.x) / 2;

                return (
                  <g key={edge.id}>
                    <path
                      d={`M${from.x} ${from.y} C${midX} ${from.y} ${midX} ${to.y} ${to.x} ${to.y}`}
                      className="n8n-connection-line"
                      onClick={() => deleteEdge(edge.id)}
                    />
                    <circle
                      cx={from.x}
                      cy={from.y}
                      r="4"
                      className="n8n-port n8n-port-output"
                    />
                    <circle
                      cx={to.x}
                      cy={to.y}
                      r="4"
                      className="n8n-port n8n-port-input"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
              <NodeComponent
                key={node.id}
                node={node}
                isSelected={selectedNode === node.id}
                onSelect={() => setSelectedNode(node.id)}
                onPositionChange={(x, y) => updateNodePosition(node.id, x, y)}
                onDelete={() => deleteNode(node.id)}
                onStartConnection={() => setConnecting({ from: node.id })}
                onEndConnection={() => {
                  if (connecting?.from && connecting.from !== node.id) {
                    connectNodes(connecting.from, node.id);
                  }
                }}
                isConnectionTarget={connecting?.from !== node.id}
              />
            ))}

            {nodes.length === 0 && (
              <div className="n8n-empty-state">
                <div className="n8n-empty-icon">🔄</div>
                <p>Drag nodes from the left panel to build your workflow</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Node Configuration */}
        {selectedNodeData && (
          <div className="n8n-sidebar n8n-sidebar-right">
            <div className="n8n-sidebar-header">
              <h2>Node Configuration</h2>
              <button
                className="n8n-btn-close"
                onClick={() => setSelectedNode(null)}
              >
                ✕
              </button>
            </div>

            <div className="n8n-config-panel">
              <div className="n8n-config-section">
                <label className="n8n-label">Node Name</label>
                <input
                  type="text"
                  value={selectedNodeData.name}
                  onChange={(e) => {
                    setNodes(
                      nodes.map((n) =>
                        n.id === selectedNodeData.id
                          ? { ...n, name: e.target.value }
                          : n
                      )
                    );
                  }}
                  className="n8n-input"
                />
              </div>

              <div className="n8n-config-section">
                <label className="n8n-label">Type</label>
                <div className="n8n-type-badge">{selectedNodeData.type}</div>
              </div>

              {renderNodeConfig()}

              <div className="n8n-config-section">
                <label className="n8n-label">Incoming Connections</label>
                <div className="n8n-connections-list">
                  {getIncoming(selectedNodeData.id).length === 0 ? (
                    <span className="n8n-empty-text">None</span>
                  ) : (
                    getIncoming(selectedNodeData.id).map((nodeId) => (
                      <div key={nodeId} className="n8n-connection-item">
                        {getNode(nodeId)?.name || nodeId}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="n8n-config-section">
                <label className="n8n-label">Outgoing Connections</label>
                <div className="n8n-connections-list">
                  {getOutgoing(selectedNodeData.id).length === 0 ? (
                    <span className="n8n-empty-text">None</span>
                  ) : (
                    getOutgoing(selectedNodeData.id).map((nodeId) => (
                      <div key={nodeId} className="n8n-connection-item">
                        {getNode(nodeId)?.name || nodeId}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="n8n-config-actions">
                <button
                  className="n8n-btn n8n-btn-danger"
                  onClick={() => deleteNode(selectedNodeData.id)}
                >
                  Delete Node
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Node Component
interface NodeComponentProps {
  node: Node;
  isSelected: boolean;
  isConnectionTarget: boolean;
  onSelect: () => void;
  onPositionChange: (x: number, y: number) => void;
  onDelete: () => void;
  onStartConnection: () => void;
  onEndConnection: () => void;
}

const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  isConnectionTarget,
  onSelect,
  onPositionChange,
  onDelete,
  onStartConnection,
  onEndConnection,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.n8n-node-port')) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      onPositionChange(e.clientX - dragOffset.x, e.clientY - dragOffset.y);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange]);

  const nodeColor = NODE_GROUPS.find((g) =>
    g.nodes.some((n) => n.type === node.type)
  )?.color || '#999';

  return (
    <div
      className={`n8n-node ${isSelected ? 'n8n-node-selected' : ''}`}
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
      }}
      onMouseDown={handleMouseDown}
      onClick={onSelect}
    >
      <div className="n8n-node-header" style={{ borderTopColor: nodeColor }}>
        <div className="n8n-node-icon-small" style={{ backgroundColor: nodeColor }}>
          ⚙
        </div>
        <div className="n8n-node-title">{node.name}</div>
        <button className="n8n-node-menu" onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}>
          ✕
        </button>
      </div>
      <div className="n8n-node-body">
        <div className="n8n-node-type">{node.type.replace(/_/g, ' ')}</div>
      </div>

      {/* Input port */}
      <div
        className="n8n-node-port n8n-node-port-input"
        onMouseDown={(e) => {
          e.stopPropagation();
          onEndConnection();
        }}
        title="Connect from another node"
      />

      {/* Output port */}
      <div
        className="n8n-node-port n8n-node-port-output"
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartConnection();
        }}
        title="Connect to another node"
      />
    </div>
  );
};
