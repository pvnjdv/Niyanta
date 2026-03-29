import React, { useEffect, useMemo, useState } from 'react';
import { approveApproval, fetchPendingApprovals, rejectApproval } from '../../services/api';

interface Approval {
  id: string;
  workflow_run_id: string;
  workflow_id: string;
  workflow_name: string;
  node_id: string;
  node_name: string;
  title: string;
  description: string;
  context: Record<string, unknown>;
  assigned_to: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline: string | null;
  escalation_policy: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  decision_comment: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

interface ApprovalQueueProps {
  assignedTo?: string;
  onApprove?: (approvalId: string) => void;
  onReject?: (approvalId: string) => void;
}

const panelStyle: React.CSSProperties = {
  background: 'linear-gradient(160deg, var(--cc-panel-top), var(--cc-panel-bottom))',
  border: '1px solid var(--border)',
  borderRadius: 12,
  boxShadow: 'var(--cc-panel-shadow)',
  overflow: 'hidden',
  minWidth: 0,
};

const toneMap: Record<Approval['priority'], { color: string; background: string; border: string }> = {
  critical: {
    color: 'var(--status-danger)',
    background: 'var(--cc-danger-bg)',
    border: 'var(--cc-danger-border)',
  },
  high: {
    color: 'var(--status-warning)',
    background: 'var(--cc-warn-bg)',
    border: 'var(--cc-warn-border)',
  },
  medium: {
    color: 'var(--status-info)',
    background: 'var(--cc-info-bg)',
    border: 'var(--cc-info-border)',
  },
  low: {
    color: 'var(--status-success)',
    background: 'var(--cc-ok-bg)',
    border: 'var(--cc-ok-border)',
  },
};

const monoPill = (active: boolean): React.CSSProperties => ({
  height: 28,
  padding: '0 12px',
  borderRadius: 999,
  border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
  background: active ? 'var(--accent-dim)' : 'transparent',
  color: active ? 'var(--accent)' : 'var(--text-secondary)',
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  cursor: 'pointer',
});

const actionButtonStyle = (tone: 'approve' | 'reject'): React.CSSProperties => ({
  height: 38,
  padding: '0 18px',
  borderRadius: 8,
  border: `1px solid ${tone === 'approve' ? 'var(--cc-ok-border)' : 'var(--cc-danger-border)'}`,
  background: tone === 'approve' ? 'var(--cc-ok-bg)' : 'var(--cc-danger-bg)',
  color: tone === 'approve' ? 'var(--status-success)' : 'var(--status-danger)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  fontWeight: 700,
  cursor: 'pointer',
});

function formatPriority(priority: Approval['priority']) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return 'No deadline';

  const now = Date.now();
  const target = new Date(deadline).getTime();
  const diff = target - now;

