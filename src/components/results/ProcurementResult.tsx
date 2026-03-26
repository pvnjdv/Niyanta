import React from 'react';

const ProcurementResult: React.FC<{ result: Record<string, unknown> }> = ({ result }) => {
  const chain = (result.approval_chain as Array<Record<string, unknown>>) || [];
  const flags = (result.compliance_flags as Array<Record<string, unknown>>) || [];

  return (
    <div style={{ display: 'grid', gap: 10, fontSize: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>{String(result.item || 'Procurement Item')}</strong>
        <span style={{ border: '1px solid var(--border)', borderRadius: 999, padding: '2px 8px' }}>{String(result.decision || 'N/A')}</span>
      </div>
      <div>Estimated Cost: {String(result.estimated_cost || 'N/A')} {String(result.currency || '')}</div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Approval Chain</div>
        {chain.map((c, i) => <div key={i}>{String(c.step || i + 1)}. {String(c.role || 'Approver')} - {String(c.status || 'PENDING')}</div>)}
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Compliance Flags</div>
        {flags.length === 0 ? <div style={{ color: 'var(--text-muted)' }}>No compliance flags</div> : flags.map((f, i) => <div key={i}>{String(f.flag || 'Flag')} ({String(f.severity || 'N/A')})</div>)}
      </div>
    </div>
  );
};

export default ProcurementResult;
