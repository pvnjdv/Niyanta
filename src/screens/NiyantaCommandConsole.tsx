import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Agent, AgentState } from '../types/agent';
import { ChatMessage, ExtractedFileAttachment, NiyantaActivityItem } from '../types/message';
import { executeNiyantaCommand, extractNiyantaFiles, RunAgentResponse } from '../services/api';
import { readLocalStorage, writeLocalStorage } from '../utils/localStorage';

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
  onExecuteAgent?: (agentId: string, input: string) => Promise<RunAgentResponse | null>;
  onSyncState?: () => Promise<void>;
}

type RoutedAgent = { agentId: string; label: string };

const STORAGE_KEY = 'niyanta-command-chat';

const AGENT_KEYWORDS: Array<RoutedAgent & { keywords: string[] }> = [
  { agentId: 'document', label: 'Document Intelligence', keywords: ['document', 'pdf', 'file', 'attachment', 'extract'] },
  { agentId: 'invoice', label: 'Invoice Processor', keywords: ['invoice', 'bill', 'payment', 'gst', 'invoice number', 'po reference'] },
  { agentId: 'finance_ops', label: 'Finance Operations', keywords: ['finance', 'budget', 'payment', 'expense', 'amount', 'vendor'] },
  { agentId: 'procurement', label: 'Procurement', keywords: ['procurement', 'purchase order', 'purchase', 'vendor onboarding', 'quotation', 'laptops'] },
  { agentId: 'hr_ops', label: 'HR Operations', keywords: ['hr', 'employee', 'onboard', 'onboarding', 'joining date', 'induction'] },
  { agentId: 'it_ops', label: 'IT Operations', keywords: ['it', 'account', 'access', 'provision', 'system', 'incident'] },
  { agentId: 'compliance', label: 'Compliance', keywords: ['compliance', 'audit', 'policy', 'regulation', 'gdpr'] },
  { agentId: 'workflow', label: 'Workflow Intelligence', keywords: ['workflow', 'routing', 'process', 'orchestrate'] },
  { agentId: 'security', label: 'Security Monitor', keywords: ['security', 'threat', 'incident', 'breach'] },
  { agentId: 'meeting', label: 'Meeting Intelligence', keywords: ['meeting', 'minutes', 'transcript', 'agenda'] },
];

const TONE_COLOR: Record<string, string> = {
  info: 'var(--status-info)',
  success: 'var(--status-success)',
  warning: 'var(--status-warning)',
  danger: 'var(--status-danger)',
};

function normalizeText(input: string): string {
  return input.replace(/\s+/g, ' ').trim().toLowerCase();
}

function buildCombinedInput(input: string, attachments: ExtractedFileAttachment[]): string {
  const fileText = attachments
    .map((attachment) => attachment.textContent || attachment.excerpt || attachment.name)
    .join(' ');
  return normalizeText([input, fileText].filter(Boolean).join(' '));
}

function detectAgents(input: string, attachments: ExtractedFileAttachment[]): RoutedAgent[] {
  const combined = buildCombinedInput(input, attachments);
  const matches = AGENT_KEYWORDS.filter(({ keywords }) => keywords.some((keyword) => combined.includes(keyword)));

  if ((combined.includes('invoice') || attachments.some((attachment) => attachment.name.toLowerCase().includes('invoice'))) && !matches.some((match) => match.agentId === 'invoice')) {
    matches.push({ agentId: 'invoice', label: 'Invoice Processor', keywords: [] });
  }

  if (attachments.length > 0 && !matches.some((match) => match.agentId === 'document')) {
    matches.unshift({ agentId: 'document', label: 'Document Intelligence', keywords: [] });
  }

  const deduped = new Map<string, RoutedAgent>();
  matches.forEach((match) => {
    deduped.set(match.agentId, { agentId: match.agentId, label: match.label });
  });
  return Array.from(deduped.values());
}

