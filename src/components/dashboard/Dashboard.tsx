import React from 'react';
import { Agent, AgentState } from '../../types/agent';
import './Dashboard.css';

interface DashboardProps {
  onCreateWorkflow?: () => void;
  onOpenAgents?: () => void;
  onCreateAgent?: () => void;
  metrics?: Record<string, unknown>;
  agentStates?: Record<string, AgentState>;
  agents?: Agent[];
  recentActivity?: Array<Record<string, unknown>>;
  workflows?: Array<{ id?: string; name?: string; status?: string }>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onCreateWorkflow,
  onOpenAgents,
  onCreateAgent,
  metrics,
  agentStates,
  agents,
  recentActivity,
  workflows,
}) => {
  const totalRuns = (metrics?.totalRuns as number) || 0;
  const totalDecisions = (metrics?.totalDecisions as number) || 0;
  const activeAgents = agents?.filter((a) => agentStates?.[a.id]?.status === 'complete').length || 0;
  const processingAgents = agents?.filter((a) => agentStates?.[a.id]?.status === 'processing').length || 0;
  const totalWorkflows = workflows?.length || 0;
  const activeWorkflows = workflows?.filter((w) => w.status === 'active' || w.status === 'running').length || 0;

  const recentEntries = (recentActivity || []).slice(0, 5);

  const formatTimestamp = (ts: unknown): string => {
    if (!ts) return '';
    const date = new Date(ts as string);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  return (
    <div className="dash">
      <div className="dash__scroll">
        {/* Header */}
        <header className="dash__header">
          <div className="dash__header-left">
            <div className="dash__title-row">
              <h1 className="dash__title">Niyanta AI</h1>
              <span className="dash__status-pill">Niyanta Online</span>
            </div>
            <p className="dash__subtitle">Enterprise Workflow Orchestration</p>
          </div>
          <div className="dash__header-actions">
            <button className="nyt-btn" onClick={onOpenAgents}>
              Agents
            </button>
            <button className="nyt-btn nyt-btn--primary" onClick={onCreateWorkflow}>
              + New Workflow
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="dash__stats">
          <div className="dash__stat">
            <div className="dash__stat-value">{totalRuns}</div>
            <div className="dash__stat-label">Total Runs</div>
          </div>
          <div className="dash__stat">
            <div className="dash__stat-value">{totalDecisions}</div>
            <div className="dash__stat-label">Decisions Made</div>
          </div>
          <div className="dash__stat">
            <div className="dash__stat-value">{activeAgents}</div>
            <div className="dash__stat-label">Agents Completed</div>
          </div>
          <div className="dash__stat">
            <div className="dash__stat-value">{processingAgents}</div>
            <div className="dash__stat-label">Active Tasks</div>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="dash__section">
          <h2 className="dash__section-title">Quick Actions</h2>
          <div className="dash__actions-grid">
            <button className="dash__action-card" onClick={onCreateWorkflow}>
              <div className="dash__action-icon">+</div>
              <div className="dash__action-text">
                <div className="dash__action-title">Create Workflow</div>
                <div className="dash__action-desc">Build a new automation</div>
              </div>
            </button>
            <button className="dash__action-card" onClick={onOpenAgents}>
              <div className="dash__action-icon">◉</div>
              <div className="dash__action-text">
                <div className="dash__action-title">Run Agent</div>
                <div className="dash__action-desc">Execute AI agent tasks</div>
              </div>
            </button>
            <button className="dash__action-card" onClick={onCreateWorkflow}>
              <div className="dash__action-icon">↗</div>
              <div className="dash__action-text">
                <div className="dash__action-title">Import Workflow</div>
                <div className="dash__action-desc">Load from JSON</div>
              </div>
            </button>
          </div>
        </section>

        {/* Active Workflows */}
        <section className="dash__section">
          <div className="dash__section-header">
            <h2 className="dash__section-title">Active Workflows</h2>
            <button className="nyt-btn nyt-btn--sm nyt-btn--ghost" onClick={onCreateWorkflow}>
              View All →
            </button>
          </div>
          {totalWorkflows > 0 ? (
            <>
              <div className="dash__workflow-summary">
                <span className="dash__workflow-count">{activeWorkflows}</span> active of{' '}
                <span className="dash__workflow-count">{totalWorkflows}</span> total workflows
              </div>
              <div className="dash__workflows-list">
                {(workflows || []).slice(0, 5).map((wf, i) => (
                  <div key={wf.id || i} className="dash__workflow-item" onClick={onCreateWorkflow}>
                    <div className="dash__workflow-name">{wf.name || `Workflow ${i + 1}`}</div>
                    <div className={`dash__workflow-status dash__workflow-status--${wf.status || 'draft'}`}>
                      {wf.status || 'draft'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="dash__empty-state">
              <div className="dash__empty-icon">⎇</div>
              <div className="dash__empty-text">No workflows yet</div>
              <button className="nyt-btn nyt-btn--sm nyt-btn--primary" onClick={onCreateWorkflow}>
                Create First Workflow
              </button>
            </div>
          )}
        </section>

        {/* Agent Fleet */}
        <section className="dash__section">
          <div className="dash__section-header">
            <h2 className="dash__section-title">Agent Fleet</h2>
            <button className="nyt-btn nyt-btn--sm nyt-btn--ghost" onClick={onOpenAgents}>
              View All →
            </button>
          </div>
          <div className="dash__agents-grid">
            {(agents || []).map((agent) => {
              const state = agentStates?.[agent.id];
              return (
                <div key={agent.id} className="dash__agent-card" onClick={onOpenAgents}>
                  <div className="dash__agent-header">
                    <div
                      className="dash__agent-icon"
                      style={{
                        background: `${agent.color}15`,
                        color: agent.color,
                        border: `1px solid ${agent.color}30`,
                      }}
                    >
                      {agent.icon}
                    </div>
                    <div className={`status-dot ${
                      state?.status === 'processing' ? 'status-dot--warning' :
                      state?.status === 'complete' ? 'status-dot--active' :
                      state?.status === 'error' ? 'status-dot--error' :
                      'status-dot--idle'
                    }`} />
                  </div>
                  <div className="dash__agent-name">{agent.name}</div>
                  <div className="dash__agent-desc">{agent.subtitle}</div>
                  <div className="dash__agent-meta">
                    {state?.taskCount || 0} tasks · {state?.status || 'idle'}
                  </div>
                </div>
              );
            })}
            {/* Create New Agent Card */}
            <div className="dash__agent-card dash__agent-card--create" onClick={onCreateAgent}>
              <div className="dash__agent-create-icon">+</div>
              <div className="dash__agent-name">Create New Agent</div>
              <div className="dash__agent-desc">Add a custom AI agent</div>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="dash__section">
          <div className="dash__section-header">
            <h2 className="dash__section-title">Recent Activity</h2>
          </div>
          {recentEntries.length > 0 ? (
            <div className="dash__activity-list">
              {recentEntries.map((entry, i) => (
                <div key={i} className="dash__activity-item">
                  <div className={`dash__activity-dot dash__activity-dot--${
                    (entry.type as string) === 'error' ? 'error' :
                    (entry.type as string) === 'success' || (entry.type as string) === 'complete' ? 'success' :
                    'default'
                  }`} />
                  <div className="dash__activity-content">
                    <div className="dash__activity-message">
                      {(entry.message as string) || (entry.action as string) || 'Activity logged'}
                    </div>
                    <div className="dash__activity-meta">
                      {(entry.agentName as string) || (entry.agent as string) || ''}
                      {entry.timestamp ? (
                        <span className="dash__activity-time"> · {formatTimestamp(entry.timestamp)}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dash__empty-state">
              <div className="dash__empty-icon">◔</div>
              <div className="dash__empty-text">No recent activity</div>
            </div>
          )}
        </section>

        {/* Workflow Templates */}
        <section className="dash__section">
          <h2 className="dash__section-title">Workflow Templates</h2>
          <div className="dash__templates-grid">
            {[
              { name: 'Invoice Processing', desc: 'Auto-process and approve invoices', nodes: 6 },
              { name: 'Employee Onboarding', desc: 'Automate new hire setup', nodes: 8 },
              { name: 'Procurement Request', desc: 'Multi-level purchase approval', nodes: 5 },
              { name: 'Meeting Actions', desc: 'Extract and assign meeting tasks', nodes: 4 },
              { name: 'SLA Monitoring', desc: 'Track and alert on SLA breaches', nodes: 3 },
              { name: 'Compliance Audit', desc: 'Automated compliance checks', nodes: 7 },
            ].map((t, i) => (
              <button
                key={i}
                className="dash__template-card"
                onClick={onCreateWorkflow}
              >
                <div className="dash__template-name">{t.name}</div>
                <div className="dash__template-desc">{t.desc}</div>
                <div className="dash__template-meta">{t.nodes} nodes</div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
