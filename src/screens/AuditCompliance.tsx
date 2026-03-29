import React, { useEffect, useMemo, useState } from 'react';
import ProgressBar from '../components/shared/ProgressBar';
import { AGENT_LIST } from '../constants/agents';
import { fetchMetrics } from '../services/api';

interface AuditComplianceProps {
  auditEntries: unknown[];
}

interface AuditMetrics {
  totalDecisionsMade?: number;
  totalRuns?: number;
  totalTasksCreated?: number;
  pendingApprovals?: number;
  failedToday?: number;
  criticalAlerts?: number;
  escalationsTriggered?: number;
  lastUpdated?: string;
  decisionBreakdown?: Record<string, number>;
  recentRuns?: Array<Record<string, unknown>>;
  slaTrackers?: Array<Record<string, unknown>>;
}

interface AuditRow {
  agent: string;
  agentId: string;
  agentColor: string;
  event: string;
  description: string;
  decision: string;
  why: string;
  time: string;
  timestamp: string;
  processingTime: number;
  severity: 'low' | 'medium' | 'high';
}

const agentPalette = new Map(
  AGENT_LIST.map((agent) => [agent.id, { name: agent.name, color: agent.color }])
);

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const formatLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const classifyRegulation = (entry: AuditRow) => {
  const text = `${entry.event} ${entry.description} ${entry.why}`.toLowerCase();
  if (text.includes('security') || text.includes('threat') || text.includes('incident')) return 'ISO 27001';
  if (text.includes('invoice') || text.includes('finance') || text.includes('purchase')) return 'SOX';
  if (text.includes('employee') || text.includes('personal') || text.includes('privacy')) return 'GDPR';
  if (text.includes('payment') || text.includes('card')) return 'PCI-DSS';
  return 'Operational Policy';
};

const remediationText = (entry: AuditRow) => {
  if (entry.decision === 'REJECTED') return 'Rework the failed step and rerun after corrective changes.';
  if (entry.decision === 'CRITICAL') return 'Escalate to human review immediately and freeze downstream execution.';
  if (entry.decision === 'PENDING_APPROVAL') return 'Collect the missing human decision to resume the execution chain.';
  return 'Review the why-chain and clear the policy gap before continuing.';
};

