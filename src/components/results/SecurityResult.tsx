import React from 'react';

const SecurityResult: React.FC<{ result: Record<string, unknown> }> = ({ result }) => {
  const severity = String(result.severity || 'LOW');
  const actions = (result.immediate_actions as Array<Record<string, unknown>>) || [];
  const affected = (result.affected as Record<string, unknown>) || {};

  return (
    <div style={{ display: 'grid', gap: 10, fontSize: 12 }}>
      <div style={{ border: `1px solid ${severity === 'CRITICAL' ? 'var(--red)' : 'var(--amber)'}`, borderRadius: 8, padding: 10, animation: severity === 'CRITICAL' ? 'criticalPulse 1.4s infinite' : undefined }}>
        <strong>{severity}</strong> · {String(result.event_type || 'Security Event')}
      </div>
      <div>Affected users: {Array.isArray(affected.users) ? affected.users.length : 0} · systems: {Array.isArray(affected.systems) ? affected.systems.length : 0}</div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Immediate Actions</div>
        {actions.map((a, i) => <div key={i}>{String(a.priority || i + 1)}. {String(a.action || 'Action')}</div>)}
      </div>
      <div>Escalation: {String(result.escalation_contact || 'N/A')}</div>
    </div>
  );
};

export default SecurityResult;
