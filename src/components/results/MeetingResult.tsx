import React from 'react';

interface DecisionItem {
  id?: number;
  text?: string;
  owner?: string;
  impact?: string;
}

interface TaskItem {
  id?: number;
  title?: string;
  owner?: string;
  deadline?: string;
  priority?: string;
  status?: string;
}

interface RiskItem {
  text?: string;
  severity?: string;
  mitigation?: string;
}

const MeetingResult: React.FC<{ result: Record<string, unknown> }> = ({ result }) => {
  const decisions = (result.decisions as DecisionItem[]) || [];
  const tasks = (result.tasks as TaskItem[]) || [];
  const risks = (result.risks as RiskItem[]) || [];

  return (
    <div style={{ display: 'grid', gap: 10, fontSize: 12 }}>
      <div><strong>Summary:</strong> {String(result.summary || 'No summary')}</div>
      <div><strong>Sentiment:</strong> {String(result.sentiment || 'N/A')}</div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Decisions</div>
        {decisions.length === 0 ? <div style={{ padding: 10, color: 'var(--text-muted)' }}>No decisions</div> : decisions.map((d, i) => <div key={i} style={{ padding: '8px 10px', borderTop: i ? '1px solid var(--border)' : 'none' }}>{d.text} <span style={{ color: 'var(--text-muted)' }}>({d.owner || 'owner n/a'} · {d.impact || 'impact n/a'})</span></div>)}
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Tasks</div>
        {tasks.length === 0 ? <div style={{ padding: 10, color: 'var(--text-muted)' }}>No tasks</div> : tasks.map((t, i) => <div key={i} style={{ padding: '8px 10px', borderTop: i ? '1px solid var(--border)' : 'none' }}>{t.title || 'Untitled'} <span style={{ color: 'var(--text-muted)' }}>({t.owner || 'owner n/a'} · {t.priority || 'priority n/a'} · {t.deadline || 'deadline n/a'})</span></div>)}
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Risks</div>
        {risks.length === 0 ? <div style={{ padding: 10, color: 'var(--text-muted)' }}>No risks</div> : risks.map((r, i) => <div key={i} style={{ padding: '8px 10px', borderTop: i ? '1px solid var(--border)' : 'none' }}>{r.text || 'Risk'} <span style={{ color: 'var(--text-muted)' }}>({r.severity || 'N/A'})</span></div>)}
      </div>
    </div>
  );
};

export default MeetingResult;
