import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Agent, AgentState } from '../types/agent';

// ─── Types ────────────────────────────────────────────────────────────────────

type MsgType = 'info' | 'success' | 'warning' | 'error' | 'running';

interface CommandMessage {
  id: string;
  timestamp: number;
  status: string;
  action: string;
  suggestion?: string;
  type: MsgType;
  metadata?: {
    node?: string;
    agent?: string;
    workflow?: string;
    timeTaken?: number;
    confidence?: number;
  };
}

interface DemoStep {
  delay: number;
  message: Omit<CommandMessage, 'id' | 'timestamp'>;
}

interface NiyantaCommandConsoleProps {
  agents?: Agent[];
  agentStates?: Record<string, AgentState>;
  workflows?: Array<{ id?: string; name?: string; status?: string; category?: string }>;
  metrics?: Record<string, unknown>;
  systemSnapshot: {
    activeAgents: number;
    workflowCount: number;
    auditCount: number;
    decisionCount: number;
  };
}

// ─── Demo Flows ───────────────────────────────────────────────────────────────

const DEMO_FLOWS: Record<string, DemoStep[]> = {
  invoice: [
    { delay: 0,    message: { status: 'Input Received',          action: 'Parsing invoice document — detecting format and structure.',          suggestion: 'Routing to Invoice Processing Agent',  type: 'info',    metadata: { workflow: 'Invoice Processing' } } },
    { delay: 900,  message: { status: 'Invoice Agent Activated', action: 'Spawning specialist agent and loading domain rules.',                  suggestion: 'Monitoring workflow initialisation',    type: 'running', metadata: { agent: 'Finance Operations Agent', workflow: 'Invoice Processing' } } },
    { delay: 2000, message: { status: 'OCR Node Completed',      action: 'Extracted 14 fields — vendor, amount, dates, PO reference.',          suggestion: 'Proceeding to validation layer',        type: 'success', metadata: { node: 'OCR Extraction', timeTaken: 1.2, workflow: 'Invoice Processing' } } },
    { delay: 3100, message: { status: 'Validation Passed',       action: 'All mandatory fields present. PO cross-reference matched.',            suggestion: 'Forwarding to decision engine',         type: 'success', metadata: { node: 'Field Validator', timeTaken: 0.4, workflow: 'Invoice Processing' } } },
    { delay: 4200, message: { status: 'Compliance Check',        action: 'Vendor on approved list. GST number verified against registry.',       suggestion: 'Compliance layer cleared',             type: 'success', metadata: { node: 'Compliance Gate', agent: 'Compliance Agent', timeTaken: 0.8 } } },
    { delay: 5400, message: { status: 'Decision Rendered',       action: 'Invoice APPROVED — amount ₹48,500 within auto-approval threshold.',   suggestion: 'Trigger payment workflow or review',    type: 'success', metadata: { node: 'Decision Engine', confidence: 0.94, timeTaken: 0.3 } } },
    { delay: 6200, message: { status: 'Workflow Completed',      action: '5 nodes executed. Audit trail written. Notification queued.',          suggestion: 'View audit log · Open payment workflow', type: 'success', metadata: { workflow: 'Invoice Processing', timeTaken: 5.6 } } },
  ],
  compliance: [
    { delay: 0,    message: { status: 'Compliance Scan Started', action: 'Loading regulatory ruleset — GDPR, SOC2, ISO 27001.',                  suggestion: 'Scanning all active workflows',         type: 'info',    metadata: { workflow: 'Compliance Audit' } } },
    { delay: 800,  message: { status: 'Compliance Agent Active', action: 'Analysing 12 workflows and 8 active data pipelines.',                  suggestion: 'Deep scan in progress',                 type: 'running', metadata: { agent: 'Compliance Agent', workflow: 'Compliance Audit' } } },
    { delay: 2000, message: { status: 'Data Handling Check',     action: 'PII fields encrypted at rest. Access logs intact.',                    suggestion: 'Proceeding to access control audit',    type: 'success', metadata: { node: 'Data Privacy Gate', timeTaken: 1.1 } } },
    { delay: 3200, message: { status: 'Access Control Audit',    action: 'Role permissions within policy. No privilege escalation detected.',    suggestion: 'Reviewing retention policies',          type: 'success', metadata: { node: 'Access Auditor', timeTaken: 0.9 } } },
    { delay: 4300, message: { status: 'Retention Policy Flag',   action: '3 data records exceed 90-day retention limit — action required.',     suggestion: 'Review records or trigger auto-purge',  type: 'warning', metadata: { node: 'Retention Check', timeTaken: 0.5 } } },
    { delay: 5500, message: { status: 'Compliance Score',        action: 'Overall score: 94/100. 1 warning raised. No critical violations.',     suggestion: 'Download compliance report',            type: 'success', metadata: { workflow: 'Compliance Audit', confidence: 0.94, timeTaken: 4.7 } } },
  ],
  hr: [
    { delay: 0,    message: { status: 'Onboarding Initiated',    action: 'New employee record detected. Loading onboarding workflow.',           suggestion: 'Routing to HR Operations Agent',        type: 'info',    metadata: { workflow: 'HR Onboarding' } } },
    { delay: 900,  message: { status: 'HR Agent Activated',      action: 'Preparing 7-stage onboarding pipeline for new hire.',                 suggestion: 'Provisioning access and accounts',      type: 'running', metadata: { agent: 'HR Operations Agent', workflow: 'HR Onboarding' } } },
    { delay: 2000, message: { status: 'Identity Verified',       action: 'ID documents validated. Background check cleared.',                   suggestion: 'Proceeding to system access setup',     type: 'success', metadata: { node: 'Identity Gate', timeTaken: 1.4 } } },
    { delay: 3100, message: { status: 'Access Provisioned',      action: 'Email, Slack, and toolchain accounts created and activated.',         suggestion: 'Sending welcome communication',         type: 'success', metadata: { node: 'Access Provisioning', timeTaken: 0.8 } } },
    { delay: 4200, message: { status: 'Training Assigned',       action: '4 mandatory training modules assigned with 14-day completion target.', suggestion: 'Manager notification sent',             type: 'success', metadata: { node: 'Learning Path', timeTaken: 0.2 } } },
    { delay: 5300, message: { status: 'Onboarding Complete',     action: 'All 7 stages completed. Employee is production-ready.',               suggestion: 'View employee profile · Close ticket',  type: 'success', metadata: { workflow: 'HR Onboarding', timeTaken: 4.9, confidence: 1.0 } } },
  ],
  default: [
    { delay: 0,    message: { status: 'Request Received',        action: 'Analysing input and determining optimal agent routing.',               suggestion: 'Dispatching to best-fit agent',         type: 'info' } },
    { delay: 900,  message: { status: 'Agent Dispatched',        action: 'Workflow engine initialised. Loading execution context.',              suggestion: 'Monitoring node execution',             type: 'running', metadata: { agent: 'Niyanta Orchestrator' } } },
    { delay: 2000, message: { status: 'Node 1 Complete',         action: 'Input normalisation and feature extraction done.',                     suggestion: 'Advancing to processing layer',         type: 'success', metadata: { node: 'Preprocessor', timeTaken: 0.9 } } },
    { delay: 3200, message: { status: 'Node 2 Complete',         action: 'Business rules evaluated — no conflicts detected.',                    suggestion: 'Escalating to decision engine',         type: 'success', metadata: { node: 'Rules Engine', timeTaken: 0.6 } } },
    { delay: 4400, message: { status: 'Decision Output',         action: 'Task completed successfully with high confidence.',                    suggestion: 'Review result or trigger next workflow', type: 'success', metadata: { confidence: 0.89, timeTaken: 1.1 } } },
    { delay: 5400, message: { status: 'Execution Complete',      action: 'All nodes executed cleanly. Audit event persisted.',                  suggestion: 'View audit trail · Export report',      type: 'success' } },
  ],
};

