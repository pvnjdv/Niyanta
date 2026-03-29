import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Agent, AgentState } from '../types/agent';
import { ChatMessage, NiyantaActivityItem } from '../types/message';
import { NiyantaSystemContext, sendNiyantaMessage } from '../services/api';
import { readLocalStorage, writeLocalStorage } from '../utils/localStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NiyantaCommandConsoleProps {
  agents?: Agent[];
  agentStates?: Record<string, AgentState>;
  workflows?: Array<{ id?: string; name?: string; status?: string; category?: string; updated_at?: string }>;
  metrics?: Record<string, unknown>;
  systemSnapshot: {
    activeAgents: number;
    workflowCount: number;
    auditCount: number;
    decisionCount: number;
  };
  onExecuteAgent?: (agentId: string, input: string) => Promise<void>;
}

// ─── Agent routing hints ──────────────────────────────────────────────────────

const AGENT_KEYWORDS: Array<{ keywords: string[]; agentId: string; label: string }> = [
  { keywords: ['invoice', 'payment', 'finance', 'vendor', 'procurement', 'purchase'], agentId: 'finance-operations', label: 'Finance Operations Agent' },
  { keywords: ['compliance', 'gdpr', 'soc', 'audit', 'policy', 'regulation'], agentId: 'compliance', label: 'Compliance Agent' },
  { keywords: ['hr', 'onboard', 'employee', 'recruit', 'hire', 'training'], agentId: 'hr-operations', label: 'HR Operations Agent' },
  { keywords: ['it', 'security', 'access', 'incident', 'infrastructure', 'system'], agentId: 'it-operations', label: 'IT Operations Agent' },
  { keywords: ['meeting', 'calendar', 'agenda', 'minutes', 'schedule'], agentId: 'meeting-intelligence', label: 'Meeting Intelligence Agent' },
  { keywords: ['monitor', 'health', 'alert', 'uptime', 'performance'], agentId: 'monitoring', label: 'Monitoring Agent' },
  { keywords: ['workflow', 'automation', 'process', 'orchestrat'], agentId: 'workflow-intelligence', label: 'Workflow Intelligence Agent' },
];

function detectAgents(input: string): Array<{ agentId: string; label: string }> {
  const lc = input.toLowerCase();
  return AGENT_KEYWORDS.filter(({ keywords }) => keywords.some(k => lc.includes(k)));
}

const QUICK_PROMPTS = [
  { label: 'System health summary', icon: '◉', text: 'Give me a full system health summary — active agents, workflow status, and any critical signals.' },
  { label: 'Process an invoice', icon: '⊘', text: 'Process a new invoice from Zenith Supplies for ₹48,500. Validate, check compliance, and render a decision.' },
  { label: 'Run compliance check', icon: '◈', text: 'Run a compliance audit on the current workflows and check for GDPR or policy violations.' },
  { label: 'Onboard new employee', icon: '◎', text: 'Start HR onboarding for a new employee — provision accounts, assign training, and notify the manager.' },
  { label: 'Pending approvals', icon: '⇢', text: 'List all pending approvals with amounts, owners, priority, and recommended actions.' },
  { label: 'Cross-workflow risks', icon: '⚠', text: 'Identify cross-workflow dependencies and surface any risks in the current operation pipeline.' },
];

const STORAGE_KEY = 'niyanta-command-chat';

// ─── Tone colours ─────────────────────────────────────────────────────────────

const TONE_COLOR: Record<string, string> = {
  info:    'var(--status-info)',
  success: 'var(--status-success)',
  warning: 'var(--status-warning)',
  danger:  'var(--status-danger)',
};

// ─── Component ────────────────────────────────────────────────────────────────

