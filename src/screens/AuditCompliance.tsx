import React, { useMemo, useState } from 'react';
import ProgressBar from '../components/shared/ProgressBar';

const AuditCompliance: React.FC<{ auditEntries: unknown[] }> = ({ auditEntries }) => {
  const [activeTab, setActiveTab] = useState<'log' | 'decisions' | 'compliance' | 'violations' | 'metrics'>('log');
  const [agentFilter, setAgentFilter] = useState('All');
  const [decisionFilter, setDecisionFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs: Array<{ id: 'log' | 'decisions' | 'compliance' | 'violations' | 'metrics'; label: string }> = [
    { id: 'log', label: 'WHY-CHAIN LOG' },
    { id: 'decisions', label: 'DECISIONS' },
    { id: 'compliance', label: 'COMPLIANCE' },
    { id: 'violations', label: 'POLICY VIOLATIONS' },
    { id: 'metrics', label: 'METRICS' },
  ];

  const fallbackEntries = [
    { agent: 'Invoice Processor', agentColor: '#888888', event: 'agent_execution', description: 'Invoice INV-2024-441 processed. Auto-approved: $48,816 within policy threshold.', decision: 'AUTO-APPROVE', why: 'Amount under $50K threshold, vendor CloudSphere LLC verified, no anomalies detected', time: '14:32:01', processingTime: 2340 },
    { agent: 'Meeting Intelligence', agentColor: '#666666', event: 'transcript_analysis', description: 'Q4 planning meeting analyzed: 3 decisions, 5 action items, 2 risks identified.', decision: 'APPROVED', why: 'All action items assigned with deadlines, budget decision within authority', time: '14:28:15', processingTime: 1890 },
    { agent: 'Document Intelligence', agentColor: '#AAAAAA', event: 'document_classification', description: 'Classified 12 documents: 4 contracts, 3 invoices, 5 reports.', decision: 'APPROVED', why: 'Documents matched known templates with >95% confidence', time: '14:22:44', processingTime: 3120 },
    { agent: 'Invoice Processor', agentColor: '#888888', event: 'compliance_check', description: 'Invoice INV-2024-442 flagged: vendor not in approved list.', decision: 'FLAG', why: 'New vendor requires procurement approval before payment processing', time: '14:18:09', processingTime: 2780 },
    { agent: 'Document Intelligence', agentColor: '#AAAAAA', event: 'anomaly_detection', description: 'Contract CLT-2024-089 contains non-standard liability clause.', decision: 'CRITICAL', why: 'Unlimited liability exposure detected, requires legal review', time: '14:10:22', processingTime: 4200 },
  ];

  const normalizedEntries = useMemo(() => {
    const fromApi = (Array.isArray(auditEntries) ? auditEntries : []).map((raw) => {
      const row = (raw || {}) as Record<string, unknown>;
      const agentId = String(row.agent_id || row.agentId || 'system');
      const event = String(row.event_type || row.eventType || row.event || 'audit_event');
      const decision = row.decision ? String(row.decision).toUpperCase() : '';
      const description = String(row.event || row.description || 'Audit event recorded');
      const timestamp = String(row.timestamp || new Date().toISOString());
      const processingTime = Number(row.processing_time_ms || row.processingTime || 0) || 0;
      const why = decision
        ? `Decision ${decision} recorded for ${agentId}.`
        : 'Event logged for governance traceability.';
      return {
        agent: agentId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        agentColor: 'var(--status-info)',
        event,
        description,
        decision: decision || 'APPROVED',
        why,
        time: new Date(timestamp).toLocaleTimeString([], { hour12: false }),
        processingTime,
      };
    });
    return fromApi.length > 0 ? fromApi : fallbackEntries;
  }, [auditEntries]);

  const decisionColors: Record<string, { bg: string; border: string; color: string }> = {
    'AUTO-APPROVE': { bg: 'var(--cc-ok-bg)', border: 'var(--cc-ok-border)', color: 'var(--status-success)' },
    'APPROVED': { bg: 'var(--cc-ok-bg)', border: 'var(--cc-ok-border)', color: 'var(--status-success)' },
    'FLAG': { bg: 'var(--cc-warn-bg)', border: 'var(--cc-warn-border)', color: 'var(--status-warning)' },
    'REJECTED': { bg: 'var(--cc-danger-bg)', border: 'var(--cc-danger-border)', color: 'var(--status-danger)' },
    'CRITICAL': { bg: 'var(--cc-danger-bg)', border: 'var(--cc-danger-border)', color: 'var(--status-danger)' },
  };

  const complianceItems = [
    { name: 'GDPR', score: 72 },
    { name: 'PCI-DSS', score: 58 },
    { name: 'SOX', score: 89 },
    { name: 'ISO 27001', score: 91 },
    { name: 'HIPAA', score: 0 },
  ];

  const violations = [
    { severity: 'HIGH', description: 'TLS 1.0 still in transit for payment processing endpoints', regulation: 'PCI-DSS', remediation: 'Upgrade to TLS 1.2+ immediately' },
    { severity: 'MED', description: 'EU user data processed without updated DPIA', regulation: 'GDPR', remediation: 'Complete DPIA for payments launch' },
    { severity: 'LOW', description: 'Missing SOC2 Type II audit schedule', regulation: 'SOX', remediation: 'Schedule audit for Q1 2025' },
  ];

  const overallScore = Math.round(complianceItems.filter(c => c.score > 0).reduce((a, c) => a + c.score, 0) / complianceItems.filter(c => c.score > 0).length);

  const filteredEntries = normalizedEntries.filter(e => {
    if (agentFilter !== 'All' && e.agent !== agentFilter) return false;
    if (decisionFilter !== 'All' && e.decision !== decisionFilter) return false;
    if (searchTerm && !`${e.description} ${e.why}`.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

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
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'fadeScale 220ms ease',
      background: 'radial-gradient(circle at 12% 0%, var(--cc-glow-a), transparent 42%), radial-gradient(circle at 88% 0%, var(--cc-glow-b), transparent 36%)',
    }}>
      {/* Header */}
      <div style={{
        minHeight: 62,
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>Audit & Compliance</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Governance visibility, policy traceability, and decision assurance</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={exportBtn}>Export PDF</button>
          <button style={exportBtn}>Export Excel</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        minHeight: 48,
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        flexShrink: 0,
      }}>
        <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} style={{ height: 30, fontSize: 11, padding: '0 10px', background: 'var(--cc-surface-1)' }}>
          <option>All</option>
          {[...new Set(normalizedEntries.map(e => e.agent))].map(a => <option key={a}>{a}</option>)}
        </select>
        <select value={decisionFilter} onChange={e => setDecisionFilter(e.target.value)} style={{ height: 30, fontSize: 11, padding: '0 10px', background: 'var(--cc-surface-1)' }}>
          <option>All</option>
          {['AUTO-APPROVE', 'APPROVED', 'FLAG', 'REJECTED', 'CRITICAL'].map(d => <option key={d}>{d}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search entries..."
          style={{ width: 250, height: 30, fontSize: 11, background: 'var(--cc-surface-1)' }}
        />
      </div>

      {/* Tab Row */}
      <div style={{
        minHeight: 44,
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '4px 16px',
        gap: 4,
        flexShrink: 0,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '0 14px',
            height: 30,
            borderRadius: 999,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: `1px solid ${activeTab === t.id ? 'var(--accent-border)' : 'var(--border)'}`,
            background: activeTab === t.id ? 'var(--cc-action-primary-bg)' : 'transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden', padding: '12px' }}>
        {/* Left — Main content */}
        <div style={{ ...panelStyle, flex: 65, overflowY: 'auto' }}>
          {activeTab === 'log' && filteredEntries.map((entry, i) => {
            const dc = decisionColors[entry.decision] || decisionColors.FLAG;
            return (
              <div key={i} style={{
                minHeight: 72,
                borderBottom: '1px solid var(--border-subtle)',
                padding: '13px 16px',
                animation: `slideInBottom 180ms ease ${i * 22}ms both`,
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--cc-surface-1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase',
                    padding: '3px 10px', background: dc.bg, border: `1px solid ${dc.border}`, color: dc.color,
                    borderRadius: 999,
                  }}>{entry.decision}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '1px 6px' }}>{entry.processingTime}ms</span>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>WHY: </span>{entry.why}
                </div>
              </div>
            );
          })}

          {activeTab === 'decisions' && filteredEntries.filter(e => e.decision).map((entry, i) => {
            const dc = decisionColors[entry.decision] || decisionColors.FLAG;
            return (
              <div key={i} className="tile" style={{
                minHeight: 84,
                margin: 10,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                borderRadius: 10,
                background: 'var(--cc-surface-1)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.agentColor }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, flex: 1 }}>{entry.agent}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, padding: '4px 12px',
                    background: dc.bg, border: `1px solid ${dc.border}`, color: dc.color, textTransform: 'uppercase', borderRadius: 999,
                  }}>{entry.decision}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{entry.time}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Reason: {entry.why}
                </div>
              </div>
            );
          })}

          {activeTab === 'violations' && violations.map((v, i) => (
            <div key={i} style={{
              height: 64, borderBottom: '1px solid var(--border-subtle)', padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', padding: '3px 8px',
                background: v.severity === 'HIGH' ? 'rgba(255,45,85,0.1)' : v.severity === 'MED' ? 'rgba(255,184,0,0.1)' : 'var(--bg-tile)',
                border: `1px solid ${v.severity === 'HIGH' ? 'var(--border-danger)' : v.severity === 'MED' ? 'var(--border-warning)' : 'var(--border)'}`,
                color: v.severity === 'HIGH' ? 'var(--status-danger)' : v.severity === 'MED' ? 'var(--status-warning)' : 'var(--text-secondary)',
                flexShrink: 0,
              }}>{v.severity}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>{v.description}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{v.remediation}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '1px 6px' }}>{v.regulation}</span>
            </div>
          ))}

          {activeTab === 'compliance' && (
            <div style={{ padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 16 }}>COMPLIANCE OVERVIEW</div>
              {complianceItems.map((c, i) => (
                <div key={i} style={{ height: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, width: 80 }}>{c.name}</span>
                  <div style={{ flex: 1 }}><ProgressBar value={c.score} color={c.score === 0 ? 'var(--text-muted)' : c.score >= 80 ? 'var(--green-primary)' : c.score >= 60 ? 'var(--status-warning)' : 'var(--status-danger)'} /></div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, width: 40, textAlign: 'right', color: c.score === 0 ? 'var(--text-muted)' : c.score >= 80 ? 'var(--green-primary)' : c.score >= 60 ? 'var(--status-warning)' : 'var(--status-danger)' }}>{c.score === 0 ? 'N/A' : `${c.score}%`}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'Total Decisions', value: '847' },
                { label: 'Auto-Approved', value: '652' },
                { label: 'Flagged', value: '143' },
                { label: 'Rejected', value: '38' },
                { label: 'Escalated', value: '14' },
                { label: 'Automation Rate', value: '77%' },
              ].map((m, i) => (
                <div key={i} className="tile" style={{ padding: 16, borderRadius: 10, background: 'var(--cc-surface-1)' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: i === 5 ? 'var(--status-success)' : 'var(--text-primary)' }}>{m.value}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{m.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Scorecard */}
        <div style={{ ...panelStyle, flex: 35, overflowY: 'auto' }}>
          {/* Compliance Scorecard */}
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 4 }}>COMPLIANCE SCORECARD</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 16 }}>Last assessment: Today 14:32</div>
            {complianceItems.map((c, i) => (
              <div key={i} style={{ height: 40, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, width: 70 }}>{c.name}</span>
                <div style={{ flex: 1 }}><ProgressBar value={c.score} color={c.score === 0 ? 'var(--text-muted)' : c.score >= 80 ? 'var(--green-primary)' : c.score >= 60 ? 'var(--status-warning)' : 'var(--status-danger)'} /></div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: c.score === 0 ? 'var(--text-muted)' : c.score >= 80 ? 'var(--green-primary)' : c.score >= 60 ? 'var(--status-warning)' : 'var(--status-danger)', width: 35, textAlign: 'right' }}>{c.score === 0 ? 'N/A' : `${c.score}%`}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', padding: '12px 0', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>OVERALL</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: overallScore >= 80 ? 'var(--status-success)' : 'var(--status-warning)' }}>{overallScore}%</span>
            </div>
            <span style={{
              display: 'inline-flex',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              padding: '4px 10px',
              borderRadius: 999,
              background: overallScore >= 80 ? 'var(--cc-ok-bg)' : 'var(--cc-warn-bg)',
              border: `1px solid ${overallScore >= 80 ? 'var(--cc-ok-border)' : 'var(--cc-warn-border)'}`,
              color: overallScore >= 80 ? 'var(--status-success)' : 'var(--status-warning)',
            }}>{overallScore >= 80 ? 'COMPLIANT' : 'NEEDS ATTENTION'}</span>
          </div>

          {/* Decisions Summary */}
          <div style={{ padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>DECISIONS THIS WEEK</div>
            {[
              { label: 'Approved', count: 652 },
              { label: 'Flagged', count: 143 },
              { label: 'Rejected', count: 38 },
              { label: 'Escalated', count: 14 },
              { label: 'Human Review', count: 52 },
            ].map((d, i) => (
              <div key={i} style={{ height: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: i === 0 ? 'var(--status-success)' : i === 1 ? 'var(--status-warning)' : i === 2 ? 'var(--status-danger)' : 'var(--status-info)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, width: 90 }}>{d.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, width: 40, textAlign: 'right' }}>{d.count}</span>
                <div style={{ flex: 1 }}><ProgressBar value={(d.count / 652) * 100} color="var(--green-primary)" height={3} /></div>
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <span style={{
                display: 'inline-flex',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                padding: '4px 12px',
                borderRadius: 999,
                background: 'var(--cc-ok-bg)',
                border: '1px solid var(--cc-ok-border)',
                color: 'var(--status-success)',
              }}>77% AUTONOMOUS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditCompliance;
