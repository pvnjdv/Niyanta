import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NiyantaChatSession } from '../../hooks/useNiyantaChat';
import { extractNiyantaFiles } from '../../services/api';
import {
  ChatMessage,
  ExtractedFileAttachment,
  NiyantaActivityItem,
  NiyantaReportCard,
} from '../../types/message';
import { Agent, AgentState } from '../../types/agent';

interface NiyantaChatWorkspaceProps {
  variant: 'regular' | 'command';
  title: string;
  subtitle: string;
  messages: ChatMessage[];
  isSending: boolean;
  liveActivity: NiyantaActivityItem[];
  onSend: (message: string, attachments?: ExtractedFileAttachment[]) => Promise<void>;
  onNewChat: () => void;
  historySessions: NiyantaChatSession[];
  onRestoreHistory: (sessionId: string) => void;
  onDeleteHistory: (sessionId: string) => void;
  systemSnapshot: {
    activeAgents: number;
    workflowCount: number;
    auditCount: number;
    decisionCount: number;
  };
  agents?: Agent[];
  agentStates?: Record<string, AgentState>;
  workflows?: Array<{ id?: string; name?: string; status?: string; category?: string; updated_at?: string }>;
  metrics?: Record<string, unknown>;
}

const toneStyles: Record<string, React.CSSProperties> = {
  info: { color: 'var(--status-info)', borderColor: 'var(--cc-info-border)', background: 'var(--cc-info-bg)' },
  success: { color: 'var(--status-success)', borderColor: 'var(--cc-ok-border)', background: 'var(--cc-ok-bg)' },
  warning: { color: 'var(--status-warning)', borderColor: 'var(--cc-warn-border)', background: 'var(--cc-warn-bg)' },
  danger: { color: 'var(--status-danger)', borderColor: 'var(--cc-danger-border)', background: 'var(--cc-danger-bg)' },
};

