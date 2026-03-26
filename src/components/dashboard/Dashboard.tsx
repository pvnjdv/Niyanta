import React from 'react';
import { Agent, AgentState } from '../../types/agent';
import './Dashboard.css';

interface DashboardProps {
  onCreateWorkflow?: () => void;
  onOpenAgents?: () => void;
  metrics?: Record<string, unknown>;
  agentStates?: Record<string, AgentState>;
  agents?: Agent[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  onCreateWorkflow,
  onOpenAgents,
  metrics,
  agentStates,
  agents,
}) => {
  const totalRuns = (metrics?.totalRuns as number) || 0;
  const totalDecisions = (metrics?.totalDecisions as number) || 0;
  const activeAgents = agents?.filter((a) => agentStates?.[a.id]?.status === 'complete').length || 0;
  const processingAgents = agents?.filter((a) => agentStates?.[a.id]?.status === 'processing').length || 0;

  return (
    <div className="dash">
      <div className="dash__scroll">
        {/* Header */}
        <header className="dash__header">
          <div className="dash__header-left">
            <h1 className="dash__title">Niyanta AI</h1>
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

        {/* Agent Overview */}
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
          </div>
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
