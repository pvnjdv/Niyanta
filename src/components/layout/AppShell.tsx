import React, { useState } from 'react';
import { Agent, AgentState } from '../../types/agent';
import { ActiveView, RightPanelTab, Theme } from '../../types/ui';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';
import { Dashboard } from '../dashboard/Dashboard';
import { N8nWorkflowBuilder } from '../workflow/N8nWorkflowBuilder';
import MonitoringView from '../monitoring/MonitoringView';
import DataView from '../data/DataView';

interface AppShellProps {
  agents: Agent[];
  agentStates: Record<string, AgentState>;
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onRunAll: () => Promise<void>;
  runAllProgress: string | null;
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
  theme: Theme;
  onToggleTheme: () => void;
  metrics: Record<string, unknown>;
  auditEntries: unknown[];
  rightPanelTab: RightPanelTab;
  onRightPanelTabChange: (tab: RightPanelTab) => void;
  onExecuteAgent: (agentId: string, input?: string) => Promise<void>;
  onUseSample: (agentId: string) => Promise<void>;
  onOpenNiyantaChat: () => void;
  onSaveWorkflow: (nodes: Array<{ instanceId: string; nodeType: string; name: string; config: Record<string, unknown>; position: { x: number; y: number } }>, edges: Array<{ id: string; fromNodeId: string; toNodeId: string; condition?: string }>) => Promise<void>;
  workflows: Array<{ id?: string; name?: string; status?: string }>;
}

const NAV_ITEMS: Array<{ id: ActiveView; icon: string; label: string }> = [
  { id: 'home', icon: '⌂', label: 'Dashboard' },
  { id: 'workflows', icon: '⎇', label: 'Workflows' },
  { id: 'agents', icon: '◉', label: 'Agents' },
  { id: 'monitoring', icon: '◔', label: 'Monitoring' },
  { id: 'data', icon: '▤', label: 'Data' },
];