const NiyantaCommandConsole: React.FC<NiyantaCommandConsoleProps> = ({
  agents = [],
  agentStates = {},
  workflows = [],
  metrics = {},
  systemSnapshot,
  onExecuteAgent,
}) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(() => readLocalStorage<ChatMessage[]>(STORAGE_KEY, []));
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [liveActivity, setLiveActivity] = useState<NiyantaActivityItem[]>([]);
  const [runningAgents, setRunningAgents] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const m = metrics as Record<string, unknown>;
  const toNum = (v: unknown, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
  const failedToday = toNum(m.failedToday, 0);
  const pendingApprovals = toNum(m.pendingApprovals, 0);
  const criticalAlerts = toNum(m.criticalAlerts, 0);
  const activeWfs = workflows.filter(w => w.status === 'active').slice(0, 6);
  const agentList = agents.slice(0, 10).map(a => ({
    id: a.id, name: a.name,
    status: agentStates[a.id]?.status || 'idle',
  }));

  useEffect(() => {
    writeLocalStorage(STORAGE_KEY, messages);
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveActivity]);

  const buildSystemContext = useCallback((): NiyantaSystemContext => ({
    generatedAt: new Date().toISOString(),
    agents: agents.map(a => ({
      id: a.id, name: a.name, capabilities: a.capabilities,
      status: agentStates[a.id]?.status || 'idle',
    })),
    workflows: workflows.slice(0, 24).map(w => ({
      id: w.id, name: w.name, category: w.category, status: w.status,
    })),
    metrics,
    auditTrail: [],
    reports: Object.entries(agentStates)
      .filter(([, s]) => s.result)
      .map(([agentId, s]) => ({
        agentId,
        summary: String((s.result as Record<string, unknown>)?.summary || ''),
        decision: (s.result as Record<string, unknown>)?.decision || null,
      })),
  }), [agents, agentStates, workflows, metrics]);

  const buildActivitySteps = useCallback((
    msg: string,
    matchedAgents: Array<{ agentId: string; label: string }>
  ): NiyantaActivityItem[] => {
    const now = Date.now();
    const steps: NiyantaActivityItem[] = [
      { id: 'intake', label: 'Command received', detail: `Parsing: ${msg.slice(0, 80)}${msg.length > 80 ? '…' : ''}`, tone: 'info', timestamp: new Date(now).toISOString() },
    ];
    if (matchedAgents.length > 0) {
      steps.push({ id: 'route', label: 'Agents identified', detail: matchedAgents.map(a => a.label).join(', '), tone: 'info', timestamp: new Date(now + 150).toISOString() });
      matchedAgents.forEach((a, i) => {
        steps.push({ id: `agent-${a.agentId}`, label: `${a.label} executing`, detail: 'Routing task and collecting result.', tone: 'success', timestamp: new Date(now + 300 + i * 100).toISOString() });
      });
    }
    steps.push({ id: 'compose', label: 'Niyanta composing response', detail: 'Synthesising agent results with control-plane context.', tone: 'success', timestamp: new Date(now + 500).toISOString() });
    return steps;
  }, []);

  const handleSend = useCallback(async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || isSending) return;

    setInput('');
    setIsSending(true);
    setLiveActivity([]);

    const timestamp = new Date().toISOString();
    setMessages(prev => [...prev, { role: 'user', content: text, timestamp }]);

    const matchedAgents = detectAgents(text);
    const pendingSteps = buildActivitySteps(text, matchedAgents);

    const timers = pendingSteps.map((step, idx) =>
      window.setTimeout(() => {
        setLiveActivity(prev => prev.some(p => p.id === step.id) ? prev : [...prev, step]);
      }, idx * 250)
    );

    try {
      if (matchedAgents.length > 0 && onExecuteAgent) {
        const ids = matchedAgents.map(a => a.agentId);
        setRunningAgents(ids);
        Promise.all(matchedAgents.map(a => onExecuteAgent(a.agentId, text).catch(() => null)))
          .finally(() => setRunningAgents([]));
      }

      const systemContext = buildSystemContext();
      const agentResults = Object.fromEntries(
        Object.entries(agentStates).filter(([, s]) => s.result).map(([k, s]) => [k, s.result])
      ) as Record<string, unknown>;

      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await sendNiyantaMessage(text, history, agentResults, systemContext);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.reply,
        timestamp: response.timestamp,
        activity: response.activity,
      }]);
      setLiveActivity(response.activity && response.activity.length > 0 ? response.activity : pendingSteps);
    } catch (err) {
      const failTs = new Date().toISOString();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Niyanta failed to respond. Check server connection.',
        timestamp: failTs,
      }]);
      setLiveActivity([...pendingSteps, {
        id: 'error',
        label: 'Response failed',
        detail: err instanceof Error ? err.message : 'Unknown error',
        tone: 'danger',
        timestamp: failTs,
      }]);
    } finally {
      timers.forEach(clearTimeout);
      setIsSending(false);
    }
  }, [input, isSending, messages, agentStates, buildSystemContext, buildActivitySteps, onExecuteAgent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClear = () => {
    setMessages([]);
    setLiveActivity([]);
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderActivityLine = (item: NiyantaActivityItem, idx: number) => (
    <div key={item.id + item.timestamp} style={{
      display: 'flex', alignItems: 'baseline', gap: 7,
      animation: 'slideIn 200ms ease both',
      animationDelay: `${idx * 50}ms`,
    }}>
      <span style={{ fontSize: 9, color: TONE_COLOR[item.tone] ?? 'var(--text-muted)', flexShrink: 0 }}>›</span>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        <span style={{ fontWeight: 600, color: TONE_COLOR[item.tone] ?? 'var(--text-muted)' }}>{item.label}</span>
        {item.detail ? <span style={{ color: 'var(--text-muted)' }}> — {item.detail}</span> : null}
      </span>
      <span style={{ marginLeft: 'auto', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );

  const renderMessage = (msg: ChatMessage, idx: number) => {
    if (msg.role === 'user') {
      return (
        <div key={`${msg.timestamp}-${idx}`} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            maxWidth: '80%', padding: '10px 14px', borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.15))',
            border: '1px solid rgba(6,182,212,0.25)',
            color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap',
            animation: 'slideIn 200ms ease both',
          }}>
            {msg.content}
          </div>
        </div>
      );
    }

    const isError = msg.content.startsWith('Niyanta failed') || msg.content.includes('chat failed');
    return (
      <div key={`${msg.timestamp}-${idx}`} style={{ display: 'grid', gap: 6, animation: 'slideIn 240ms ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: isError ? 'var(--status-danger)' : 'var(--status-info)' }}>
            {isError ? '⚠ Error' : '◎ Niyanta'}
          </span>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div style={{
          color: isError ? 'var(--status-danger)' : 'var(--text-primary)',
          fontSize: 13, lineHeight: 1.75, whiteSpace: 'pre-wrap', paddingLeft: 2,
        }}>
          {msg.content}
        </div>
        {msg.activity && msg.activity.length > 0 && (
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 10, marginTop: 2, display: 'grid', gap: 3 }}>
            {msg.activity.map((a, i) => renderActivityLine(a, i))}
          </div>
        )}
      </div>
    );
  };

  // ─── Panels ───────────────────────────────────────────────────────────────

  const panelLabel: React.CSSProperties = {
    fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
  };

  const renderLeftPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflow: 'hidden' }}>
      <div>
        <div style={panelLabel}>System</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { k: 'Agents',    v: systemSnapshot.activeAgents,  color: systemSnapshot.activeAgents > 0 ? 'var(--status-success)' : 'var(--text-muted)' },
            { k: 'Workflows', v: systemSnapshot.workflowCount, color: 'var(--status-info)' },
            { k: 'Errors',    v: failedToday,     color: failedToday > 0 ? 'var(--status-danger)' : 'var(--text-muted)' },
            { k: 'Approvals', v: pendingApprovals, color: pendingApprovals > 0 ? 'var(--status-warning)' : 'var(--text-muted)' },
          ].map(s => (
            <div key={s.k} style={{ border: '1px solid var(--border)', borderRadius: 7, padding: '8px 10px', background: 'var(--bg-input)' }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.k}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1.2, marginTop: 2 }}>{s.v}</div>
            </div>
          ))}
        </div>
        {criticalAlerts > 0 && (
          <div style={{ marginTop: 6, padding: '7px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', fontSize: 11, color: 'var(--status-danger)' }}>
            ⚠ {criticalAlerts} critical alert{criticalAlerts > 1 ? 's' : ''} active
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={panelLabel}>Quick Commands</div>
        <div style={{ display: 'grid', gap: 4, overflowY: 'auto' }}>
          {QUICK_PROMPTS.map(q => (
            <button key={q.label} onClick={() => handleSend(q.text)} disabled={isSending} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)',
              background: 'var(--cc-surface-1)', color: isSending ? 'var(--text-muted)' : 'var(--text-secondary)',
              fontSize: 11, cursor: isSending ? 'not-allowed' : 'pointer', textAlign: 'left', width: '100%',
              transition: 'background 120ms',
            }}
              onMouseEnter={e => { if (!isSending) e.currentTarget.style.background = 'var(--bg-tile-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--cc-surface-1)'; }}
            >
              <span style={{ color: 'var(--status-info)', fontSize: 12, flexShrink: 0 }}>{q.icon}</span>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={panelLabel}>Navigate</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {[{ label: 'Audit', path: '/audit' }, { label: 'Approvals', path: '/approvals' }, { label: 'Agents', path: '/agents' }, { label: 'Workflows', path: '/workflows' }].map(n => (
            <button key={n.path} onClick={() => navigate(n.path)} style={{
              height: 28, borderRadius: 5, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text-muted)',
              fontSize: 10, fontFamily: 'var(--font-mono)', cursor: 'pointer',
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

  const renderRightPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={panelLabel}>Live Tape</div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 4, alignContent: 'start' }}>
          {liveActivity.length > 0
            ? liveActivity.map((a, i) => renderActivityLine(a, i))
            : <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>Activity appears here as commands execute.</div>
          }
        </div>
      </div>

      {agentList.length > 0 && (
        <div>
          <div style={panelLabel}>Agent Status</div>
          <div style={{ display: 'grid', gap: 4 }}>
            {agentList.map(a => {
              const isActive = runningAgents.includes(a.id);
              const dotColor = (isActive || a.status === 'processing') ? 'var(--status-info)'
                : a.status === 'complete' ? 'var(--status-success)'
                : a.status === 'error' ? 'var(--status-danger)'
                : 'var(--text-muted)';
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 26, padding: '0 8px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--bg-input)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: dotColor, flexShrink: 0, boxShadow: (isActive || a.status === 'processing') ? `0 0 5px ${dotColor}` : 'none' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: dotColor, textTransform: 'uppercase' }}>{isActive ? 'running' : a.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeWfs.length > 0 && (
        <div>
          <div style={panelLabel}>Active Workflows</div>
          <div style={{ display: 'grid', gap: 4 }}>
            {activeWfs.map((wf, i) => (
              <div key={wf.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 26, padding: '0 8px', borderRadius: 5, border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.04)' }}>
                <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--status-success)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wf.name || 'Untitled'}</span>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{wf.category || 'ops'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        .cmd-input:focus   { border-color: var(--status-info) !important; outline: none; }
      `}</style>

      <div style={{
        height: '100%', display: 'grid',
        gridTemplateColumns: '260px minmax(0, 1fr) 260px',
        background: 'var(--bg-base)', overflow: 'hidden',
      }}>

        {/* LEFT */}
        <aside style={{ borderRight: '1px solid var(--border)', padding: '16px 14px', overflowY: 'auto', background: 'linear-gradient(180deg, var(--cc-panel-top), var(--cc-panel-bottom))' }}>
          {renderLeftPanel()}
        </aside>

        {/* CENTER */}
        <section style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{
            flexShrink: 0, padding: '14px 20px', borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(180deg, rgba(6,182,212,0.06), transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 8, height: 8, borderRadius: 999, flexShrink: 0,
                background: isSending ? 'var(--status-info)' : messages.length > 0 ? 'var(--status-success)' : 'var(--text-muted)',
                boxShadow: isSending ? '0 0 8px var(--status-info)' : 'none',
                animation: isSending ? 'pulse 1.2s ease infinite' : 'none',
              }} />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  Niyanta Command
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                  {isSending ? 'Executing command…' : messages.length > 0 ? `${messages.filter(m => m.role === 'assistant').length} response${messages.filter(m => m.role === 'assistant').length !== 1 ? 's' : ''}` : 'Awaiting command'}
                </div>
              </div>
            </div>
            {messages.length > 0 && !isSending && (
              <button onClick={handleClear} style={{
                height: 28, padding: '0 12px', borderRadius: 5, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', cursor: 'pointer',
              }}>✕ Clear</button>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'grid', gap: 16, alignContent: 'start' }}>
            {messages.length === 0 && !isSending ? (
              <div style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)', gap: 16 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 40, opacity: 0.12, lineHeight: 1 }}>◉</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-secondary)', letterSpacing: '0.06em', marginBottom: 6 }}>Niyanta Command Intelligence</div>
                  <div style={{ fontSize: 12, lineHeight: 1.7, maxWidth: 420 }}>
                    Type any operational command or pick a quick prompt.<br />
                    Niyanta will analyse your system, route to the right agents, and respond with a full report.
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 500, width: '100%', textAlign: 'left' }}>
                  {QUICK_PROMPTS.slice(0, 4).map(q => (
                    <button key={q.label} onClick={() => handleSend(q.text)} style={{
                      padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)',
                      background: 'var(--cc-surface-1)', color: 'var(--text-muted)', fontSize: 11,
                      textAlign: 'left', cursor: 'pointer', lineHeight: 1.5,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-input)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--cc-surface-1)'; }}
                    >
                      <span style={{ color: 'var(--status-info)', marginRight: 6 }}>{q.icon}</span>{q.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => renderMessage(msg, i))
            )}

            {isSending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 200ms ease' }}>
                <span style={{ color: 'var(--status-info)', fontSize: 12, animation: 'pulse 1.2s infinite', fontFamily: 'var(--font-mono)' }}>◎</span>
                <span style={{ fontSize: 12, color: 'var(--status-info)', fontFamily: 'var(--font-mono)' }}>
                  {liveActivity.length > 0 ? `${liveActivity[liveActivity.length - 1].label}…` : 'Niyanta is thinking…'}
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', padding: '12px 20px', background: 'var(--bg-dock)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                className="cmd-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a command — run agents, inspect risks, query compliance, generate reports…"
                rows={2}
                disabled={isSending}
                style={{
                  flex: 1, minHeight: 52, maxHeight: 120, padding: '10px 14px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)',
                  fontSize: 13, lineHeight: 1.5, resize: 'none', fontFamily: 'var(--font-body)',
                  opacity: isSending ? 0.5 : 1,
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={isSending || !input.trim()}
                style={{
                  height: 52, padding: '0 22px', borderRadius: 10,
                  border: `1px solid ${input.trim() ? 'rgba(6,182,212,0.4)' : 'var(--border)'}`,
                  background: input.trim() ? 'linear-gradient(135deg, rgba(6,182,212,0.22), rgba(59,130,246,0.18))' : 'var(--bg-input)',
                  color: input.trim() ? 'var(--status-info)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  cursor: input.trim() && !isSending ? 'pointer' : 'not-allowed',
                  flexShrink: 0,
                }}
              >
                {isSending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT */}
        <aside style={{ borderLeft: '1px solid var(--border)', padding: '16px 14px', overflowY: 'auto', background: 'linear-gradient(180deg, var(--cc-panel-top), var(--cc-panel-bottom))' }}>
          {renderRightPanel()}
        </aside>
      </div>
    </>
  );
};

export default NiyantaCommandConsole;
