import React from 'react';

interface Item {
  description?: string;
  quantity?: string | number;
  unit_price?: string | number;
  total?: string | number;
}

interface Anomaly {
  type?: string;
  description?: string;
  severity?: string;
}

const InvoiceResult: React.FC<{ result: Record<string, unknown> }> = ({ result }) => {
  const items = (result.line_items as Item[]) || [];
  const anomalies = (result.anomalies as Anomaly[]) || [];
  const decision = String(result.decision || 'N/A');

  return (
    <div style={{ display: 'grid', gap: 10, fontSize: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>{String(result.vendor || 'Unknown Vendor')}</strong>
        <span style={{ border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 999, color: decision.includes('REJECT') ? 'var(--red)' : decision.includes('FLAG') ? 'var(--amber)' : 'var(--green)' }}>{decision}</span>
      </div>
      <div>Invoice #{String(result.invoice_number || 'N/A')} · Total {String(result.amount_total || 'N/A')} {String(result.currency || '')}</div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8 }}>
        <div style={{ padding: '8px 10px', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>Line Items</div>
        {items.length === 0 ? <div style={{ padding: 10, color: 'var(--text-muted)' }}>No line items</div> : items.map((it, i) => <div key={i} style={{ padding: '8px 10px', borderTop: i ? '1px solid var(--border)' : 'none' }}>{it.description || 'Item'} · {String(it.quantity || 0)} x {String(it.unit_price || 0)} = {String(it.total || 0)}</div>)}
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 8 }}>
        <div style={{ padding: '8px 10px', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>Anomalies</div>
        {anomalies.length === 0 ? <div style={{ padding: 10, color: 'var(--text-muted)' }}>No anomalies detected</div> : anomalies.map((a, i) => <div key={i} style={{ padding: '8px 10px', borderTop: i ? '1px solid var(--border)' : 'none' }}>{a.type || 'Issue'}: {a.description || 'N/A'} <span style={{ color: 'var(--text-muted)' }}>({a.severity || 'N/A'})</span></div>)}
      </div>
    </div>
  );
};

export default InvoiceResult;
