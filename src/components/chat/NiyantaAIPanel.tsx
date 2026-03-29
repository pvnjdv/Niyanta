import React, { useState, useRef, useEffect } from 'react';
import { extractNiyantaFiles } from '../../services/api';
import { NiyantaChatSession } from '../../hooks/useNiyantaChat';
import { ChatMessage, ExtractedFileAttachment, NiyantaActivityItem } from '../../types/message';

interface NiyantaAIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string, attachments?: ExtractedFileAttachment[]) => Promise<void>;
  isSending: boolean;
  messages: ChatMessage[];
  liveActivity: NiyantaActivityItem[];
  onNewChat: () => void;
  historySessions: NiyantaChatSession[];
  onRestoreHistory: (sessionId: string) => void;
  onDeleteHistory: (sessionId: string) => void;
}

const NiyantaAIPanel: React.FC<NiyantaAIPanelProps> = ({
  isOpen,
  onClose,
  onSend,
  isSending,
  messages,
  liveActivity,
  onNewChat,
  historySessions,
  onRestoreHistory,
  onDeleteHistory,
}) => {
  const [input, setInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<ExtractedFileAttachment[]>([]);
  const [isExtractingFiles, setIsExtractingFiles] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant') || null;
  const quickPrompts = [
    'Summarize current system health and alerts.',
    'Which agent had the most failures today?',
    'Suggest workflow optimizations for response time.',
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && uploadedFiles.length === 0) || isSending) return;

    setInput('');
    const attachments = uploadedFiles;
    setUploadedFiles([]);
    await onSend(text, attachments);
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (isSending) return;
    setInput('');
    await onSend(prompt);
  };

  const formatTime = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    if (files.length === 0) return;

    setIsExtractingFiles(true);
    try {
      const parsed = await extractNiyantaFiles(files);
      setUploadedFiles(parsed);
    } finally {
      setIsExtractingFiles(false);
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 380,
        background: 'radial-gradient(circle at 10% 0%, var(--cc-glow-a), transparent 42%), linear-gradient(180deg, var(--cc-panel-top), var(--cc-panel-bottom))',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 60,
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid var(--border)',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--cc-info-border)', background: 'var(--cc-info-bg)', display: 'grid', placeItems: 'center', color: 'var(--status-info)', fontSize: 14, flexShrink: 0 }}>
          ◎
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--text-primary)',
              letterSpacing: '0.08em',
            }}
          >
            NIYANTA AI
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
            Central Intelligence Layer
          </div>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            padding: '1px 5px',
            borderRadius: 2,
          }}
        >
          Ctrl+K
        </span>
        <div style={{ flex: 1 }} />
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 4,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              fontSize: 15,
            }}
            title="Chat options"
          >
            ⋮
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 6,
              minWidth: 152,
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              boxShadow: 'var(--shadow-panel)',
              zIndex: 20,
              overflow: 'hidden',
            }}>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onNewChat();
                }}
                style={{ width: '100%', height: 34, border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 12, textAlign: 'left', padding: '0 12px' }}
              >
                New Chat
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setShowHistory(v => !v);
                }}
                style={{ width: '100%', height: 34, border: 'none', borderTop: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', fontSize: 12, textAlign: 'left', padding: '0 12px' }}
              >
                Chat History
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            fontSize: 14,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--cc-surface-1)' }}>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, border: '1px solid var(--cc-info-border)', background: 'var(--cc-info-bg)', color: 'var(--status-info)', fontFamily: 'var(--font-mono)' }}>Model Active</span>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, border: '1px solid var(--border)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>History {historySessions.length}</span>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, border: '1px solid var(--border)', color: uploadedFiles.length > 0 ? 'var(--status-success)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Files {uploadedFiles.length}</span>
      </div>

      {liveActivity.length > 0 && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px', overflowX: 'auto', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(6,182,212,0.05)' }}>
          {liveActivity.map((item) => (
            <div key={item.id + item.timestamp} style={{ minWidth: 160, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--cc-surface-1)' }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--status-info)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{item.detail}</div>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>◈</div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Niyanta AI Assistant
            </div>
            <div>
              Ask about agents, workflows, operations, or request actions.
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 18 }}>
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleQuickPrompt(prompt)}
                  style={{
                    border: '1px solid var(--border)',
                    background: 'var(--cc-surface-1)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    textAlign: 'left',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: 10,
                background: msg.role === 'user' ? 'var(--accent-dim)' : 'var(--cc-surface-1)',
                border: msg.role === 'user' ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg.content}
              {msg.attachments && msg.attachments.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {msg.attachments.map((file) => (
                    <span key={file.name + file.size} style={{ fontSize: 10, padding: '4px 7px', borderRadius: 6, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {file.name}
                    </span>
                  ))}
                </div>
              )}
              {msg.reports && msg.reports.length > 0 && (
                <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                  {msg.reports.map((report) => (
                    <div key={report.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.03)' }}>
                      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--status-info)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{report.title}</div>
                      <div style={{ marginTop: 4, fontSize: 18, fontWeight: 700 }}>{report.value}</div>
                      <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{report.detail}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--text-muted)',
                marginTop: 4,
                padding: '0 2px',
              }}
            >
              {msg.role === 'user' ? 'You' : 'Niyanta'} {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}

        {latestAssistantMessage?.activity && latestAssistantMessage.activity.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, display: 'grid', gap: 6 }}>
            {latestAssistantMessage.activity.map((item) => (
              <div key={item.id + item.timestamp} style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <span style={{ color: 'var(--status-info)', fontFamily: 'var(--font-mono)', marginRight: 6 }}>{item.label}</span>
                {item.detail}
              </div>
            ))}
          </div>
        )}

        {isSending && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: '8px 0',
              color: 'var(--text-muted)',
              fontSize: 12,
            }}
          >
            <span style={{ animation: 'pulse 1.5s infinite' }}>●</span>
            <span style={{ animation: 'pulse 1.5s infinite 0.2s' }}>●</span>
            <span style={{ animation: 'pulse 1.5s infinite 0.4s' }}>●</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: 12,
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {uploadedFiles.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {uploadedFiles.map((f) => (
              <span key={f.name} style={{ fontSize: 10, padding: '4px 7px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--cc-surface-1)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                {f.name} {f.pageCount ? `· ${f.pageCount}p` : ''}
              </span>
            ))}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
          }}
        >
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 4,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: isExtractingFiles ? 'var(--status-info)' : uploadedFiles.length > 0 ? 'var(--status-success)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}
            title="Upload files"
          >
            {isExtractingFiles ? '…' : '⤴'}
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Niyanta AI or upload files..."
            rows={1}
            style={{
              flex: 1,
              minHeight: 36,
              maxHeight: 120,
              padding: '8px 12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--text-primary)',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.4,
            }}
          />
          <button
            onClick={handleSend}
            disabled={isSending || (!input.trim() && uploadedFiles.length === 0)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 4,
              border: '1px solid var(--border)',
              background: input.trim() || uploadedFiles.length > 0 ? 'var(--cc-info-bg)' : 'transparent',
              color: input.trim() || uploadedFiles.length > 0 ? 'var(--accent)' : 'var(--text-muted)',
              cursor: input.trim() || uploadedFiles.length > 0 ? 'pointer' : 'default',
              display: 'grid',
              placeItems: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            ▸
          </button>
        </div>
      </div>

      {showHistory && (
        <div
          style={{
            position: 'absolute',
            top: 56,
            right: 0,
            bottom: 0,
            width: '100%',
            background: 'var(--bg-overlay)',
            zIndex: 35,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setShowHistory(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 360,
              height: '100%',
              background: 'var(--bg-panel)',
              borderLeft: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ height: 44, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>Chat History</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{historySessions.length} sessions</span>
              <button
                onClick={() => setShowHistory(false)}
                style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'grid', gap: 8 }}>
              {historySessions.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No chat history yet.</div>
              ) : (
                historySessions.map((session) => (
                  <div
                    key={session.id}
                    style={{ border: '1px solid var(--border)', background: 'var(--cc-surface-1)', borderRadius: 8, padding: '8px 10px', display: 'grid', gap: 6 }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{session.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(session.timestamp).toLocaleString()} · {session.messages.length} msgs
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => {
                          onRestoreHistory(session.id);
                          setShowHistory(false);
                        }}
                        style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-primary)', fontSize: 11, cursor: 'pointer' }}
                      >
                        Open
                      </button>
                      <button
                        onClick={() => onDeleteHistory(session.id)}
                        style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid var(--cc-danger-border)', background: 'var(--cc-danger-bg)', color: 'var(--status-danger)', fontSize: 11, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NiyantaAIPanel;
