import React, { useState, useEffect } from 'react';

interface Approval {
  id: string;
  workflow_run_id: string;
  workflow_id: string;
  workflow_name: string;
  node_id: string;
  node_name: string;
  title: string;
  description: string;
  context: any;
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

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ 
  assignedTo = 'admin',
  onApprove,
  onReject 
}) => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [comment, setComment] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  useEffect(() => {
    fetchApprovals();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchApprovals, 10000);
    return () => clearInterval(interval);
  }, [assignedTo]);

  const fetchApprovals = async () => {
    try {
      const response = await fetch(`/api/approvals/pending?assignedTo=${assignedTo}`);
      const data = await response.json();
      if (data.success) {
        setApprovals(data.approvals);
      }
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      const response = await fetch(`/api/approvals/${approvalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          comment,
          approvedBy: assignedTo,
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchApprovals();
        setSelectedApproval(null);
        setComment('');
        onApprove?.(approvalId);
      } else {
        alert(`Failed to approve: ${data.message}`);
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
      const response = await fetch(`/api/approvals/${approvalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          comment,
          rejectedBy: assignedTo,
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchApprovals();
        setSelectedApproval(null);
        setComment('');
        onReject?.(approvalId);
      } else {
        alert(`Failed to reject: ${data.message}`);
      }
    } catch (error) {
      console.error('Reject error:', error);
      alert('Failed to reject request');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getTimeRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    
    const now = new Date().getTime();
    const end = new Date(deadline).getTime();
    const diff = end - now;
    
    if (diff < 0) return 'EXPIRED';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  const filteredApprovals = filter === 'all' 
    ? approvals 
    : approvals.filter(a => a.priority === filter);

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
          Loading approvals...
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        height: 56, borderBottom: '1px solid var(--border)', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
            Approval Queue
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
            {filteredApprovals.length} pending request{filteredApprovals.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'critical', 'high', 'medium', 'low'].map(p => (
            <button
              key={p}
              onClick={() => setFilter(p as any)}
              style={{
                height: 28, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 9,
                textTransform: 'uppercase', border: '1px solid var(--border)',
                background: filter === p ? 'var(--bg-accent)' : 'transparent',
                color: filter === p ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Approval List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {filteredApprovals.length === 0 ? (
          <div style={{ 
            padding: 40, textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)'
          }}>
            No pending approvals
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredApprovals.map(approval => {
              const timeRemaining = getTimeRemaining(approval.deadline);
              const isExpired = timeRemaining === 'EXPIRED';
              
              return (
                <div
                  key={approval.id}
                  onClick={() => setSelectedApproval(approval)}
                  style={{
                    padding: 16, border: '1px solid var(--border)',
                    borderLeft: `4px solid ${getPriorityColor(approval.priority)}`,
                    background: selectedApproval?.id === approval.id ? 'var(--bg-tile)' : 'var(--bg-panel)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tile)'; }}
                  onMouseLeave={(e) => { 
                    if (selectedApproval?.id !== approval.id) {
                      e.currentTarget.style.background = 'var(--bg-panel)'; 
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* Priority Badge */}
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 4, flexShrink: 0,
                      background: getPriorityColor(approval.priority) + '20',
                      border: `1px solid ${getPriorityColor(approval.priority)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                      color: getPriorityColor(approval.priority),
                    }}>
                      {approval.priority.substring(0, 1).toUpperCase()}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600,
                        marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {approval.title}
                      </div>
                      
                      <div style={{ 
                        fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)',
                        marginBottom: 8, lineHeight: 1.4,
                      }}>
                        {approval.description}
                      </div>

                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                          📋 {approval.workflow_name}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                          🕐 {new Date(approval.created_at).toLocaleString()}
                        </div>
                        {timeRemaining && (
                          <div style={{ 
                            fontFamily: 'var(--font-mono)', fontSize: 10,
                            color: isExpired ? '#EF4444' : 'var(--text-muted)',
                            fontWeight: isExpired ? 600 : 400,
                          }}>
                            ⏱ {timeRemaining}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approval Details Modal */}
      {selectedApproval && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => { setSelectedApproval(null); setComment(''); }}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 600, maxHeight: '80vh', background: 'var(--bg-panel)',
              border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div style={{ 
              padding: 20, borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                  {selectedApproval.title}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                  Priority: {selectedApproval.priority.toUpperCase()}
                </div>
              </div>
              <button 
                onClick={() => { setSelectedApproval(null); setComment(''); }}
                style={{
                  width: 32, height: 32, border: '1px solid var(--border)',
                  background: 'transparent', cursor: 'pointer', fontSize: 18,
                }}
              >×</button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                  DESCRIPTION
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.6 }}>
                  {selectedApproval.description}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                  WORKFLOW
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>
                  {selectedApproval.workflow_name}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                  CONTEXT DATA
                </div>
                <pre style={{ 
                  fontFamily: 'var(--font-mono)', fontSize: 11, 
                  background: 'var(--bg-base)', padding: 12, borderRadius: 4,
                  border: '1px solid var(--border)', overflow: 'auto', maxHeight: 200,
                }}>
                  {JSON.stringify(selectedApproval.context, null, 2)}
                </pre>
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                  COMMENT (optional)
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your decision comment..."
                  rows={3}
                  style={{
                    width: '100%', padding: 10, fontFamily: 'var(--font-body)', fontSize: 13,
                    background: 'var(--bg-tile)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', resize: 'vertical',
                  }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ 
              padding: 20, borderTop: '1px solid var(--border)',
              display: 'flex', gap: 12, justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => handleReject(selectedApproval.id)}
                style={{
                  height: 36, padding: '0 20px', fontFamily: 'var(--font-mono)', fontSize: 11,
                  background: 'transparent', border: '1px solid #EF4444', color: '#EF4444',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                ✕ REJECT
              </button>
              <button
                onClick={() => handleApprove(selectedApproval.id)}
                style={{
                  height: 36, padding: '0 20px', fontFamily: 'var(--font-mono)', fontSize: 11,
                  background: '#10B981', border: '1px solid #10B981', color: 'white',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                ✓ APPROVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
