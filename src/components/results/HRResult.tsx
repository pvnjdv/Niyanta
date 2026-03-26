import React, { useState } from 'react';

interface ChecklistItem {
  task?: string;
  owner?: string;
  status?: string;
}

const HRResult: React.FC<{ result: Record<string, unknown> }> = ({ result }) => {
  const [tab, setTab] = useState<'preboarding' | 'day_one' | 'week_one' | 'month_one'>('preboarding');
  const checklist = (result.checklist as Record<string, ChecklistItem[]>) || {};
  const employee = (result.employee as Record<string, unknown>) || {};
  const docs = (result.documents_needed as Record<string, unknown>[]) || [];
  const access = (result.system_access as Record<string, unknown>[]) || [];

  return (
    <div style={{ display: 'grid', gap: 10, fontSize: 12 }}>
      <div><strong>{String(employee.name || 'Employee')}</strong> · {String(employee.role || 'Role')} · {String(employee.department || 'Dept')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
        {(['preboarding', 'day_one', 'week_one', 'month_one'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ border: '1px solid var(--border)', background: tab === t ? 'var(--bg-active)' : 'var(--bg-panel)', color: 'var(--text-primary)', borderRadius: 6, padding: '5px 6px', fontSize: 11 }}>{t.replace('_', ' ').toUpperCase()}</button>
        ))}
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
        {(checklist[tab] || []).map((item, i) => <div key={i} style={{ padding: '6px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>{item.task || 'Task'} <span style={{ color: 'var(--text-muted)' }}>({item.owner || 'Owner'} · {item.status || 'PENDING'})</span></div>)}
      </div>
      <div><strong>Documents:</strong> {docs.length}</div>
      <div><strong>System Access:</strong> {access.length}</div>
    </div>
  );
};

export default HRResult;
