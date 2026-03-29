import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NiyantaChatSession } from '../../hooks/useNiyantaChat';
import { extractNiyantaFiles } from '../../services/api';
import {
  ChatMessage,
  ExtractedFileAttachment,
  NiyantaActivityItem,
  NiyantaReportCard,
} from '../../types/message';

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
}) => {
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<ExtractedFileAttachment[]>([]);
  const [isExtractingFiles, setIsExtractingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const latestAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant') || null,
    [messages]
  );

  const quickPrompts = variant === 'command'
    ? [
        'Show the controlled path from input to workflow execution and audit logging.',
        'Summarize current risks, blocked approvals, and the next operator actions.',
        'Compare active agents, recent decisions, and the strongest failure signals.',
      ]
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
      title: 'Workflow Studio',
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
      title: 'Decisions Logged',
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
    <div style={{ display: 'grid', gap: 8 }}>
      {items.map((item) => (
        <div key={item.id + item.timestamp} style={{
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid',
          background: toneStyles[item.tone]?.background,
          borderColor: toneStyles[item.tone]?.borderColor,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: toneStyles[item.tone]?.color }}>{item.label}</span>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.detail}</div>
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

    return (
      <div key={`${message.timestamp}-${index}`} style={{ display: 'grid', gap: 10 }}>
        <div style={{
          border: '1px solid var(--border)',
          background: 'linear-gradient(180deg, rgba(12, 18, 28, 0.88), rgba(12, 18, 28, 0.72))',
          borderRadius: 16,
          padding: 16,
          boxShadow: 'var(--cc-panel-shadow)',
          display: 'grid',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {headerBadge(variant === 'command' ? 'Command Reply' : 'Niyanta Reply', 'info')}
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {new Date(message.timestamp).toLocaleString()}
            </span>
          </div>
          <div style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {message.content}
          </div>
          {message.reports && message.reports.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
              {message.reports.map((report) => (
                <div key={report.id} style={{
                  border: '1px solid',
                  borderRadius: 12,
                  padding: 12,
                  background: toneStyles[report.tone]?.background,
                  borderColor: toneStyles[report.tone]?.borderColor,
                }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: toneStyles[report.tone]?.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {report.title}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{report.value}</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{report.detail}</div>
                </div>
              ))}
            </div>
          )}
          {message.activity && message.activity.length > 0 && renderActivityStack(message.activity)}
        </div>
      </div>
    );
  };

  const gridColumns = variant === 'command'
    ? '260px minmax(0, 1fr) 320px'
    : 'minmax(0, 1fr) 320px';

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      padding: variant === 'command' ? 20 : 16,
      background: 'radial-gradient(circle at 12% 0%, rgba(6,182,212,0.12), transparent 30%), radial-gradient(circle at 88% 0%, rgba(124,58,237,0.12), transparent 34%), var(--bg-base)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: variant === 'command' ? 34 : 28, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-primary)' }}>
            {title}
          </div>
          <div style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 13 }}>{subtitle}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {headerBadge(`${historySessions.length} Sessions`, 'info')}
          {headerBadge(`${systemSnapshot.activeAgents} Agents`, systemSnapshot.activeAgents > 0 ? 'success' : 'warning')}
          <button
            onClick={onNewChat}
            style={{
              height: 34,
              padding: '0 14px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--cc-surface-1)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            New Chat
          </button>
        </div>
      </div>

      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: gridColumns,
        gap: 14,
      }}>
        {variant === 'command' && (
          <aside style={{ ...railCardStyle, display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 14, overflow: 'hidden' }}>
            <div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Quick Commands</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--cc-surface-1)',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      lineHeight: 1.5,
                      cursor: 'pointer',
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Live Tape</div>
              {displayedActivity.length > 0 ? renderActivityStack(displayedActivity.slice(0, 3)) : (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  The command tape will populate as soon as Niyanta starts processing.
                </div>
              )}
            </div>

            <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Recent Sessions</div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 8, paddingRight: 4 }}>
                {historySessions.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No saved sessions yet.</div>
                ) : historySessions.slice(0, 10).map((session) => (
                  <div key={session.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10, background: 'var(--cc-surface-1)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{session.title}</div>
                    <div style={{ marginTop: 4, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {new Date(session.timestamp).toLocaleString()} · {session.messages.length} msgs
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => onRestoreHistory(session.id)}
                        style={{ flex: 1, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => onDeleteHistory(session.id)}
                        style={{ flex: 1, height: 30, borderRadius: 8, border: '1px solid var(--cc-danger-border)', background: 'var(--cc-danger-bg)', color: 'var(--status-danger)', fontSize: 11, cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        <section style={{
          ...railCardStyle,
          display: 'grid',
          gridTemplateRows: '1fr auto auto',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <div style={{ overflowY: 'auto', paddingRight: 4, display: 'grid', gap: 14 }}>
            {messages.length === 0 ? (
              <div style={{
                minHeight: variant === 'command' ? 420 : 300,
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                padding: 24,
              }}>
                <div style={{ maxWidth: 520 }}>
                  <div style={{ fontSize: 42, marginBottom: 14 }}>◎</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--text-primary)', marginBottom: 8 }}>
                    {variant === 'command' ? 'Main Niyanta Command Workspace' : 'Niyanta AI Console'}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                    Ask for operational control, upload PDFs or spreadsheets, inspect reports, and keep the full control plane visible while Niyanta responds.
                  </div>
                </div>
              </div>
            ) : messages.map(renderMessage)}

            {isSending && (
              <div style={{ display: 'flex', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
                <span style={{ animation: 'pulse 1.3s infinite' }}>●</span>
                <span style={{ animation: 'pulse 1.3s infinite 0.2s' }}>●</span>
                <span style={{ animation: 'pulse 1.3s infinite 0.4s' }}>●</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {(displayedActivity.length > 0 ? displayedActivity : [{ id: 'idle', label: 'Standby', detail: 'Niyanta is ready for the next command.', tone: 'info', timestamp: new Date().toISOString() }]).map((item) => (
                <div key={item.id + item.timestamp} style={{
                  minWidth: 190,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid',
                  background: toneStyles[item.tone]?.background,
                  borderColor: toneStyles[item.tone]?.borderColor,
                }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: toneStyles[item.tone]?.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.detail}</div>
                </div>
              ))}
            </div>

            {uploadedFiles.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {uploadedFiles.map(renderAttachmentChip)}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtractingFiles}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: isExtractingFiles ? 'var(--cc-info-bg)' : 'var(--cc-surface-1)',
                  color: isExtractingFiles ? 'var(--status-info)' : uploadedFiles.length > 0 ? 'var(--status-success)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 18,
                  flexShrink: 0,
                }}
                title="Attach files"
              >
                {isExtractingFiles ? '…' : '⤴'}
              </button>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Niyanta to inspect agents, workflows, risks, reports, or uploaded files..."
                rows={2}
                style={{
                  flex: 1,
                  minHeight: 56,
                  maxHeight: 140,
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  resize: 'none',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={isSending || (!input.trim() && uploadedFiles.length === 0)}
                style={{
                  minWidth: 126,
                  height: 42,
                  borderRadius: 12,
                  border: '1px solid var(--cc-info-border)',
                  background: input.trim() || uploadedFiles.length > 0 ? 'var(--cc-info-bg)' : 'var(--cc-surface-1)',
                  color: input.trim() || uploadedFiles.length > 0 ? 'var(--status-info)' : 'var(--text-muted)',
                  cursor: input.trim() || uploadedFiles.length > 0 ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  flexShrink: 0,
                }}
              >
                {isSending ? 'Sending' : 'Send to Niyanta'}
              </button>
            </div>
          </div>
        </section>

        <aside style={{ ...railCardStyle, display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 14, overflow: 'hidden' }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Control Snapshot</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {fallbackReports.map((report) => (
                <div key={report.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12, background: 'var(--cc-surface-1)' }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{report.title}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 6 }}>{report.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 6 }}>{report.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Latest Briefing</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {displayedReports.map((report) => (
                <div key={report.id} style={{
                  border: '1px solid',
                  borderColor: toneStyles[report.tone]?.borderColor,
                  background: toneStyles[report.tone]?.background,
                  borderRadius: 12,
                  padding: 12,
                }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: toneStyles[report.tone]?.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{report.title}</div>
                  <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{report.value}</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{report.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Session Archive</div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 8, paddingRight: 4 }}>
              {historySessions.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No archived sessions yet.</div>
              ) : historySessions.slice(0, 8).map((session) => (
                <div key={session.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10, background: 'var(--cc-surface-1)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{session.title}</div>
                  <div style={{ marginTop: 4, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {new Date(session.timestamp).toLocaleDateString()} · {session.messages.length} msgs
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => onRestoreHistory(session.id)}
                      style={{ flex: 1, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => onDeleteHistory(session.id)}
                      style={{ flex: 1, height: 28, borderRadius: 8, border: '1px solid var(--cc-danger-border)', background: 'var(--cc-danger-bg)', color: 'var(--status-danger)', fontSize: 11, cursor: 'pointer' }}
                    >
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