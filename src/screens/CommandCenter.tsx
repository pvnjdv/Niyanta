import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AgentState } from '../types/agent';
import { AGENT_LIST } from '../constants/agents';

interface CommandCenterProps {
  agentStates: Record<string, AgentState>;
  metrics: Record<string, unknown>;
  workflows: Array<{ id?: string; name?: string; status?: string; nodeCount?: number; runCount?: number; successRate?: number }>;
  onRunAll?: () => Promise<void>;
  runAllProgress?: string | null;
}

const CommandCenter: React.FC<CommandCenterProps> = ({ agentStates, metrics, workflows }) => {
  const navigate = useNavigate();
  const agents = AGENT_LIST;
  const m = metrics as Record<string, number>;
  const totalRuns = m.totalRuns || 0;
  const failedToday = m.failedToday || 0;
  const pendingApprovals = m.pendingApprovals || 0;
  const criticalAlerts = m.criticalAlerts || 0;

  const tiles = [
    { label: 'Active Workflows', value: totalRuns, onClick: () => navigate('/workflows') },
    { label: 'Failed Today', value: failedToday, warn: failedToday > 0, onClick: () => navigate('/monitor') },
    { label: 'Pending Approvals', value: pendingApprovals, onClick: () => navigate('/audit') },
    { label: 'Critical Alerts', value: criticalAlerts, warn: criticalAlerts > 0, onClick: () => navigate('/audit') },
    { label: 'Agents', value: agents.length, onClick: () => navigate('/agents') },
    { label: 'Workflows', value: workflows.length, onClick: () => navigate('/workflows') },
  ];

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 24 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: '0 0 20px' }}>
        Command Centre
      </h2>

      {/* Stat Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {tiles.map((tile, i) => (
          <div
            key={i}
            onClick={tile.onClick}
            style={{
              padding: 20,
              background: 'var(--bg-tile)',
              border: `1px solid ${tile.warn ? 'var(--status-danger)' : 'var(--border)'}`,
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'border-color 150ms',
            }}
            onMouseEnter={e => { if (!tile.warn) e.currentTarget.style.borderColor = 'var(--text-secondary)'; }}
            onMouseLeave={e => { if (!tile.warn) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.06em' }}>
              {tile.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700,
              color: tile.warn ? 'var(--status-danger)' : 'var(--text-primary)', lineHeight: 1,
            }}>
              {tile.value}
            </div>
          </div>
        ))}
      </div>

      {/* Agent Health */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.06em' }}>
          Agent Status
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
          {agents.map(agent => {
            const state = agentStates[agent.id];
            const status = state?.status || 'idle';
            return (
              <div
                key={agent.id}
                onClick={() => navigate(`/agents/${agent.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'var(--bg-tile)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 4,
                  background: agent.color, display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#fff',
                  flexShrink: 0,
                }}>
                  {agent.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {agent.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                    {status} · {state?.taskCount || 0} tasks
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workflows */}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.06em' }}>
          Recent Workflows
        </div>
        {workflows.length === 0 ? (
          <div style={{
            padding: 20, background: 'var(--bg-tile)', border: '1px solid var(--border)',
            borderRadius: 4, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 13,
          }}>
            No workflows yet. <span onClick={() => navigate('/workflows')} style={{ cursor: 'pointer', textDecoration: 'underline' }}>Create one</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {workflows.slice(0, 10).map((wf, i) => (
              <div
                key={wf.id || i}
                onClick={() => navigate('/workflows')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', background: 'var(--bg-tile)',
                  border: '1px solid var(--border)', borderRadius: 4,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, flex: 1 }}>
                  {wf.name || 'Unnamed workflow'}
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 6px',
                  border: '1px solid var(--border)', borderRadius: 2,
                  color: wf.status === 'active' ? 'var(--text-primary)' : 'var(--text-muted)',
                }}>
                  {wf.status || 'draft'}
                </span>
                {wf.nodeCount != null && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                    {wf.nodeCount} nodes
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandCenter;