function summarizeHistory(messages: ChatMessage[]) {
  const items: Array<{ id: string; command: string; outcome: string; timestamp: string }> = [];
  for (let index = 0; index < messages.length; index += 1) {
    const current = messages[index];
    if (current.role !== 'user') continue;
    const nextAssistant = messages.slice(index + 1).find((message) => message.role === 'assistant');
    items.push({
      id: `${current.timestamp}-${index}`,
      command: current.content || '(file attachment)',
      outcome: nextAssistant?.reports?.[1]?.value || nextAssistant?.content.split('\n')[0] || 'Pending outcome',
      timestamp: current.timestamp,
    });
  }
  return items.reverse().slice(0, 12);
}

const NiyantaCommandConsole: React.FC<NiyantaCommandConsoleProps> = ({
  agents = [],
  agentStates = {},
  workflows = [],
  metrics = {},
  systemSnapshot,
  onExecuteAgent,
  onSyncState,
}) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(() => readLocalStorage<ChatMessage[]>(STORAGE_KEY, []));
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [liveActivity, setLiveActivity] = useState<NiyantaActivityItem[]>([]);
  const [runningAgents, setRunningAgents] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const metricMap = metrics as Record<string, unknown>;
  const toNum = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const failedToday = toNum(metricMap.failedToday, 0);
  const pendingApprovals = toNum(metricMap.pendingApprovals, 0);
  const criticalAlerts = toNum(metricMap.criticalAlerts, 0);
  const recentRuns = Array.isArray(metricMap.recentRuns) ? (metricMap.recentRuns as Array<Record<string, unknown>>) : [];
  const historyItems = useMemo(() => summarizeHistory(messages), [messages]);

  useEffect(() => {
    writeLocalStorage(STORAGE_KEY, messages);
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveActivity]);

  const buildPendingActivity = useCallback((messageText: string, attachments: ExtractedFileAttachment[], matchedAgents: RoutedAgent[]) => {
    const now = Date.now();
    const items: NiyantaActivityItem[] = [
      {
        id: 'pending-intake',
        label: 'Input received',
        detail: messageText || attachments.map((attachment) => attachment.name).join(', '),
        tone: 'info',
        timestamp: new Date(now).toISOString(),
      },
    ];

    if (attachments.length > 0) {
      items.push({
        id: 'pending-files',
        label: 'File extraction complete',
        detail: `${attachments.length} attachment${attachments.length === 1 ? '' : 's'} ready for command analysis.`,
        tone: 'success',
        timestamp: new Date(now + 120).toISOString(),
      });
    }

    matchedAgents.forEach((agent, index) => {
      items.push({
        id: `pending-agent-${agent.agentId}`,
        label: 'Agent activated',
        detail: `${agent.label} is processing the command context.`,
        tone: 'info',
        timestamp: new Date(now + 220 + index * 90).toISOString(),
      });
    });

    items.push({
      id: 'pending-workflow',
      label: 'Scenario workflow starting',
      detail: 'Niyanta is preparing the end-to-end execution path.',
      tone: 'success',
      timestamp: new Date(now + 420).toISOString(),
    });

    return items;
  }, []);

  const handleSend = useCallback(async (preset?: string) => {
    const baseText = (preset ?? input).trim();
    if (!baseText && pendingFiles.length === 0) return;
    if (isSending || isExtracting) return;

    let attachments: ExtractedFileAttachment[] = [];
    let extractedText = '';

    if (pendingFiles.length > 0) {
      setIsExtracting(true);
      try {
        attachments = await extractNiyantaFiles(pendingFiles);
        extractedText = attachments
          .map((attachment) => attachment.textContent || attachment.excerpt || `File ${attachment.name}`)
          .filter(Boolean)
          .join('\n\n');
      } catch (error) {
        const failTs = new Date().toISOString();
        const detail = error instanceof Error ? error.message : 'Failed to extract file content';
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: detail,
          timestamp: failTs,
        }]);
        setLiveActivity([{
          id: 'extract-failed',
          label: 'File extraction failed',
          detail,
          tone: 'danger',
          timestamp: failTs,
        }]);
        setIsExtracting(false);
        return;
      }
      setIsExtracting(false);
    }

    const commandText = extractedText
      ? [baseText, extractedText].filter(Boolean).join('\n\n')
      : baseText;

    if (!commandText.trim()) {
      return;
    }

    const userTimestamp = new Date().toISOString();
    const userMessage: ChatMessage = {
      role: 'user',
      content: baseText || '(file attachment)',
      timestamp: userTimestamp,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const matchedAgents = detectAgents(commandText, attachments);
    const pendingActivity = buildPendingActivity(baseText || attachments.map((attachment) => attachment.name).join(', '), attachments, matchedAgents);
    const timers = pendingActivity.map((item, index) => window.setTimeout(() => {
      setLiveActivity((prev) => (prev.some((existing) => existing.id === item.id) ? prev : [...prev, item]));
    }, index * 180));

    setInput('');
    setPendingFiles([]);
    setIsSending(true);
    setLiveActivity([]);
    setMessages((prev) => [...prev, userMessage]);

    try {
      const agentResults = Object.fromEntries(
        Object.entries(agentStates)
          .filter(([, state]) => state.result)
          .map(([agentId, state]) => [agentId, state.result])
      ) as Record<string, unknown>;

      if (matchedAgents.length > 0 && onExecuteAgent) {
        const ids = matchedAgents.map((agent) => agent.agentId);
        setRunningAgents(ids);
        const responses = await Promise.all(
          matchedAgents.map(async (agent) => ({
            agentId: agent.agentId,
            response: await onExecuteAgent(agent.agentId, commandText),
          }))
        );

        responses.forEach(({ agentId, response }) => {
          if (response?.result) {
            agentResults[agentId] = response.result;
          }
        });
        setRunningAgents([]);
      }

      const history = [...messages, userMessage].map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const response = await executeNiyantaCommand(commandText, history, agentResults, attachments);

      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: response.reply,
        timestamp: response.timestamp,
        activity: response.activity,
        reports: response.reports,
      }]);
      setLiveActivity(response.activity && response.activity.length > 0 ? response.activity : pendingActivity);
      await onSyncState?.();
    } catch (error) {
      const failTs = new Date().toISOString();
      const detail = error instanceof Error ? error.message : 'Niyanta command failed';
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: detail,
        timestamp: failTs,
      }]);
      setLiveActivity([
        ...pendingActivity,
        {
          id: 'command-failed',
          label: 'Execution failed',
          detail,
          tone: 'danger',
          timestamp: failTs,
        },
      ]);
      await onSyncState?.();
    } finally {
      timers.forEach(window.clearTimeout);
      setRunningAgents([]);
      setIsSending(false);
    }
  }, [agentStates, buildPendingActivity, input, isExtracting, isSending, messages, onExecuteAgent, onSyncState, pendingFiles]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setLiveActivity([]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length === 0) return;
    setPendingFiles((prev) => {
      const existing = new Set(prev.map((file) => `${file.name}-${file.size}`));
      return [...prev, ...selected.filter((file) => !existing.has(`${file.name}-${file.size}`))].slice(0, 4);
    });
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dropped = Array.from(event.dataTransfer.files ?? []);
    if (dropped.length === 0) return;
    setPendingFiles((prev) => {
      const existing = new Set(prev.map((file) => `${file.name}-${file.size}`));
      return [...prev, ...dropped.filter((file) => !existing.has(`${file.name}-${file.size}`))].slice(0, 4);
    });
  };

  const renderActivityLine = (item: NiyantaActivityItem, index: number) => (
    <div
      key={`${item.id}-${item.timestamp}`}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        padding: '7px 0',
        borderBottom: index === liveActivity.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)',
        animation: 'slideIn 220ms ease both',
        animationDelay: `${index * 50}ms`,
      }}
    >
      <span style={{ fontSize: 9, color: TONE_COLOR[item.tone] ?? 'var(--text-muted)', flexShrink: 0 }}>›</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 11, color: TONE_COLOR[item.tone] ?? 'var(--text-primary)', fontWeight: 700, letterSpacing: '0.02em' }}>
          {item.label}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.55, marginTop: 2 }}>
          {item.detail}
        </div>
      </div>
      <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );

  const renderReportGrid = (msg: ChatMessage) => {
    if (!msg.reports || msg.reports.length === 0) return null;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 4 }}>
        {msg.reports.map((report) => (
          <div
            key={report.id}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 9,
              background: 'var(--bg-input)',
              padding: '10px 11px',
              minWidth: 0,
            }}
          >
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              {report.title}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: TONE_COLOR[report.tone] ?? 'var(--text-primary)', marginTop: 3 }}>
              {report.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4 }}>
              {report.detail}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAssistantMessage = (msg: ChatMessage, index: number) => {
    const isError = msg.content.startsWith('Niyanta failed') || msg.content.toLowerCase().includes('failed');
    return (
      <div key={`${msg.timestamp}-${index}`} style={{ display: 'grid', gap: 7, animation: 'slideIn 240ms ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: isError ? 'var(--status-danger)' : 'var(--status-info)' }}>
            {isError ? '⚠ Error' : '◎ Niyanta'}
          </span>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div style={{ color: isError ? 'var(--status-danger)' : 'var(--text-primary)', fontSize: 13, lineHeight: 1.72, whiteSpace: 'pre-wrap' }}>
          {msg.content}
        </div>
        {renderReportGrid(msg)}
        {msg.activity && msg.activity.length > 0 && (
          <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 10, display: 'grid', gap: 0 }}>
            {msg.activity.map((item, itemIndex) => renderActivityLine(item, itemIndex))}
          </div>
        )}
      </div>
    );
  };

  const renderUserMessage = (msg: ChatMessage, index: number) => (
    <div key={`${msg.timestamp}-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      {msg.attachments && msg.attachments.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {msg.attachments.map((attachment, attachmentIndex) => (
            <div
              key={`${attachment.name}-${attachmentIndex}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 9px',
                borderRadius: 6,
                border: '1px solid rgba(6,182,212,0.25)',
                background: 'rgba(6,182,212,0.07)',
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ fontSize: 12 }}>📎</span>
              <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.name}</span>
              {attachment.pageCount ? <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}>{attachment.pageCount}p</span> : null}
              {attachment.extractionStatus === 'unsupported' ? <span style={{ color: 'var(--status-warning)', fontSize: 9 }}>unsupported</span> : null}
            </div>
          ))}
        </div>
      )}
      {msg.content && msg.content !== '(file attachment)' && (
        <div
          style={{
            maxWidth: '80%',
            padding: '10px 14px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.15))',
            border: '1px solid rgba(6,182,212,0.25)',
            color: 'var(--text-primary)',
            fontSize: 13,
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
            animation: 'slideIn 200ms ease both',
          }}
        >
          {msg.content}
        </div>
      )}
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

  const renderLeftPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflow: 'hidden' }}>
      <div>
        <div style={panelLabel}>System</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { key: 'Agents', value: systemSnapshot.activeAgents, color: systemSnapshot.activeAgents > 0 ? 'var(--status-success)' : 'var(--text-muted)' },
            { key: 'Workflows', value: systemSnapshot.workflowCount, color: 'var(--status-info)' },
            { key: 'Errors', value: failedToday, color: failedToday > 0 ? 'var(--status-danger)' : 'var(--text-muted)' },
            { key: 'Approvals', value: pendingApprovals, color: pendingApprovals > 0 ? 'var(--status-warning)' : 'var(--text-muted)' },
          ].map((item) => (
            <div key={item.key} style={{ border: '1px solid var(--border)', borderRadius: 7, padding: '8px 10px', background: 'var(--bg-input)' }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.key}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: item.color, lineHeight: 1.2, marginTop: 2 }}>{item.value}</div>
            </div>
          ))}
        </div>
        {criticalAlerts > 0 && (
          <div style={{ marginTop: 6, padding: '7px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', fontSize: 11, color: 'var(--status-danger)' }}>
            {criticalAlerts} critical alert{criticalAlerts > 1 ? 's' : ''} active
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={panelLabel}>History</div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 5, alignContent: 'start' }}>
          {historyItems.length > 0 ? historyItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setInput(item.command === '(file attachment)' ? '' : item.command)}
              style={{
                padding: '9px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--cc-surface-1)',
                color: 'var(--text-secondary)',
                textAlign: 'left',
                cursor: 'pointer',
              }}
              onMouseEnter={(event) => { event.currentTarget.style.background = 'var(--bg-input)'; }}
              onMouseLeave={(event) => { event.currentTarget.style.background = 'var(--cc-surface-1)'; }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.command}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--status-info)' }}>{item.outcome}</span>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </button>
          )) : (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Command history appears here after the first run.
            </div>
          )}
        </div>
      </div>

      <div>
        <div style={panelLabel}>Navigate</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {[
            { label: 'Audit', path: '/audit' },
            { label: 'Approvals', path: '/approvals' },
            { label: 'Agents', path: '/agents' },
            { label: 'Workflows', path: '/workflows' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                height: 28,
                borderRadius: 5,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.color = 'var(--text-primary)';
                event.currentTarget.style.background = 'var(--bg-input)';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.color = 'var(--text-muted)';
                event.currentTarget.style.background = 'transparent';
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRightPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={panelLabel}>Live Tape</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: isSending ? 'var(--status-info)' : liveActivity.length > 0 ? 'var(--status-success)' : 'var(--text-muted)', boxShadow: isSending ? '0 0 8px var(--status-info)' : 'none', animation: isSending ? 'pulse 1.2s ease infinite' : 'none' }} />
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {isSending ? 'Command execution in progress' : liveActivity.length > 0 ? `${liveActivity.length} execution events captured` : 'Waiting for a command run'}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 0, alignContent: 'start' }}>
        {liveActivity.length > 0 ? liveActivity.map((item, index) => renderActivityLine(item, index)) : (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            The full execution tape appears here: input received, agent activation, node-by-node workflow steps, decision, and dashboard sync.
          </div>
        )}
      </div>
      {recentRuns.length > 0 && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Latest Run</div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {String(recentRuns[0].workflowName || recentRuns[0].workflowId || 'Workflow run')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            Status: {String(recentRuns[0].status || 'PENDING')}{recentRuns[0].currentNodeId ? ` · Node ${String(recentRuns[0].currentNodeId)}` : ''}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        .cmd-input:focus { border-color: var(--status-info) !important; outline: none; }
      `}</style>

      <div
        style={{
          height: '100%',
          display: 'grid',
          gridTemplateColumns: '260px minmax(0, 1fr) 300px',
          background: 'var(--bg-base)',
          overflow: 'hidden',
        }}
      >
        <aside style={{ borderRight: '1px solid var(--border)', padding: '16px 14px', overflowY: 'auto', background: 'linear-gradient(180deg, var(--cc-panel-top), var(--cc-panel-bottom))' }}>
          {renderLeftPanel()}
        </aside>

        <section style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div
            style={{
              flexShrink: 0,
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'linear-gradient(180deg, rgba(6,182,212,0.06), transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: isSending ? 'var(--status-info)' : messages.length > 0 ? 'var(--status-success)' : 'var(--text-muted)', boxShadow: isSending ? '0 0 8px var(--status-info)' : 'none', animation: isSending ? 'pulse 1.2s ease infinite' : 'none' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                  Niyanta Command
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                  {isSending ? `Executing with ${runningAgents.length || 1} active agent${runningAgents.length === 1 ? '' : 's'}...` : messages.length > 0 ? `${messages.filter((message) => message.role === 'assistant').length} response${messages.filter((message) => message.role === 'assistant').length !== 1 ? 's' : ''}` : 'Awaiting operational command'}
                </div>
              </div>
            </div>
            {messages.length > 0 && !isSending && (
              <button
                onClick={handleClear}
                style={{
                  height: 28,
                  padding: '0 12px',
                  borderRadius: 5,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  cursor: 'pointer',
                }}
              >
                ✕ Clear
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'grid', gap: 16, alignContent: 'start' }}>
            {messages.length === 0 && !isSending ? (
              <div style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)', gap: 16 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 40, opacity: 0.12, lineHeight: 1 }}>◉</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-secondary)', letterSpacing: '0.06em', marginBottom: 6 }}>Niyanta Command Intelligence</div>
                  <div style={{ fontSize: 12, lineHeight: 1.75, maxWidth: 520 }}>
                    Enter an operational command or upload a document. Niyanta will classify the input, activate the right agents, run the workflow, update the audit and approvals state, and return a structured execution report.
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => message.role === 'user' ? renderUserMessage(message, index) : renderAssistantMessage(message, index))
            )}

            {isSending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 200ms ease' }}>
                <span style={{ color: 'var(--status-info)', fontSize: 12, animation: 'pulse 1.2s infinite', fontFamily: 'var(--font-mono)' }}>◎</span>
                <span style={{ fontSize: 12, color: 'var(--status-info)', fontFamily: 'var(--font-mono)' }}>
                  {liveActivity.length > 0 ? `${liveActivity[liveActivity.length - 1].label}...` : 'Niyanta is executing the workflow...'}
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div
            style={{ flexShrink: 0, borderTop: '1px solid var(--border)', padding: '12px 20px', background: 'var(--bg-dock)' }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            {pendingFiles.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {pendingFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(6,182,212,0.3)',
                      background: 'rgba(6,182,212,0.09)',
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ fontSize: 12 }}>📎</span>
                    <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(0)}KB</span>
                    <button onClick={() => removeFile(index)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 2px', fontSize: 11, lineHeight: 1 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.md,.csv,.xlsx,.xls,.json,.log,.xml,.yml,.yaml,.ts,.tsx,.js,.jsx"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending || isExtracting || pendingFiles.length >= 4}
                title="Attach file (PDF, Excel, CSV, TXT, JSON...)"
                style={{
                  width: 40,
                  height: 52,
                  borderRadius: 10,
                  flexShrink: 0,
                  border: '1px solid var(--border)',
                  background: pendingFiles.length > 0 ? 'rgba(6,182,212,0.1)' : 'var(--bg-input)',
                  color: pendingFiles.length > 0 ? 'var(--status-info)' : 'var(--text-muted)',
                  fontSize: 17,
                  cursor: isSending || isExtracting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                📎
              </button>
              <textarea
                className="cmd-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a command or attach a file. Example: Process this invoice for Rs 48,000 from AWS."
                rows={2}
                disabled={isSending || isExtracting}
                style={{
                  flex: 1,
                  minHeight: 52,
                  maxHeight: 120,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  resize: 'none',
                  fontFamily: 'var(--font-body)',
                  opacity: isSending || isExtracting ? 0.5 : 1,
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={isSending || isExtracting || (!input.trim() && pendingFiles.length === 0)}
                style={{
                  height: 52,
                  padding: '0 22px',
                  borderRadius: 10,
                  border: `1px solid ${(input.trim() || pendingFiles.length > 0) ? 'rgba(6,182,212,0.4)' : 'var(--border)'}`,
                  background: (input.trim() || pendingFiles.length > 0) ? 'linear-gradient(135deg, rgba(6,182,212,0.22), rgba(59,130,246,0.18))' : 'var(--bg-input)',
                  color: (input.trim() || pendingFiles.length > 0) ? 'var(--status-info)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: (input.trim() || pendingFiles.length > 0) && !isSending && !isExtracting ? 'pointer' : 'not-allowed',
                  flexShrink: 0,
                }}
              >
                {isExtracting ? 'Reading...' : isSending ? 'Running...' : 'Run'}
              </button>
            </div>
          </div>
        </section>

        <aside style={{ borderLeft: '1px solid var(--border)', padding: '16px 14px', overflowY: 'auto', background: 'linear-gradient(180deg, var(--cc-panel-top), var(--cc-panel-bottom))' }}>
          {renderRightPanel()}
        </aside>
      </div>
    </>
  );
};

export default NiyantaCommandConsole;