import React from 'react';

const ComplianceResult: React.FC<{ result: Record<string, unknown> }> = ({ result }) => {
  const violations = (result.violations as Array<Record<string, unknown>>) || [];
  const riskScore = Number(result.risk_score || 0);
  const width = Math.max(0, Math.min(100, riskScore));

  return (
    <div style={{ display: 'grid', gap: 10, fontSize: 12 }}>
      <div><strong>Status:</strong> {String(result.compliance_status || 'N/A')}</div>
      <div>
        <div style={{ marginBottom: 4 }}>Risk Score: {riskScore}</div>
        <div style={{ height: 8, borderRadius: 999, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ width: `${width}%`, height: '100%', background: width > 70 ? 'var(--red)' : width > 40 ? 'var(--amber)' : 'var(--green)' }} />
        </div>
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Violations</div>
        {violations.length === 0 ? <div style={{ color: 'var(--text-muted)' }}>No violations listed</div> : violations.map((v, i) => <div key={i}>{String(v.regulation || 'Reg')} - {String(v.description || '')}</div>)}
      </div>
      <div><strong>Regulations:</strong> {Array.isArray(result.regulations_checked) ? result.regulations_checked.join(', ') : 'N/A'}</div>
    </div>
  );
};

export default ComplianceResult;