const AuditCompliance: React.FC<AuditComplianceProps> = ({ auditEntries }) => {
  const [activeTab, setActiveTab] = useState<'log' | 'decisions' | 'compliance' | 'violations' | 'metrics'>('log');
  const [agentFilter, setAgentFilter] = useState('All');
  const [decisionFilter, setDecisionFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState<AuditMetrics>({});

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setMetrics((await fetchMetrics()) as AuditMetrics);
      } catch {
        setMetrics({});
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const tabs: Array<{ id: 'log' | 'decisions' | 'compliance' | 'violations' | 'metrics'; label: string }> = [
    { id: 'log', label: 'WHY-CHAIN LOG' },
    { id: 'decisions', label: 'DECISIONS' },
    { id: 'compliance', label: 'COMPLIANCE' },
    { id: 'violations', label: 'POLICY VIOLATIONS' },
    { id: 'metrics', label: 'METRICS' },
  ];

  const normalizedEntries = useMemo<AuditRow[]>(() => {
    return (Array.isArray(auditEntries) ? auditEntries : []).map((raw) => {
      const row = (raw || {}) as Record<string, unknown>;
      const metadataRaw = row.metadata;
      let metadata: Record<string, unknown> = {};
      if (typeof metadataRaw === 'string' && metadataRaw.trim().length > 0) {
        try {
          metadata = JSON.parse(metadataRaw) as Record<string, unknown>;
        } catch {
          metadata = {};
        }
      } else if (metadataRaw && typeof metadataRaw === 'object') {
        metadata = metadataRaw as Record<string, unknown>;
      }

      const rawAgentId = String(row.agent_id || row.agentId || metadata.agentId || 'system');
      const palette = agentPalette.get(rawAgentId);
      const description = String(row.event || row.details || row.description || 'Audit event recorded');
      const decision = String(row.decision || metadata.decision || '').trim().toUpperCase() || 'RECORDED';
      const eventType = String(row.event_type || row.eventType || row.action || 'audit_event');
      const whySource = row.input_preview || row.inputPreview || metadata.reason || metadata.summary || metadata.error || metadata.detail;
      const why = typeof whySource === 'string' && whySource.trim().length > 0
        ? whySource
        : decision === 'RECORDED'
          ? 'Event stored for governance traceability.'
          : `Decision ${decision} was recorded for this execution path.`;
      const severity: AuditRow['severity'] =
        decision === 'CRITICAL' || decision === 'REJECTED'
          ? 'high'
          : decision === 'FLAG' || decision === 'PENDING_APPROVAL'
            ? 'medium'
            : 'low';

      return {
        agent: palette?.name || formatLabel(rawAgentId),
        agentId: rawAgentId,
        agentColor: palette?.color || 'var(--status-info)',
        event: eventType,
        description,
        decision,
        why,
        time: new Date(String(row.timestamp || new Date().toISOString())).toLocaleTimeString([], { hour12: false }),
        timestamp: String(row.timestamp || new Date().toISOString()),
        processingTime: Number(row.processing_time_ms || row.processingTime || metadata.processingTime || 0) || 0,
        severity,
      };
    });
  }, [auditEntries]);

  const decisionColors: Record<string, { bg: string; border: string; color: string }> = {
    AUTO_APPROVE: { bg: 'var(--cc-ok-bg)', border: 'var(--cc-ok-border)', color: 'var(--status-success)' },
    'AUTO-APPROVE': { bg: 'var(--cc-ok-bg)', border: 'var(--cc-ok-border)', color: 'var(--status-success)' },
    APPROVED: { bg: 'var(--cc-ok-bg)', border: 'var(--cc-ok-border)', color: 'var(--status-success)' },
    PROCEED: { bg: 'var(--cc-ok-bg)', border: 'var(--cc-ok-border)', color: 'var(--status-success)' },
    FLAG: { bg: 'var(--cc-warn-bg)', border: 'var(--cc-warn-border)', color: 'var(--status-warning)' },
    PENDING_APPROVAL: { bg: 'var(--cc-warn-bg)', border: 'var(--cc-warn-border)', color: 'var(--status-warning)' },
    REJECTED: { bg: 'var(--cc-danger-bg)', border: 'var(--cc-danger-border)', color: 'var(--status-danger)' },
    FAILED: { bg: 'var(--cc-danger-bg)', border: 'var(--cc-danger-border)', color: 'var(--status-danger)' },
    CRITICAL: { bg: 'var(--cc-danger-bg)', border: 'var(--cc-danger-border)', color: 'var(--status-danger)' },
    RECORDED: { bg: 'var(--cc-surface-1)', border: 'var(--border)', color: 'var(--text-secondary)' },
  };

  const filteredEntries = normalizedEntries.filter((entry) => {
    if (agentFilter !== 'All' && entry.agent !== agentFilter) return false;
    if (decisionFilter !== 'All' && entry.decision !== decisionFilter) return false;
    if (searchTerm && !`${entry.description} ${entry.why} ${entry.event}`.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const decisionBreakdown = metrics.decisionBreakdown || {};
  const approvedCount = Number(decisionBreakdown.autoApprove || 0) + Number(decisionBreakdown.proceed || 0) + Number(decisionBreakdown.approved || 0);
  const flaggedCount = Number(decisionBreakdown.flag || 0);
  const rejectedCount = Number(decisionBreakdown.reject || 0);
  const escalatedCount = Number(decisionBreakdown.escalate || metrics.escalationsTriggered || 0);
  const decisionTotal = Number(metrics.totalDecisionsMade || 0) || approvedCount + flaggedCount + rejectedCount + escalatedCount;
  const automationRate = decisionTotal > 0 ? Math.round((approvedCount / decisionTotal) * 100) : 0;
  const slaTrackers = Array.isArray(metrics.slaTrackers) ? metrics.slaTrackers : [];
  const breachedSlaCount = slaTrackers.filter((tracker) => Number((tracker as Record<string, unknown>).consumed || 0) > 100).length;

  const complianceItems = useMemo(
    () => [
      {
        name: 'Approval Controls',
        score: clampScore(100 - Number(metrics.pendingApprovals || 0) * 12 - Number(metrics.criticalAlerts || 0) * 8),
      },
      {
        name: 'Decision Quality',
        score: decisionTotal > 0 ? clampScore(((approvedCount + escalatedCount) / decisionTotal) * 100) : 0,
      },
      {
        name: 'Runtime Stability',
        score: clampScore(100 - Number(metrics.failedToday || 0) * 18 - breachedSlaCount * 10),
      },
      {
        name: 'Trace Coverage',
        score: normalizedEntries.length > 0
          ? clampScore((normalizedEntries.filter((entry) => entry.processingTime > 0 || entry.why.length > 0).length / normalizedEntries.length) * 100)
          : 0,
      },
      {
        name: 'Escalation Readiness',
        score: clampScore(100 - Number(metrics.criticalAlerts || 0) * 15 - Number(metrics.pendingApprovals || 0) * 10),
      },
    ],
    [approvedCount, breachedSlaCount, decisionTotal, metrics.criticalAlerts, metrics.failedToday, metrics.pendingApprovals, normalizedEntries]
  );

  const violations = useMemo(
    () =>
      normalizedEntries
        .filter((entry) => ['FLAG', 'REJECTED', 'CRITICAL', 'FAILED', 'PENDING_APPROVAL'].includes(entry.decision))
        .slice(0, 8)
        .map((entry) => ({
          severity: entry.severity === 'high' ? 'HIGH' : entry.severity === 'medium' ? 'MED' : 'LOW',
          description: entry.description,
          regulation: classifyRegulation(entry),
          remediation: remediationText(entry),
        })),
    [normalizedEntries]
  );

  const overallScore = (() => {
    const validScores = complianceItems.filter((item) => item.score > 0).map((item) => item.score);
    return validScores.length > 0 ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length) : 0;
  })();

  const panelStyle: React.CSSProperties = {
    background: 'linear-gradient(160deg, var(--cc-panel-top), var(--cc-panel-bottom))',
    border: '1px solid var(--border)',
    borderRadius: 12,
    boxShadow: 'var(--cc-panel-shadow)',
  };

  const exportBtn: React.CSSProperties = {
    height: 30,
    padding: '0 12px',
    borderRadius: 999,
    background: 'var(--cc-surface-1)',
    border: '1px solid var(--border)',
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fadeScale 220ms ease',
        background: 'radial-gradient(circle at 12% 0%, var(--cc-glow-a), transparent 42%), radial-gradient(circle at 88% 0%, var(--cc-glow-b), transparent 36%)',
      }}
    >
      <div
        style={{
          minHeight: 62,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>Audit & Compliance</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Governance visibility, policy traceability, and decision assurance</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
            Last update {metrics.lastUpdated ? new Date(metrics.lastUpdated).toLocaleTimeString([], { hour12: false }) : '—'}
          </span>
          <button style={exportBtn}>Export PDF</button>
          <button style={exportBtn}>Export Excel</button>
        </div>
      </div>

      <div
        style={{
          minHeight: 48,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          flexShrink: 0,
        }}
      >
        <select value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)} style={{ height: 30, fontSize: 11, padding: '0 10px', background: 'var(--cc-surface-1)' }}>
          <option>All</option>
          {[...new Set(normalizedEntries.map((entry) => entry.agent))].map((agent) => <option key={agent}>{agent}</option>)}
        </select>
        <select value={decisionFilter} onChange={(event) => setDecisionFilter(event.target.value)} style={{ height: 30, fontSize: 11, padding: '0 10px', background: 'var(--cc-surface-1)' }}>
          <option>All</option>
          {[...new Set(normalizedEntries.map((entry) => entry.decision))].filter(Boolean).map((decision) => <option key={decision}>{decision}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search entries..."
          style={{ width: 250, height: 30, fontSize: 11, background: 'var(--cc-surface-1)' }}
        />
      </div>

      <div
        style={{
          minHeight: 44,
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '4px 16px',
          gap: 4,
          flexShrink: 0,
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0 14px',
              height: 30,
              borderRadius: 999,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: `1px solid ${activeTab === tab.id ? 'var(--accent-border)' : 'var(--border)'}`,
              background: activeTab === tab.id ? 'var(--cc-action-primary-bg)' : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 0.81fr)',
          gap: 12,
          overflow: 'hidden',
          padding: '12px',
        }}
      >
        <div style={{ ...panelStyle, minWidth: 0, overflowY: 'auto' }}>
          {activeTab === 'log' && filteredEntries.length === 0 && (
            <div style={{ padding: 20, color: 'var(--text-secondary)', fontSize: 12 }}>No audit entries match the current filters.</div>
          )}
          {activeTab === 'log' && filteredEntries.map((entry, index) => {
            const colors = decisionColors[entry.decision] || decisionColors.RECORDED;
            return (
              <div
                key={`${entry.timestamp}-${index}`}
                style={{
                  minHeight: 72,
                  borderBottom: '1px solid var(--border-subtle)',
                  padding: '13px 16px',
                  animation: `slideInBottom 180ms ease ${index * 22}ms both`,
                  cursor: 'pointer',
                }}
                onMouseEnter={(event) => (event.currentTarget.style.background = 'var(--cc-surface-1)')}
                onMouseLeave={(event) => (event.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.agentColor, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: entry.agentColor }}>{entry.agent}</span>
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '0 4px' }}>{entry.event}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{entry.time}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>{entry.description}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      textTransform: 'uppercase',
                      padding: '3px 10px',
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      color: colors.color,
                      borderRadius: 999,
                    }}
                  >
                    {entry.decision}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '1px 6px' }}>
                    {entry.processingTime > 0 ? `${entry.processingTime}ms` : 'Trace'}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>WHY: </span>
                  {entry.why}
                </div>
              </div>
            );
          })}

          {activeTab === 'decisions' && filteredEntries.filter((entry) => entry.decision !== 'RECORDED').length === 0 && (
            <div style={{ padding: 20, color: 'var(--text-secondary)', fontSize: 12 }}>No decision entries are available yet.</div>
          )}
          {activeTab === 'decisions' && filteredEntries.filter((entry) => entry.decision !== 'RECORDED').map((entry, index) => {
            const colors = decisionColors[entry.decision] || decisionColors.RECORDED;
            return (
              <div
                key={`${entry.timestamp}-decision-${index}`}
                className="tile"
                style={{
                  minHeight: 84,
                  margin: 10,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  borderRadius: 10,
                  background: 'var(--cc-surface-1)',
                }}
                onMouseEnter={(event) => (event.currentTarget.style.borderColor = 'var(--border-hover)')}
                onMouseLeave={(event) => (event.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.agentColor }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, flex: 1 }}>{entry.agent}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 12px',
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      color: colors.color,
                      textTransform: 'uppercase',
                      borderRadius: 999,
                    }}
                  >
                    {entry.decision}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{entry.time}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Reason: {entry.why}
                </div>
              </div>
            );
          })}

          {activeTab === 'violations' && violations.length === 0 && (
            <div style={{ padding: 20, color: 'var(--text-secondary)', fontSize: 12 }}>No current policy violations detected from recorded audit activity.</div>
          )}
          {activeTab === 'violations' && violations.map((violation, index) => (
            <div key={`${violation.description}-${index}`} style={{ height: 64, borderBottom: '1px solid var(--border-subtle)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  background: violation.severity === 'HIGH' ? 'rgba(255,45,85,0.1)' : violation.severity === 'MED' ? 'rgba(255,184,0,0.1)' : 'var(--bg-tile)',
                  border: `1px solid ${violation.severity === 'HIGH' ? 'var(--border-danger)' : violation.severity === 'MED' ? 'var(--border-warning)' : 'var(--border)'}`,
                  color: violation.severity === 'HIGH' ? 'var(--status-danger)' : violation.severity === 'MED' ? 'var(--status-warning)' : 'var(--text-secondary)',
                  flexShrink: 0,
                }}
              >
                {violation.severity}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>{violation.description}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{violation.remediation}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '1px 6px' }}>{violation.regulation}</span>
            </div>
          ))}

          {activeTab === 'compliance' && (
            <div style={{ padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 16 }}>COMPLIANCE OVERVIEW</div>
              {complianceItems.map((item) => (
                <div key={item.name} style={{ height: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, width: 110 }}>{item.name}</span>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={item.score} color={item.score >= 80 ? 'var(--green-primary)' : item.score >= 60 ? 'var(--status-warning)' : 'var(--status-danger)'} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, width: 40, textAlign: 'right', color: item.score >= 80 ? 'var(--green-primary)' : item.score >= 60 ? 'var(--status-warning)' : 'var(--status-danger)' }}>{item.score}%</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'Total Decisions', value: String(decisionTotal) },
                { label: 'Recorded Runs', value: String(metrics.totalRuns || 0) },
                { label: 'Pending Approvals', value: String(metrics.pendingApprovals || 0) },
                { label: 'Failed Today', value: String(metrics.failedToday || 0) },
                { label: 'Critical Alerts', value: String(metrics.criticalAlerts || 0) },
                { label: 'Automation Rate', value: `${automationRate}%` },
              ].map((metric, index) => (
                <div key={metric.label} className="tile" style={{ padding: 16, borderRadius: 10, background: 'var(--cc-surface-1)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: index === 5 ? 'var(--status-success)' : 'var(--text-primary)' }}>{metric.value}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{metric.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ minWidth: 0, display: 'grid', gridTemplateRows: '1.3fr 0.7fr', gap: 12, overflow: 'hidden' }}>
          <div style={{ ...panelStyle, overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>COMPLIANCE SCORECARD</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 16 }}>
                Last assessment: {metrics.lastUpdated ? new Date(metrics.lastUpdated).toLocaleString() : 'No assessment yet'}
              </div>
              {complianceItems.map((item) => (
                <div key={item.name} style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, width: 110 }}>{item.name}</span>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={item.score} color={item.score >= 80 ? 'var(--green-primary)' : item.score >= 60 ? 'var(--status-warning)' : 'var(--status-danger)'} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: item.score >= 80 ? 'var(--green-primary)' : item.score >= 60 ? 'var(--status-warning)' : 'var(--status-danger)', width: 35, textAlign: 'right' }}>{item.score > 0 ? `${item.score}%` : 'N/A'}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', padding: '12px 0', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>OVERALL</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: overallScore >= 80 ? 'var(--cc-ok-bg)' : 'var(--cc-warn-bg)',
                      border: `1px solid ${overallScore >= 80 ? 'var(--cc-ok-border)' : 'var(--cc-warn-border)'}`,
                      color: overallScore >= 80 ? 'var(--status-success)' : 'var(--status-warning)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {overallScore >= 80 ? 'Compliant' : overallScore > 0 ? 'Need Attention' : 'Awaiting Data'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: overallScore >= 80 ? 'var(--status-success)' : overallScore > 0 ? 'var(--status-warning)' : 'var(--text-muted)' }}>{overallScore > 0 ? `${overallScore}%` : '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ ...panelStyle, overflow: 'hidden' }}>
            <div style={{ padding: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>DECISIONS THIS WEEK</div>
              {[
                { label: 'Approved', count: approvedCount, color: 'var(--status-success)' },
                { label: 'Flagged', count: flaggedCount, color: 'var(--status-warning)' },
                { label: 'Rejected', count: rejectedCount, color: 'var(--status-danger)' },
                { label: 'Escalated', count: escalatedCount, color: 'var(--status-info)' },
                { label: 'Human Review', count: Number(metrics.pendingApprovals || 0), color: 'var(--status-warning)' },
              ].map((decision) => (
                <div key={decision.label} style={{ height: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: decision.color }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, width: 90 }}>{decision.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, width: 40, textAlign: 'right' }}>{decision.count}</span>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={decisionTotal > 0 ? (decision.count / decisionTotal) * 100 : 0} color={decision.color} height={3} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: 'var(--cc-ok-bg)',
                    border: '1px solid var(--cc-ok-border)',
                    color: 'var(--status-success)',
                  }}
                >
                  {automationRate}% AUTONOMOUS
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: Number(metrics.criticalAlerts || 0) > 0 ? 'var(--cc-danger-bg)' : 'var(--cc-surface-1)',
                    border: `1px solid ${Number(metrics.criticalAlerts || 0) > 0 ? 'var(--cc-danger-border)' : 'var(--border)'}`,
                    color: Number(metrics.criticalAlerts || 0) > 0 ? 'var(--status-danger)' : 'var(--text-secondary)',
                  }}
                >
                  {Number(metrics.criticalAlerts || 0)} CRITICAL ALERTS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditCompliance;