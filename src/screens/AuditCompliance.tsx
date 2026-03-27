import React, { useState } from 'react';
import ProgressBar from '../components/shared/ProgressBar';

const AuditCompliance: React.FC<{ auditEntries: unknown[] }> = ({ auditEntries }) => {
  const [activeTab, setActiveTab] = useState('log');
  const [agentFilter, setAgentFilter] = useState('All');
  const [decisionFilter, setDecisionFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'log', label: 'WHY-CHAIN LOG' },
    { id: 'decisions', label: 'DECISIONS' },
    { id: 'compliance', label: 'COMPLIANCE' },
    { id: 'violations', label: 'POLICY VIOLATIONS' },
    { id: 'metrics', label: 'METRICS' },
  ];

  const mockEntries = [
    { agent: 'Invoice Processor', agentColor: '#888888', event: 'agent_execution', description: 'Invoice INV-2024-441 processed. Auto-approved: $48,816 within policy threshold.', decision: 'AUTO-APPROVE', why: 'Amount under $50K threshold, vendor CloudSphere LLC verified, no anomalies detected', time: '14:32:01', processingTime: 2340 },
    { agent: 'Meeting Intelligence', agentColor: '#666666', event: 'transcript_analysis', description: 'Q4 Planning Meeting analyzed: 3 decisions, 5 action items, 2 risks identified.', decision: 'APPROVED', why: 'All action items assigned with deadlines, budget decision within authority', time: '14:28:15', processingTime: 1890 },
    { agent: 'Document Intelligence', agentColor: '#AAAAAA', event: 'document_classification', description: 'Classified 12 documents: 4 contracts, 3 invoices, 5 reports.', decision: 'APPROVED', why: 'All documents matched known templates with >95% confidence', time: '14:22:44', processingTime: 3120 },
    { agent: 'Invoice Processor', agentColor: '#888888', event: 'compliance_check', description: 'Invoice INV-2024-442 flagged: vendor not in approved list.', decision: 'FLAG', why: 'New vendor requires procurement approval before payment processing', time: '14:18:09', processingTime: 2780 },
    { agent: 'Meeting Intelligence', agentColor: '#666666', event: 'action_tracking', description: 'Sprint retrospective: 2 overdue action items detected from previous meeting.', decision: 'FLAG', why: 'Items assigned to engineering team exceed 7-day SLA', time: '14:15:33', processingTime: 1560 },
    { agent: 'Document Intelligence', agentColor: '#AAAAAA', event: 'anomaly_detection', description: 'Contract CLT-2024-089 contains non-standard liability clause.', decision: 'CRITICAL', why: 'Unlimited liability exposure detected, requires legal review', time: '14:10:22', processingTime: 4200 },
  ];

  const decisionColors: Record<string, { bg: string; border: string; color: string }> = {
    'AUTO-APPROVE': { bg: 'var(--green-dim)', border: 'var(--green-border)', color: 'var(--green-primary)' },
    'APPROVED': { bg: 'var(--green-dim)', border: 'var(--green-border)', color: 'var(--green-primary)' },
    'FLAG': { bg: 'rgba(255,184,0,0.1)', border: 'var(--border-warning)', color: 'var(--status-warning)' },
    'REJECTED': { bg: 'rgba(255,45,85,0.1)', border: 'var(--border-danger)', color: 'var(--status-danger)' },
    'CRITICAL': { bg: 'rgba(255,45,85,0.15)', border: 'var(--border-danger)', color: 'var(--status-danger)' },
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

  const filteredEntries = mockEntries.filter(e => {
    if (agentFilter !== 'All' && e.agent !== agentFilter) return false;
    if (decisionFilter !== 'All' && e.decision !== decisionFilter) return false;
    if (searchTerm && !e.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeScale 220ms ease' }}>
      {/* Header */}
      <div style={{
        height: 56, borderBottom: '1px solid var(--border)', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>AUDIT & COMPLIANCE</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            height: 28, padding: '0 12px', background: 'transparent',
            border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)',
          }}>EXPORT PDF</button>
          <button style={{
            height: 28, padding: '0 12px', background: 'transparent',
            border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)',
          }}>EXPORT EXCEL</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        height: 40, borderBottom: '1px solid var(--border)', display: 'flex',
        alignItems: 'center', gap: 8, padding: '0 16px', flexShrink: 0,
      }}>
        <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} style={{ height: 26, fontSize: 11, padding: '0 8px' }}>
          <option>All</option>
          {[...new Set(mockEntries.map(e => e.agent))].map(a => <option key={a}>{a}</option>)}
        </select>
        <select value={decisionFilter} onChange={e => setDecisionFilter(e.target.value)} style={{ height: 26, fontSize: 11, padding: '0 8px' }}>
          <option>All</option>
          {['AUTO-APPROVE', 'APPROVED', 'FLAG', 'REJECTED', 'CRITICAL'].map(d => <option key={d}>{d}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search entries..."
          style={{ width: 200, height: 26, fontSize: 11 }}
        />
      </div>

      {/* Tab Row */}
      <div style={{
        height: 40, borderBottom: '1px solid var(--border)', display: 'flex',
        alignItems: 'center', padding: '0 16px', flexShrink: 0,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '0 16px', height: '100%', fontFamily: 'var(--font-mono)', fontSize: 10,
            textTransform: 'uppercase',
            color: activeTab === t.id ? 'var(--green-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === t.id ? '2px solid var(--green-primary)' : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden', padding: '12px 12px 0' }}>
        {/* Left — Main content */}
        <div style={{ flex: 65, overflowY: 'auto' }}>
          {activeTab === 'log' && filteredEntries.map((entry, i) => {
            const dc = decisionColors[entry.decision] || decisionColors.FLAG;
            return (
              <div key={i} style={{
                minHeight: 64, borderBottom: '1px solid var(--border-subtle)', padding: '12px 16px',
                animation: `slideInTop 200ms ease ${i * 30}ms both`,
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tile-hover)')}
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
                    animation: entry.decision === 'CRITICAL' ? 'criticalFlash 2s infinite' : undefined,
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
                height: 80, marginBottom: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.agentColor }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, flex: 1 }}>{entry.agent}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, padding: '4px 12px',
                    background: dc.bg, border: `1px solid ${dc.border}`, color: dc.color, textTransform: 'uppercase',
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
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: 'Total Decisions', value: '847' },
                { label: 'Auto-Approved', value: '652' },
                { label: 'Flagged', value: '143' },
                { label: 'Rejected', value: '38' },
                { label: 'Escalated', value: '14' },
                { label: 'Automation Rate', value: '77%' },
              ].map((m, i) => (
                <div key={i} className="tile" style={{ padding: 16 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: i === 5 ? 'var(--green-primary)' : 'var(--text-primary)' }}>{m.value}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{m.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Scorecard */}
        <div style={{ flex: 35, overflowY: 'auto', background: 'var(--bg-panel)', borderLeft: '1px solid var(--border)' }}>
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
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: overallScore >= 80 ? 'var(--green-primary)' : 'var(--status-warning)' }}>{overallScore}%</span>
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, padding: '3px 8px',
              background: overallScore >= 80 ? 'var(--green-dim)' : 'rgba(255,184,0,0.1)',
              border: `1px solid ${overallScore >= 80 ? 'var(--green-border)' : 'var(--border-warning)'}`,
              color: overallScore >= 80 ? 'var(--green-primary)' : 'var(--status-warning)',
            }}>{overallScore >= 80 ? 'COMPLIANT' : 'NEEDS ATTENTION'}</span>
          </div>

          {/* Decisions Summary */}
          <div style={{ padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>DECISIONS THIS WEEK</div>
            {[
              { icon: '◈', label: 'Approved', count: 652, maxW: 100 },
              { icon: '◇', label: 'Flagged', count: 143, maxW: 100 },
              { icon: '✕', label: 'Rejected', count: 38, maxW: 100 },
              { icon: '!', label: 'Escalated', count: 14, maxW: 100 },
              { icon: '◎', label: 'Human Review', count: 52, maxW: 100 },
            ].map((d, i) => (
              <div key={i} style={{ height: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, width: 20 }}>{d.icon}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, width: 90 }}>{d.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, width: 40, textAlign: 'right' }}>{d.count}</span>
                <div style={{ flex: 1 }}><ProgressBar value={(d.count / 652) * 100} color="var(--green-primary)" height={3} /></div>
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, padding: '4px 12px',
                background: 'var(--green-dim)', border: '1px solid var(--green-border)', color: 'var(--green-primary)',
              }}>77% AUTONOMOUS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditCompliance;