const AppShell: React.FC<AppShellProps> = ({
  agents, agentStates, selectedAgentId, onSelectAgent, onRunAll, runAllProgress,
  activeView, onChangeView, theme, onToggleTheme, metrics, auditEntries,
  rightPanelTab, onRightPanelTabChange, onExecuteAgent, onUseSample,
  onOpenNiyantaChat, onSaveWorkflow, workflows,
}) => {
  const selectedAgent = selectedAgentId ? agents.find((a) => a.id === selectedAgentId) || null : null;
  const selectedState = selectedAgent ? agentStates[selectedAgent.id] : null;
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');

  const viewTitle = NAV_ITEMS.find((n) => n.id === activeView)?.label || '';
  const filteredAgents = agents.filter((a) =>
    a.name.toLowerCase().includes(agentSearch.toLowerCase())
  );

  return (
    <div className="nyt-app">
      {/* Icon Rail Sidebar */}
      <nav className="nyt-sidebar">
        <div className="nyt-sidebar__logo">
          <div className="nyt-sidebar__logo-mark">N</div>
        </div>

        <div className="nyt-sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nyt-sidebar__item ${activeView === item.id ? 'nyt-sidebar__item--active' : ''}`}
              onClick={() => onChangeView(item.id)}
            >
              {item.icon}
              <span className="nyt-sidebar__item-label">{item.label}</span>
            </button>
          ))}

          <div className="nyt-sidebar__divider" />

          <button
            className="nyt-sidebar__item"
            onClick={onOpenNiyantaChat}
            title="Niyanta Command"
          >
            ⊛
            <span className="nyt-sidebar__item-label">Command</span>
          </button>
        </div>

        <div className="nyt-sidebar__footer">
          <button
            className="nyt-sidebar__item"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '○' : '●'}
            <span className="nyt-sidebar__item-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="nyt-content">
        {/* Top Bar */}
        {activeView !== 'home' && activeView !== 'workflows' && (
          <div className="nyt-topbar">
            <div className="nyt-topbar__title">
              {viewTitle}
              {activeView === 'agents' && selectedAgent && (
                <span className="nyt-topbar__breadcrumb">/ {selectedAgent.name}</span>
              )}
            </div>
            <div className="nyt-topbar__actions">
              {activeView === 'agents' && (
                <>
                  <button
                    className="nyt-btn nyt-btn--sm"
                    onClick={() => setShowRightPanel(!showRightPanel)}
                  >
                    {showRightPanel ? 'Hide Panel' : 'Audit Trail'}
                  </button>
                  <button
                    className="nyt-btn nyt-btn--primary nyt-btn--sm"
                    onClick={() => { void onRunAll(); }}
                    disabled={!!runAllProgress}
                  >
                    {runAllProgress || '▶ Run All'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* View Content */}
        <div className="nyt-main">
          {activeView === 'home' && (
            <Dashboard
              onCreateWorkflow={() => onChangeView('workflows')}
              onOpenAgents={() => onChangeView('agents')}
              metrics={metrics}
              agentStates={agentStates}
              agents={agents}
            />
          )}

          {activeView === 'agents' && (
            <div style={{ display: 'flex', height: '100%' }}>
              {/* Agent List Panel */}
              <div style={{
                width: 260,
                borderRight: '1px solid var(--border-default)',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-surface)',
                flexShrink: 0,
              }}>
                <div style={{ padding: 12, borderBottom: '1px solid var(--border-default)' }}>
                  <input
                    className="nyt-input"
                    placeholder="Search agents..."
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {filteredAgents.map((agent) => {
                    const state = agentStates[agent.id];
                    const isActive = selectedAgentId === agent.id;
                    return (
                      <button
                        key={agent.id}
                        onClick={() => onSelectAgent(agent.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 16px',
                          border: 'none',
                          borderLeft: isActive ? '2px solid var(--text-primary)' : '2px solid transparent',
                          background: isActive ? 'var(--bg-active)' : 'transparent',
                          color: 'var(--text-primary)',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          background: `${agent.color}18`,
                          border: `1px solid ${agent.color}30`,
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 11,
                          fontWeight: 600,
                          color: agent.color,
                          fontFamily: 'var(--font-mono)',
                          flexShrink: 0,
                        }}>
                          {agent.icon}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontSize: 13,
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {agent.name}
                          </div>
                          <div style={{
                            fontSize: 11,
                            color: 'var(--text-tertiary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {agent.subtitle}
                          </div>
                        </div>
                        <div className={`status-dot ${
                          state?.status === 'processing' ? 'status-dot--warning' :
                          state?.status === 'complete' ? 'status-dot--active' :
                          state?.status === 'error' ? 'status-dot--error' :
                          'status-dot--idle'
                        }`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Agent Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <CenterPanel
                  selectedAgent={selectedAgent}
                  selectedState={selectedState}
                  onExecute={onExecuteAgent}
                  onUseSample={onUseSample}
                />
              </div>

              {/* Right Panel */}
              {showRightPanel && (
                <RightPanel
                  entries={auditEntries}
                  metrics={metrics}
                  tab={rightPanelTab}
                  onTabChange={onRightPanelTabChange}
                  onOpenNiyantaChat={onOpenNiyantaChat}
                  onClose={() => setShowRightPanel(false)}
                />
              )}
            </div>
          )}

          {activeView === 'workflows' && (
            <N8nWorkflowBuilder
              workflowName="My Workflow"
              onSave={onSaveWorkflow}
              onExecute={onSaveWorkflow}
              onBack={() => onChangeView('home')}
            />
          )}

          {activeView === 'monitoring' && (
            <MonitoringView metrics={metrics} auditEntries={auditEntries} />
          )}

          {activeView === 'data' && (
            <DataView />
          )}
        </div>
      </div>
    </div>
  );
};

export default AppShell;