function detectFlow(input: string): string {
  const lc = input.toLowerCase();
  if (lc.includes('invoice') || lc.includes('payment') || lc.includes('finance') || lc.includes('vendor')) return 'invoice';
  if (lc.includes('compliance') || lc.includes('gdpr') || lc.includes('audit') || lc.includes('soc')) return 'compliance';
  if (lc.includes('hr') || lc.includes('onboard') || lc.includes('employee') || lc.includes('recruit')) return 'hr';
  return 'default';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<MsgType, string> = {
  info:    '◉',
  running: '⏳',
  success: '✔',
  warning: '⚠',
  error:   '✖',
};

const TYPE_COLOR: Record<MsgType, string> = {
  info:    'var(--status-info)',
  running: '#a78bfa',
  success: 'var(--status-success)',
  warning: 'var(--status-warning)',
  error:   'var(--status-danger)',
};

const TYPE_BG: Record<MsgType, string> = {
  info:    'rgba(6,182,212,0.04)',
  running: 'rgba(167,139,250,0.06)',
  success: 'rgba(16,185,129,0.04)',
  warning: 'rgba(245,158,11,0.06)',
  error:   'rgba(239,68,68,0.06)',
};

const TYPE_BORDER: Record<MsgType, string> = {
  info:    'rgba(6,182,212,0.2)',
  running: 'rgba(167,139,250,0.3)',
  success: 'rgba(16,185,129,0.2)',
  warning: 'rgba(245,158,11,0.25)',
  error:   'rgba(239,68,68,0.25)',
};

function formatTs(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// ─── Component ────────────────────────────────────────────────────────────────

const NiyantaCommandConsole: React.FC<NiyantaCommandConsoleProps> = ({
  agents = [],
  agentStates = {},
  workflows = [],
  metrics = {},
  systemSnapshot,
}) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<CommandMessage[]>([]);
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<MsgType | 'all'>('all');
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pausedRef = useRef(false);

  const m = metrics as Record<string, unknown>;
  const toNum = (v: unknown, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
  const failedToday = toNum(m.failedToday, 0);
  const criticalAlerts = toNum(m.criticalAlerts, 0);
  const pendingApprovals = toNum(m.pendingApprovals, 0);
  const activeWfs = workflows.filter(w => w.status === 'active');
  const activeAgentList = agents.filter(a => agentStates[a.id]?.status === 'processing' || agentStates[a.id]?.status === 'complete');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingLabel]);

  const clearTimers = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  };

  const runDemo = useCallback((flowKey: string, workflowLabel: string) => {
    clearTimers();
    setIsRunning(true);
    setIsPaused(false);
    pausedRef.current = false;
    setActiveWorkflow(workflowLabel);
    setMessages([]);
    setTypingLabel(null);

    const steps = DEMO_FLOWS[flowKey];

    steps.forEach((step, idx) => {
      const labelDelay = Math.max(0, step.delay - 400);
      const nextStep = steps[idx + 1];

      const labelTimer = setTimeout(() => {
        if (!pausedRef.current) {
          setTypingLabel(nextStep ? `${TYPE_ICON[nextStep.message.type as MsgType]} Processing next step…` : null);
        }
      }, labelDelay);

      const msgTimer = setTimeout(() => {
        if (!pausedRef.current) {
          setMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              ...step.message,
            },
          ]);
          if (!nextStep) {
            setTypingLabel(null);
            setIsRunning(false);
          }
        }
      }, step.delay);

      timerRefs.current.push(labelTimer, msgTimer);
    });
  }, []);

  const handleSubmit = () => {
    const text = input.trim() || (uploadedFile ? `Analyse file: ${uploadedFile}` : '');
    if (!text || isRunning) return;
    const flowKey = detectFlow(text);
    const label = flowKey === 'invoice' ? 'Invoice Processing'
      : flowKey === 'compliance' ? 'Compliance Audit'
        : flowKey === 'hr' ? 'HR Onboarding'
          : 'General Execution';
    setInput('');
    setUploadedFile(null);
    runDemo(flowKey, label);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handlePause = () => {
    pausedRef.current = !pausedRef.current;
    setIsPaused(p => !p);
  };

  const handleRetry = () => {
    if (!activeWorkflow) return;
    const flowKey = Object.entries({ invoice: 'Invoice Processing', compliance: 'Compliance Audit', hr: 'HR Onboarding' }).find(([, v]) => v === activeWorkflow)?.[0] || 'default';
    runDemo(flowKey, activeWorkflow);
  };

  const handleClear = () => {
    clearTimers();
    setMessages([]);
    setIsRunning(false);
    setIsPaused(false);
    setTypingLabel(null);
    setActiveWorkflow(null);
  };

  const filteredMessages = filterType === 'all' ? messages : messages.filter(m => m.type === filterType);

  // ─── Render Message Block ──────────────────────────────────────────────────

  const renderMessage = (msg: CommandMessage) => {
    const color = TYPE_COLOR[msg.type];
    const bg = TYPE_BG[msg.type];
    const border = TYPE_BORDER[msg.type];
    const icon = TYPE_ICON[msg.type];
    const isRunningMsg = msg.type === 'running';

    const suggestionParts = msg.suggestion?.split(' · ') || [];

    return (
      <div
        key={msg.id}
        style={{
          borderLeft: `3px solid ${color}`,
          borderTop: `1px solid ${border}`,
          borderRight: `1px solid ${border}`,
          borderBottom: `1px solid ${border}`,
          borderRadius: '0 6px 6px 0',
          background: bg,
          marginBottom: 10,
          overflow: 'hidden',
          animation: 'slideIn 180ms ease',
        }}
      >
        {/* Row: header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: `1px solid ${border}` }}>
          <span style={{
            fontSize: 13,
            color,
            flexShrink: 0,
            animation: isRunningMsg ? 'spin 1.4s linear infinite' : undefined,
            display: 'inline-block',
          }}>
            {icon}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1 }}>
            {msg.status}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {msg.metadata?.workflow && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border)' }}>
                {msg.metadata.workflow}
              </span>
            )}
            {msg.metadata?.node && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border)' }}>
                {msg.metadata.node}
              </span>
            )}
            {msg.metadata?.timeTaken !== undefined && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', padding: '2px 7px', borderRadius: 4, background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                {msg.metadata.timeTaken}s
              </span>
            )}
            {msg.metadata?.confidence !== undefined && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: TYPE_COLOR.success, padding: '2px 7px', borderRadius: 4, border: `1px solid ${TYPE_BORDER.success}`, background: TYPE_BG.success }}>
                {Math.round(msg.metadata.confidence * 100)}% conf
              </span>
            )}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
              {formatTs(msg.timestamp)}
            </span>
          </div>
        </div>

        {/* Row: action */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', borderBottom: `1px solid ${border}` }}>
          <div style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', borderRight: `1px solid ${border}`, display: 'flex', alignItems: 'center' }}>
            ACTION
          </div>
          <div style={{ padding: '9px 14px', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {msg.metadata?.agent && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--status-info)', marginRight: 8, padding: '1px 6px', borderRadius: 3, border: '1px solid var(--cc-info-border)', background: 'var(--cc-info-bg)' }}>
                {msg.metadata.agent}
              </span>
            )}
            {msg.action}
          </div>
        </div>

        {/* Row: suggestion */}
        {msg.suggestion && (
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr' }}>
            <div style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', borderRight: `1px solid ${border}`, display: 'flex', alignItems: 'center' }}>
              NEXT
            </div>
            <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {suggestionParts.length > 1 ? (
                suggestionParts.map((part, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (part.toLowerCase().includes('audit')) navigate('/audit');
                      else if (part.toLowerCase().includes('workflow')) navigate('/workflows');
                      else if (part.toLowerCase().includes('payment')) navigate('/approvals');
                    }}
                    style={{
                      height: 26, padding: '0 10px', borderRadius: 4,
                      border: `1px solid ${border}`,
                      background: 'transparent', color, fontSize: 11,
                      fontFamily: 'var(--font-mono)', cursor: 'pointer',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = bg; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {part}
                  </button>
                ))
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{msg.suggestion}</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── System State Panel ────────────────────────────────────────────────────

  const renderSystemPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%', overflow: 'hidden' }}>

      {/* Stats */}
      <div>
        <div style={panelLabel}>System State</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { k: 'Agents',      v: systemSnapshot.activeAgents, color: systemSnapshot.activeAgents > 0 ? TYPE_COLOR.success : 'var(--text-muted)' },
            { k: 'Workflows',   v: systemSnapshot.workflowCount, color: TYPE_COLOR.info },
            { k: 'Errors',      v: failedToday, color: failedToday > 0 ? TYPE_COLOR.error : 'var(--text-muted)' },
            { k: 'Approvals',   v: pendingApprovals, color: pendingApprovals > 0 ? TYPE_COLOR.warning : 'var(--text-muted)' },
          ].map(s => (
            <div key={s.k} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', background: 'var(--bg-input)' }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.k}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1.2, marginTop: 2 }}>{s.v}</div>
            </div>
          ))}
        </div>
        {criticalAlerts > 0 && (
          <div style={{ marginTop: 6, padding: '7px 10px', borderRadius: 6, border: `1px solid ${TYPE_BORDER.error}`, background: TYPE_BG.error, fontSize: 11, color: TYPE_COLOR.error }}>
            ✖ {criticalAlerts} critical alert{criticalAlerts > 1 ? 's' : ''} require attention
          </div>
        )}
      </div>

      {/* Active Workflows */}
      {activeWfs.length > 0 && (
        <div>
          <div style={panelLabel}>Active Workflows</div>
          <div style={{ display: 'grid', gap: 5 }}>
            {activeWfs.slice(0, 5).map((wf, i) => (
              <div key={wf.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 5, border: `1px solid ${TYPE_BORDER.success}`, background: TYPE_BG.success }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: TYPE_COLOR.success, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wf.name || 'Untitled'}</span>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{wf.category || 'ops'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Agents */}
      {activeAgentList.length > 0 && (
        <div>
          <div style={panelLabel}>Live Agents</div>
          <div style={{ display: 'grid', gap: 5 }}>
            {activeAgentList.slice(0, 6).map(a => {
              const st = agentStates[a.id];
              const dotColor = st?.status === 'processing' ? TYPE_COLOR.running : TYPE_COLOR.success;
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-input)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: dotColor, flexShrink: 0, boxShadow: st?.status === 'processing' ? `0 0 6px ${dotColor}` : 'none' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: dotColor, textTransform: 'uppercase' }}>{st?.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Start */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={panelLabel}>Quick Runs</div>
        <div style={{ display: 'grid', gap: 5 }}>
          {[
            { label: 'Invoice Processing', key: 'invoice', icon: '⊘' },
            { label: 'Compliance Audit',   key: 'compliance', icon: '◈' },
            { label: 'HR Onboarding',      key: 'hr', icon: '◎' },
          ].map(q => (
            <button
              key={q.key}
              onClick={() => { if (!isRunning) runDemo(q.key, q.label); }}
              disabled={isRunning}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 5, border: '1px solid var(--border)',
                background: 'var(--cc-surface-1)', color: isRunning ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontSize: 12, cursor: isRunning ? 'not-allowed' : 'pointer',
                textAlign: 'left', width: '100%',
              }}
              onMouseEnter={e => { if (!isRunning) e.currentTarget.style.background = 'var(--bg-tile-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--cc-surface-1)'; }}
            >
              <span style={{ color: TYPE_COLOR.info, fontSize: 13 }}>{q.icon}</span>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation shortcuts */}
      <div>
        <div style={panelLabel}>Navigate</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {[
            { label: 'Audit',     path: '/audit' },
            { label: 'Approvals', path: '/approvals' },
            { label: 'Agents',    path: '/agents' },
            { label: 'Workflows', path: '/workflows' },
          ].map(n => (
            <button
              key={n.path}
              onClick={() => navigate(n.path)}
              style={{
                height: 28, borderRadius: 4, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-muted)',
                fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-input)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const panelLabel: React.CSSProperties = {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 8,
  };

  const FILTER_TYPES: Array<MsgType | 'all'> = ['all', 'running', 'success', 'warning', 'error', 'info'];

  // ── Stats bar for console header ──
  const completedCount = messages.filter(m => m.type === 'success').length;
  const warningCount   = messages.filter(m => m.type === 'warning').length;
  const errorCount     = messages.filter(m => m.type === 'error').length;

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        .cmd-input:focus { border-color: var(--status-info) !important; outline: none; }
      `}</style>

      <div style={{
        height: '100%',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 260px',
        gridTemplateRows: '100%',
        background: 'var(--bg-base)',
        overflow: 'hidden',
      }}>

        {/* ── LEFT: Console ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          borderRight: '1px solid var(--border)',
        }}>

          {/* Console Header */}
          <div style={{
            flexShrink: 0,
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(180deg, rgba(6,182,212,0.06) 0%, transparent 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 999,
                    background: isRunning && !isPaused ? TYPE_COLOR.running : messages.length > 0 ? TYPE_COLOR.success : 'var(--text-muted)',
                    boxShadow: isRunning && !isPaused ? `0 0 8px ${TYPE_COLOR.running}` : 'none',
                    animation: isRunning && !isPaused ? 'blink 1.2s ease infinite' : 'none',
                    flexShrink: 0,
                  }} />
                  NIYANTA COMMAND CONSOLE
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {activeWorkflow
                    ? `▸ ${activeWorkflow} ${isPaused ? '· PAUSED' : isRunning ? '· EXECUTING' : '· COMPLETE'}`
                    : 'Awaiting command input'}
                </div>
              </div>
            </div>

            {/* Stats + Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {messages.length > 0 && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: TYPE_COLOR.success, padding: '3px 8px', borderRadius: 4, border: `1px solid ${TYPE_BORDER.success}`, background: TYPE_BG.success }}>✔ {completedCount}</span>
                  {warningCount > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: TYPE_COLOR.warning, padding: '3px 8px', borderRadius: 4, border: `1px solid ${TYPE_BORDER.warning}`, background: TYPE_BG.warning }}>⚠ {warningCount}</span>}
                  {errorCount > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: TYPE_COLOR.error, padding: '3px 8px', borderRadius: 4, border: `1px solid ${TYPE_BORDER.error}`, background: TYPE_BG.error }}>✖ {errorCount}</span>}
                </div>
              )}
              {isRunning && (
                <button
                  onClick={handlePause}
                  style={{ height: 28, padding: '0 12px', borderRadius: 4, border: `1px solid ${TYPE_BORDER.warning}`, background: TYPE_BG.warning, color: TYPE_COLOR.warning, fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.07em' }}
                >
                  {isPaused ? '▶ Resume' : '⏸ Pause'}
                </button>
              )}
              {messages.length > 0 && !isRunning && (
                <button
                  onClick={handleRetry}
                  style={{ height: 28, padding: '0 12px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.07em' }}
                >
                  ↺ Retry
                </button>
              )}
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  style={{ height: 28, padding: '0 12px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.07em' }}
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter bar */}
          {messages.length > 0 && (
            <div style={{
              flexShrink: 0,
              display: 'flex',
              gap: 4,
              padding: '8px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-dock)',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'center', marginRight: 4 }}>Filter:</span>
              {FILTER_TYPES.map(ft => (
                <button
                  key={ft}
                  onClick={() => setFilterType(ft)}
                  style={{
                    height: 22, padding: '0 9px', borderRadius: 3, fontSize: 9,
                    fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em',
                    cursor: 'pointer',
                    border: filterType === ft
                      ? `1px solid ${ft === 'all' ? 'var(--border)' : TYPE_BORDER[ft]}`
                      : '1px solid transparent',
                    background: filterType === ft
                      ? ft === 'all' ? 'var(--bg-input)' : TYPE_BG[ft]
                      : 'transparent',
                    color: filterType === ft
                      ? ft === 'all' ? 'var(--text-secondary)' : TYPE_COLOR[ft]
                      : 'var(--text-muted)',
                  }}
                >
                  {ft === 'all' ? `All (${messages.length})` : ft}
                </button>
              ))}
            </div>
          )}

          {/* Message Stream */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
          }}>
            {messages.length === 0 && !isRunning ? (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
                color: 'var(--text-muted)',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 48, opacity: 0.15, marginBottom: 16, lineHeight: 1 }}>◉</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Niyanta Command Console
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 20, lineHeight: 1.7 }}>
                    Type a task below or click a Quick Run to start execution.<br />
                    The system will walk through each step in real time.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 480, margin: '0 auto', textAlign: 'left' }}>
                    {[
                      { t: '"Process invoice from Zenith Supplies"', icon: '⊘' },
                      { t: '"Run compliance check for current workflows"', icon: '◈' },
                      { t: '"Onboard new employee John Smith"', icon: '◎' },
                      { t: '"Validate HR policy documentation"', icon: '⇢' },
                    ].map(ex => (
                      <button
                        key={ex.t}
                        onClick={() => { setInput(ex.t.replace(/"/g, '')); }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 5,
                          border: '1px solid var(--border)',
                          background: 'var(--cc-surface-1)',
                          color: 'var(--text-muted)',
                          fontSize: 11,
                          textAlign: 'left',
                          cursor: 'pointer',
                          lineHeight: 1.5,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-input)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--cc-surface-1)'; }}
                      >
                        <span style={{ color: TYPE_COLOR.info, marginRight: 6 }}>{ex.icon}</span>{ex.t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {filteredMessages.map(renderMessage)}

                {/* Typing indicator */}
                {typingLabel && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderLeft: `3px solid ${TYPE_COLOR.running}`,
                    border: `1px solid ${TYPE_BORDER.running}`,
                    borderRadius: '0 6px 6px 0',
                    background: TYPE_BG.running,
                    marginBottom: 10,
                  }}>
                    <span style={{ color: TYPE_COLOR.running, fontSize: 12, animation: 'blink 0.8s ease infinite' }}>⏳</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: TYPE_COLOR.running }}>{typingLabel}</span>
                  </div>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            flexShrink: 0,
            borderTop: '1px solid var(--border)',
            padding: '12px 20px',
            background: 'var(--bg-dock)',
            display: 'grid',
            gap: 10,
          }}>
            {uploadedFile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 5, border: `1px solid ${TYPE_BORDER.info}`, background: TYPE_BG.info }}>
                <span style={{ color: TYPE_COLOR.info, fontSize: 11, fontFamily: 'var(--font-mono)' }}>⤴ {uploadedFile}</span>
                <button onClick={() => setUploadedFile(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11 }}>✕</button>
              </div>
            )}

            {/* Control bar */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>CONTROLS:</span>
              {[
                { label: 'Pause Workflow',     action: handlePause,           active: isRunning },
                { label: 'Retry Node',         action: handleRetry,           active: messages.length > 0 && !isRunning },
                { label: 'Override Decision',  action: () => navigate('/approvals'), active: true },
              ].map(btn => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  disabled={!btn.active}
                  style={{
                    height: 24, padding: '0 10px', borderRadius: 3,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: btn.active ? 'var(--text-secondary)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)', fontSize: 9,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    cursor: btn.active ? 'pointer' : 'not-allowed',
                  }}
                  onMouseEnter={e => { if (btn.active) { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = btn.active ? 'var(--text-secondary)' : 'var(--text-muted)'; }}
                >
                  {btn.label}
                </button>
              ))}
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setUploadedFile(f.name); e.target.value = ''; }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ marginLeft: 'auto', height: 24, padding: '0 10px', borderRadius: 3, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.07em', cursor: 'pointer' }}
              >
                ⤴ Attach File
              </button>
            </div>

            {/* Text input */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                className="cmd-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter task, workflow command, or describe what to execute..."
                rows={2}
                disabled={isRunning && !isPaused}
                style={{
                  flex: 1, minHeight: 50, maxHeight: 100,
                  padding: '10px 14px', borderRadius: 5,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: 13, lineHeight: 1.5, resize: 'none',
                  fontFamily: 'var(--font-body)',
                  opacity: isRunning && !isPaused ? 0.5 : 1,
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={isRunning && !isPaused}
                style={{
                  height: 50, padding: '0 20px', borderRadius: 5,
                  border: `1px solid ${input.trim() || uploadedFile ? TYPE_BORDER.info : 'var(--border)'}`,
                  background: input.trim() || uploadedFile ? 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.15))' : 'var(--bg-input)',
                  color: input.trim() || uploadedFile ? TYPE_COLOR.info : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: '0.09em',
                  cursor: isRunning && !isPaused ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                }}
              >
                {isRunning && !isPaused ? 'Running…' : '▶ Execute'}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: System Panel ── */}
        <div style={{
          padding: '16px 14px',
          overflowY: 'auto',
          background: 'var(--bg-dock)',
        }}>
          {renderSystemPanel()}
        </div>
      </div>
    </>
  );
};

export default NiyantaCommandConsole;