  if (Number.isNaN(target)) return deadline;
  if (diff <= 0) return 'Expired';

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatContext(value: Record<string, unknown>) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '{}';
  }
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ assignedTo = 'admin', onApprove, onReject }) => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [isCompact, setIsCompact] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 1180 : false);

  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth < 1180);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadApprovals = async () => {
      try {
        const data = await fetchPendingApprovals({ assignedTo });
        if (!cancelled) {
          setApprovals(((data as { approvals?: Approval[] }).approvals || []) as Approval[]);
        }
      } catch (error) {
        console.error('Failed to fetch approvals:', error);
        if (!cancelled) {
          setApprovals([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadApprovals();
    const interval = setInterval(loadApprovals, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [assignedTo]);

  const filteredApprovals = useMemo(
    () => (filter === 'all' ? approvals : approvals.filter((approval) => approval.priority === filter)),
    [approvals, filter]
  );

  useEffect(() => {
    if (filteredApprovals.length === 0) {
      setSelectedApprovalId(null);
      return;
    }

    if (!selectedApprovalId || !filteredApprovals.some((approval) => approval.id === selectedApprovalId)) {
      setSelectedApprovalId(filteredApprovals[0].id);
      setComment('');
    }
  }, [filteredApprovals, selectedApprovalId]);

  const selectedApproval = filteredApprovals.find((approval) => approval.id === selectedApprovalId) || null;

  const refreshApprovals = async () => {
    try {
      const data = await fetchPendingApprovals({ assignedTo });
      setApprovals(((data as { approvals?: Approval[] }).approvals || []) as Approval[]);
    } catch (error) {
      console.error('Failed to refresh approvals:', error);
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      const data = await approveApproval(approvalId, comment, {});
      if ((data as { success?: boolean }).success) {
        await refreshApprovals();
        setComment('');
        onApprove?.(approvalId);
      } else {
        alert(`Failed to approve: ${(data as { message?: string }).message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Approve error:', error);
      alert('Failed to approve request');
    }
  };

  const handleReject = async (approvalId: string) => {
    if (!comment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const data = await rejectApproval(approvalId, comment);
      if ((data as { success?: boolean }).success) {
        await refreshApprovals();
        setComment('');
        onReject?.(approvalId);
      } else {
        alert(`Failed to reject: ${(data as { message?: string }).message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Reject error:', error);
      alert('Failed to reject request');
    }
  };

  const queueSummary = {
    critical: approvals.filter((approval) => approval.priority === 'critical').length,
    high: approvals.filter((approval) => approval.priority === 'high').length,
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isCompact ? '1fr' : 'minmax(0, 1.2fr) minmax(360px, 0.8fr)',
        gap: 12,
        minHeight: isCompact ? undefined : 680,
      }}
    >
      <section style={{ ...panelStyle, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div
          style={{
            padding: 16,
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Approval Queue</div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
              {filteredApprovals.length} active request{filteredApprovals.length !== 1 ? 's' : ''} assigned to {assignedTo}.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                ...monoPill(false),
                borderColor: 'var(--cc-danger-border)',
                background: 'var(--cc-danger-bg)',
                color: 'var(--status-danger)',
                cursor: 'default',
              }}
            >
              {queueSummary.critical} Critical
            </span>
            <span
              style={{
                ...monoPill(false),
                borderColor: 'var(--cc-warn-border)',
                background: 'var(--cc-warn-bg)',
                color: 'var(--status-warning)',
                cursor: 'default',
              }}
            >
              {queueSummary.high} High
            </span>
          </div>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', 'critical', 'high', 'medium', 'low'].map((priority) => (
            <button
              key={priority}
              onClick={() => setFilter(priority as typeof filter)}
              style={monoPill(filter === priority)}
            >
              {priority}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loading ? (
            <div style={{ padding: 56, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
              Loading approvals...
            </div>
          ) : filteredApprovals.length === 0 ? (
            <div style={{ padding: 56, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Queue clear</div>
              <div style={{ fontSize: 13 }}>No pending approvals match the current priority filter.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {filteredApprovals.map((approval) => {
                const tone = toneMap[approval.priority];
                const isSelected = approval.id === selectedApprovalId;
                return (
                  <button
                    key={approval.id}
                    type="button"
                    onClick={() => {
                      setSelectedApprovalId(approval.id);
                      setComment(approval.decision_comment || '');
                    }}
                    style={{
                      textAlign: 'left',
                      border: `1px solid ${isSelected ? tone.border : 'var(--border)'}`,
                      borderLeft: `4px solid ${tone.color}`,
                      borderRadius: 12,
                      background: isSelected ? 'var(--bg-tile)' : 'var(--bg-panel)',
                      padding: 16,
                      cursor: 'pointer',
                      transition: 'background 150ms ease, border-color 150ms ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                          {approval.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{approval.description}</div>
                      </div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          height: 22,
                          padding: '0 10px',
                          borderRadius: 999,
                          border: `1px solid ${tone.border}`,
                          background: tone.background,
                          color: tone.color,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 9,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {formatPriority(approval.priority)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ ...monoPill(false), cursor: 'default' }}>{approval.workflow_name}</span>
                      <span style={{ ...monoPill(false), cursor: 'default' }}>Assigned {approval.assigned_to}</span>
                      <span style={{ ...monoPill(false), cursor: 'default' }}>Due {formatDeadline(approval.deadline)}</span>
                      <span style={{ ...monoPill(false), cursor: 'default' }}>{new Date(approval.created_at).toLocaleString()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <aside style={{ ...panelStyle, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>Decision Workspace</div>
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
            Review the request context, record your rationale, and issue a decision.
          </div>
        </div>

        {!selectedApproval ? (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 24, color: 'var(--text-secondary)' }}>
            Select an approval request to inspect details.
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'grid', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>{selectedApproval.title}</div>
                    <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 13 }}>{selectedApproval.description}</div>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: 24,
                      padding: '0 10px',
                      borderRadius: 999,
                      border: `1px solid ${toneMap[selectedApproval.priority].border}`,
                      background: toneMap[selectedApproval.priority].background,
                      color: toneMap[selectedApproval.priority].color,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    {formatPriority(selectedApproval.priority)} Priority
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ ...monoPill(false), cursor: 'default' }}>{selectedApproval.workflow_name}</span>
                  <span style={{ ...monoPill(false), cursor: 'default' }}>Node {selectedApproval.node_name}</span>
                  <span style={{ ...monoPill(false), cursor: 'default' }}>Deadline {formatDeadline(selectedApproval.deadline)}</span>
                </div>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--cc-surface-1)', padding: 14 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Request Context
                </div>
                <pre
                  style={{
                    margin: 0,
                    maxHeight: 260,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {formatContext(selectedApproval.context)}
                </pre>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--cc-surface-1)', padding: 14 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Decision Comment
                </div>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Add your decision notes or rejection reason..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-tile)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => handleReject(selectedApproval.id)} style={actionButtonStyle('reject')}>
                Reject
              </button>
              <button type="button" onClick={() => handleApprove(selectedApproval.id)} style={actionButtonStyle('approve')}>
                Approve
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
};