function formatFileSize(size: number): string {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

const NiyantaChatWorkspace: React.FC<NiyantaChatWorkspaceProps> = ({
  variant,
  title,
  subtitle,
  messages,
  isSending,
  liveActivity,
  onSend,
  onNewChat,
  historySessions,
  onRestoreHistory,
  onDeleteHistory,
  systemSnapshot,
  agents = [],
  agentStates = {},
  workflows = [],
  metrics = {},
}) => {
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<ExtractedFileAttachment[]>([]);
  const [isExtractingFiles, setIsExtractingFiles] = useState(false);
  const [activeCommandTab, setActiveCommandTab] = useState<'analysis' | 'control' | 'reports'>('analysis');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const latestAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant') || null,
    [messages]
  );

  const m = metrics as Record<string, unknown>;
  const toNum = (v: unknown, fallback = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };
  const failedToday = toNum(m.failedToday, 0);
  const criticalAlerts = toNum(m.criticalAlerts, 0);
  const pendingApprovals = toNum(m.pendingApprovals, 0);
  const totalRuns = toNum(m.totalWorkflowsRun ?? m.totalRuns, workflows.length);
  const avgMs = toNum(m.avgProcessingTimeMs, 1200);

  const agentList = useMemo(() => agents.slice(0, 10).map(a => ({
    name: a.name,
    id: a.id,
    status: agentStates[a.id]?.status || 'idle',
    hasResult: !!agentStates[a.id]?.result,
  })), [agents, agentStates]);

  const activeWorkflows = useMemo(() => workflows.filter(w => w.status === 'active').slice(0, 6), [workflows]);

  const commandPromptGroups = {
    analysis: [
      'Summarize overall system health, active agents, and any critical signals.',
      'Which workflows have the highest failure rate and what causes them?',
      'Compare agent performance over the last 24 hours and flag anomalies.',
      'What are the top 3 risks in the current operation pipeline?',
    ],
    control: [
      'List all pending approvals with amounts, owners, and priority.',
      'Which agents are blocked or in error state right now?',
      'Show workflows that need immediate operator intervention.',
      'What actions can I take to resolve the current bottlenecks?',
    ],
    reports: [
      'Generate a full audit summary for the current period.',
      'Create a decision log report grouped by agent and outcome.',
      'Summarize uploaded file contents and flag compliance issues.',
      'Produce an executive briefing on system performance and decisions.',
    ],
  };

  const quickPrompts = variant === 'command'
    ? commandPromptGroups[activeCommandTab]
    : [
        'Summarize the latest workflow and audit state.',
        'What changed across agents in the last few runs?',
        'Which actions need human approval right now?',
      ];

  const fallbackReports = useMemo<NiyantaReportCard[]>(() => [
    {
      id: 'fallback-agents',
      title: 'Active Agents',
      value: String(systemSnapshot.activeAgents),
      detail: 'Live specialist agents reporting into Niyanta.',
      tone: systemSnapshot.activeAgents > 0 ? 'success' : 'warning',
    },
    {
      id: 'fallback-workflows',
      title: 'Workflows',
      value: String(systemSnapshot.workflowCount),
      detail: 'Published and draft workflows available for orchestration.',
      tone: systemSnapshot.workflowCount > 0 ? 'info' : 'warning',
    },
    {
      id: 'fallback-audit',
      title: 'Audit Events',
      value: String(systemSnapshot.auditCount),
      detail: 'Recent control-plane events available for traceability.',
      tone: systemSnapshot.auditCount > 0 ? 'info' : 'warning',
    },
    {
      id: 'fallback-decisions',
      title: 'Decisions',
      value: String(systemSnapshot.decisionCount),
      detail: 'Decision output available for operator review.',
      tone: systemSnapshot.decisionCount > 0 ? 'success' : 'info',
    },
  ], [systemSnapshot]);

  const displayedReports = latestAssistantMessage?.reports && latestAssistantMessage.reports.length > 0
    ? latestAssistantMessage.reports
    : fallbackReports;
  const displayedActivity = liveActivity.length > 0
    ? liveActivity
    : latestAssistantMessage?.activity || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, displayedActivity, uploadedFiles]);

  const handleSend = async (presetMessage?: string) => {
    const text = (presetMessage ?? input).trim();
    if ((!text && uploadedFiles.length === 0) || isSending) return;

    const attachments = uploadedFiles;
    setInput('');
    setUploadedFiles([]);
    await onSend(text, attachments);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).slice(0, 4);
    if (files.length === 0) return;

    setIsExtractingFiles(true);
    try {
      const extracted = await extractNiyantaFiles(files);
      setUploadedFiles(extracted);
    } finally {
      setIsExtractingFiles(false);
      event.target.value = '';
    }
  };

  const headerBadge = (label: string, tone: keyof typeof toneStyles) => (
    <span style={{
      height: 24,
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0 10px',
      borderRadius: 999,
      border: '1px solid',
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      ...toneStyles[tone],
    }}>
      {label}
    </span>
  );

  const railCardStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    background: 'linear-gradient(180deg, var(--cc-panel-top), var(--cc-panel-bottom))',
    borderRadius: 14,
    padding: 14,
    minWidth: 0,
  };

  const renderAttachmentChip = (file: ExtractedFileAttachment) => (
    <div key={`${file.name}-${file.size}`} style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 9px',
      borderRadius: 10,
      border: '1px solid var(--border)',
      background: 'var(--cc-surface-1)',
      color: 'var(--text-secondary)',
      fontSize: 11,
    }}>
      <span style={{ color: file.extractionStatus === 'unsupported' ? 'var(--status-warning)' : 'var(--status-success)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
        {file.pageCount ? `PDF ${file.pageCount}p` : file.sheetNames && file.sheetNames.length > 0 ? `XLSX ${file.sheetNames.length}s` : 'FILE'}
      </span>
      <span>{file.name}</span>
      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{formatFileSize(file.size)}</span>
    </div>
  );

  const renderActivityStack = (items: NiyantaActivityItem[]) => (
    <div style={{ display: 'grid', gap: 5 }}>
      {items.map((item, idx) => (
        <div key={item.id + item.timestamp} style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 7,
          animation: `slideInBottom 220ms ease both`,
          animationDelay: `${idx * 60}ms`,
        }}>
          <span style={{ fontSize: 9, color: toneStyles[item.tone]?.color, flexShrink: 0, marginTop: 2 }}>›</span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: toneStyles[item.tone]?.color }}>{item.label}</span>
            {item.detail ? <span style={{ color: 'var(--text-muted)' }}> — {item.detail}</span> : null}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}
    </div>
  );

  const renderMessage = (message: ChatMessage, index: number) => {
    if (message.role === 'user') {
      return (
        <div key={`${message.timestamp}-${index}`} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ maxWidth: '78%', display: 'grid', gap: 8, justifyItems: 'end' }}>
            <div style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(6,182,212,0.22), rgba(59,130,246,0.18))',
              border: '1px solid var(--cc-info-border)',
              color: 'var(--text-primary)',
              fontSize: 13,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}>
              {message.content}
            </div>
            {message.attachments && message.attachments.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {message.attachments.map(renderAttachmentChip)}
              </div>
            )}
          </div>
        </div>
      );
    }

    const isError = message.content === 'Niyanta chat failed' || message.content.startsWith('Niyanta chat failed');
    return (
      <div key={`${message.timestamp}-${index}`} style={{ display: 'grid', gap: 6, animation: 'slideInBottom 260ms ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: isError ? 'var(--status-danger)' : 'var(--status-info)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {isError ? '⚠ Error' : (variant === 'command' ? '◎ Niyanta' : '◎ Niyanta')}
          </span>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div style={{
          color: isError ? 'var(--status-danger)' : 'var(--text-primary)',
          fontSize: 13,
          lineHeight: 1.75,
          whiteSpace: 'pre-wrap',
          paddingLeft: 2,
        }}>
          {message.content}
        </div>
        {message.activity && message.activity.length > 0 && (
          <div style={{ marginTop: 4, borderLeft: '1px solid var(--border)', paddingLeft: 10 }}>
            {renderActivityStack(message.activity)}
          </div>
        )}
      </div>
    );
  };

  const gridColumns = variant === 'command'
    ? '280px minmax(0, 1fr) 300px'
    : 'minmax(0, 1fr) 300px';

  const tabStyle = (active: boolean): React.CSSProperties => ({
    height: 28,
    padding: '0 12px',
    borderRadius: 6,
    border: active ? '1px solid var(--cc-info-border)' : '1px solid transparent',
    background: active ? 'var(--cc-info-bg)' : 'transparent',
    color: active ? 'var(--status-info)' : 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    cursor: 'pointer',
  });

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: variant === 'command' ? 20 : 16,
      background: 'radial-gradient(circle at 12% 0%, rgba(6,182,212,0.12), transparent 30%), radial-gradient(circle at 88% 0%, rgba(124,58,237,0.12), transparent 34%), var(--bg-base)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: variant === 'command' ? 30 : 26, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--status-info)', fontSize: variant === 'command' ? 26 : 22 }}>◎</span>
            {title}
            {variant === 'command' && (
              <span style={{ height: 22, display: 'inline-flex', alignItems: 'center', padding: '0 10px', borderRadius: 999, border: '1px solid var(--cc-ok-border)', background: 'var(--cc-ok-bg)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--status-success)', fontWeight: 700 }}>
                {systemSnapshot.activeAgents > 0 ? 'Online' : 'Standby'}
              </span>
            )}
          </div>
          <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 12 }}>{subtitle}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {variant === 'command' && (
            <>
              {criticalAlerts > 0 && (
                <span style={{ height: 24, display: 'inline-flex', alignItems: 'center', padding: '0 10px', borderRadius: 999, border: '1px solid var(--cc-danger-border)', background: 'var(--cc-danger-bg)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--status-danger)', fontWeight: 700 }}>
                  {criticalAlerts} Alert{criticalAlerts > 1 ? 's' : ''}
                </span>
              )}
              {pendingApprovals > 0 && (
                <span style={{ height: 24, display: 'inline-flex', alignItems: 'center', padding: '0 10px', borderRadius: 999, border: '1px solid var(--cc-warn-border)', background: 'var(--cc-warn-bg)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--status-warning)', fontWeight: 700 }}>
                  {pendingApprovals} Approval{pendingApprovals > 1 ? 's' : ''}
                </span>
              )}
              <span style={{ height: 24, display: 'inline-flex', alignItems: 'center', padding: '0 10px', borderRadius: 999, border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                {totalRuns} runs · {(avgMs / 1000).toFixed(1)}s avg
              </span>
            </>
          )}
          {headerBadge(`${historySessions.length} Sessions`, 'info')}
          <button onClick={onNewChat} style={{ height: 32, padding: '0 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--cc-surface-1)', color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
            + New Chat
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: gridColumns, gap: 12 }}>

        {/* LEFT RAIL — command only */}
        {variant === 'command' && (
          <aside style={{ ...railCardStyle, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>

            {/* System Stats */}
            <div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>System</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { label: 'Agents', value: systemSnapshot.activeAgents, tone: systemSnapshot.activeAgents > 0 ? 'var(--status-success)' : 'var(--text-muted)' },
                  { label: 'Workflows', value: systemSnapshot.workflowCount, tone: 'var(--status-info)' },
                  { label: 'Errors', value: failedToday, tone: failedToday > 0 ? 'var(--status-danger)' : 'var(--text-muted)' },
                  { label: 'Decisions', value: systemSnapshot.decisionCount, tone: 'var(--status-info)' },
                ].map(stat => (
                  <div key={stat.label} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', background: 'var(--bg-input)' }}>
                    <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: stat.tone, lineHeight: 1.2, marginTop: 2 }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Prompts with tabs */}
            <div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {(['analysis', 'control', 'reports'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveCommandTab(tab)} style={tabStyle(activeCommandTab === tab)}>
                    {tab}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    style={{
                      textAlign: 'left',
                      padding: '9px 11px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--cc-surface-1)',
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                      lineHeight: 1.5,
                      cursor: 'pointer',
                      transition: 'background 120ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tile-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--cc-surface-1)')}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Agent Status */}
            {agentList.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Agent Status</div>
                <div style={{ display: 'grid', gap: 5 }}>
                  {agentList.map(a => {
                    const dotColor = a.status === 'processing'
                      ? 'var(--status-info)'
                      : a.status === 'complete'
                        ? 'var(--status-success)'
                        : a.status === 'error'
                          ? 'var(--status-danger)'
                          : 'var(--text-muted)';
                    return (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 28, padding: '0 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)' }}>
                        <span style={{ width: 7, height: 7, borderRadius: 999, background: dotColor, flexShrink: 0, boxShadow: a.status === 'processing' ? `0 0 6px ${dotColor}` : 'none' }} />
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: dotColor, textTransform: 'uppercase' }}>{a.status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Tape */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Live Tape</div>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
                {displayedActivity.length > 0 ? renderActivityStack(displayedActivity.slice(0, 5)) : (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>Tape populates as Niyanta processes operations.</div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* CENTER — Chat */}
        <section style={{ ...railCardStyle, display: 'grid', gridTemplateRows: '1fr auto', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ overflowY: 'auto', paddingRight: 4, display: 'grid', gap: 14, alignContent: 'start' }}>
            {messages.length === 0 ? (
              <div style={{ minHeight: 340, display: 'grid', placeItems: 'center', textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>
                <div style={{ maxWidth: 500 }}>
                  <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>◎</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-primary)', marginBottom: 10 }}>
                    {variant === 'command' ? 'Niyanta Command Intelligence' : 'Niyanta AI Console'}
                  </div>
                  {variant === 'command' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16, textAlign: 'left' }}>
                      {[
                        { icon: '◈', label: 'Agent Ops', text: 'Run, inspect, and control all AI agents from one place' },
                        { icon: '⇢', label: 'Workflow Control', text: 'Monitor and trigger workflows with full audit trail' },
                        { icon: '⊘', label: 'Compliance', text: 'Query audit events and decision logs instantly' },
                        { icon: '⤴', label: 'File Analysis', text: 'Upload PDFs or spreadsheets for AI-powered extraction' },
                      ].map(cap => (
                        <div key={cap.label} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, background: 'var(--cc-surface-1)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{ color: 'var(--status-info)', fontSize: 14 }}>{cap.icon}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{cap.label}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{cap.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                      Ask about workflows, agents, risks, or upload files for analysis.
                    </div>
                  )}
                </div>
              </div>
            ) : messages.map(renderMessage)}

            {isSending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px', animation: 'fadeIn 200ms ease' }}>
                <span style={{ color: 'var(--status-info)', fontSize: 12, animation: 'pulse 1.3s infinite', fontFamily: 'var(--font-mono)' }}>◎</span>
                <span style={{ fontSize: 12, color: 'var(--status-info)', fontFamily: 'var(--font-mono)' }}>Niyanta is thinking…</span>
                {liveActivity.length > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    — {liveActivity[liveActivity.length - 1].label}
                  </span>
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'grid', gap: 8 }}>
            {uploadedFiles.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {uploadedFiles.map(renderAttachmentChip)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtractingFiles}
                style={{
                  width: 40, height: 40, borderRadius: 10, border: '1px solid var(--border)',
                  background: isExtractingFiles ? 'var(--cc-info-bg)' : 'var(--cc-surface-1)',
                  color: isExtractingFiles ? 'var(--status-info)' : uploadedFiles.length > 0 ? 'var(--status-success)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 16, flexShrink: 0,
                }}
                title="Attach files (PDF, Excel, etc.)"
              >
                {isExtractingFiles ? '…' : '⤴'}
              </button>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={variant === 'command'
                  ? 'Ask Niyanta to run agents, inspect risks, analyse files, or generate reports...'
                  : 'Ask Niyanta about workflows, agents, or upload a file...'
                }
                rows={2}
                style={{
                  flex: 1, minHeight: 52, maxHeight: 140, padding: '10px 14px',
                  borderRadius: 12, border: '1px solid var(--border)',
                  background: 'var(--bg-input)', color: 'var(--text-primary)',
                  fontSize: 13, lineHeight: 1.5, resize: 'none', outline: 'none',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={isSending || (!input.trim() && uploadedFiles.length === 0)}
                style={{
                  minWidth: 110, height: 40, borderRadius: 10,
                  border: '1px solid var(--cc-info-border)',
                  background: input.trim() || uploadedFiles.length > 0 ? 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(59,130,246,0.2))' : 'var(--cc-surface-1)',
                  color: input.trim() || uploadedFiles.length > 0 ? 'var(--status-info)' : 'var(--text-muted)',
                  cursor: input.trim() || uploadedFiles.length > 0 ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0,
                }}
              >
                {isSending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT RAIL */}
        <aside style={{ ...railCardStyle, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>

          {/* Control Snapshot */}
          <div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Control Snapshot</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {fallbackReports.map((report) => (
                <div key={report.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10, background: 'var(--cc-surface-1)' }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{report.title}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{report.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Workflows */}
          {variant === 'command' && activeWorkflows.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Active Workflows</div>
              <div style={{ display: 'grid', gap: 5 }}>
                {activeWorkflows.map((wf, i) => (
                  <div key={wf.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--cc-ok-border)', background: 'var(--cc-ok-bg)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--status-success)', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wf.name || 'Untitled'}</span>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{wf.category || 'ops'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Latest AI Briefing */}
          <div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Latest Briefing</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {displayedReports.map((report) => (
                <div key={report.id} style={{ border: '1px solid', borderColor: toneStyles[report.tone]?.borderColor, background: toneStyles[report.tone]?.background, borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: toneStyles[report.tone]?.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{report.title}</div>
                  <div style={{ marginTop: 4, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{report.value}</div>
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{report.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Archive */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Session Archive</div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 7, paddingRight: 4, alignContent: 'start' }}>
              {historySessions.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No archived sessions yet.</div>
              ) : historySessions.slice(0, 10).map((session) => (
                <div key={session.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', background: 'var(--cc-surface-1)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.title}</div>
                  <div style={{ marginTop: 3, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {new Date(session.timestamp).toLocaleDateString()} · {session.messages.length} msgs
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
                    <button onClick={() => onRestoreHistory(session.id)} style={{ flex: 1, height: 26, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}>
                      Restore
                    </button>
                    <button onClick={() => onDeleteHistory(session.id)} style={{ flex: 1, height: 26, borderRadius: 6, border: '1px solid var(--cc-danger-border)', background: 'var(--cc-danger-bg)', color: 'var(--status-danger)', fontSize: 11, cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default NiyantaChatWorkspace;