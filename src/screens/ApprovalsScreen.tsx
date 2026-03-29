import React, { useCallback, useEffect, useState } from 'react';
import { ApprovalQueue } from '../components/workflow/ApprovalQueue';
import { fetchApprovalStats } from '../services/api';

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  total: number;
  averageResponseTimeMinutes: number;
}

const panelStyle: React.CSSProperties = {
  background: 'linear-gradient(160deg, var(--cc-panel-top), var(--cc-panel-bottom))',
  border: '1px solid var(--border)',
  borderRadius: 12,
  boxShadow: 'var(--cc-panel-shadow)',
};

const chipStyle = (tone: 'ok' | 'warn' | 'info' | 'danger'): React.CSSProperties => {
  const styles: Record<string, React.CSSProperties> = {
    ok: {
      color: 'var(--status-success)',
      borderColor: 'var(--cc-ok-border)',
      background: 'var(--cc-ok-bg)',
    },
    warn: {
      color: 'var(--status-warning)',
      borderColor: 'var(--cc-warn-border)',
      background: 'var(--cc-warn-bg)',
    },
    info: {
      color: 'var(--status-info)',
      borderColor: 'var(--cc-info-border)',
      background: 'var(--cc-info-bg)',
    },
    danger: {
      color: 'var(--status-danger)',
      borderColor: 'var(--cc-danger-border)',
      background: 'var(--cc-danger-bg)',
    },
  };

  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: 22,
    padding: '0 10px',
    borderRadius: 999,
    border: '1px solid',
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 700,
    ...styles[tone],
  };
};

const StatCard: React.FC<{
  label: string;
  value: string | number;
  accent: string;
  detail: string;
}> = ({ label, value, accent, detail }) => (
  <div
    style={{
      ...panelStyle,
      minHeight: 118,
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minWidth: 0,
    }}
  >
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {label}
    </div>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: accent, lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{detail}</div>
  </div>
);

export const ApprovalsScreen: React.FC = () => {
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [isCompact, setIsCompact] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 1180 : false);
  const [currentUser] = useState('admin');

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchApprovalStats();
      if ((data as { success?: boolean }).success) {
        setStats((data as { stats: ApprovalStats }).stats);
      }
    } catch (error) {
      console.error('Failed to fetch approval stats:', error);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth < 1180);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const statCards = [
    {
      label: 'Pending Review',
      value: stats?.pending ?? '—',
      accent: 'var(--status-warning)',
      detail: 'Requests currently waiting for a decision.',
    },
    {
      label: 'Approved',
      value: stats?.approved ?? '—',
      accent: 'var(--status-success)',
      detail: 'Requests cleared to continue workflow execution.',
    },
    {
      label: 'Rejected',
      value: stats?.rejected ?? '—',
      accent: 'var(--status-danger)',
      detail: 'Requests stopped by human review.',
    },
    {
      label: 'Expired',
      value: stats?.expired ?? '—',
      accent: 'var(--status-info)',
      detail: 'Approvals that missed their response window.',
    },
    {
      label: 'Avg Response',
      value: stats ? `${stats.averageResponseTimeMinutes}m` : '—',
      accent: 'var(--text-primary)',
      detail: 'Average turnaround time for approval actions.',
    },
  ];

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        padding: 20,
        background:
          'radial-gradient(circle at 12% 0%, var(--cc-glow-a), transparent 40%), radial-gradient(circle at 88% 0%, var(--cc-glow-b), transparent 34%)',
      }}
    >
      <div style={{ ...panelStyle, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>Approvals Centre</div>
            <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 13 }}>
              Human-in-the-loop decisions, deadline pressure, and workflow control in one queue.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={chipStyle('info')}>Operator {currentUser}</span>
            <span style={chipStyle((stats?.pending || 0) > 0 ? 'warn' : 'ok')}>
              {stats?.pending || 0} Pending
            </span>
            <span style={chipStyle('ok')}>Refresh 30s</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isCompact ? '1fr' : 'repeat(5, minmax(0, 1fr))',
          gap: 12,
          marginBottom: 12,
        }}
      >
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <ApprovalQueue
        assignedTo={currentUser}
        onApprove={() => {
          loadStats();
        }}
        onReject={() => {
          loadStats();
        }}
      />
    </div>
  );
};
