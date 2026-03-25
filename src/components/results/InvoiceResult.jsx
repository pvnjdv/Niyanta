import React from 'react';
import Badge from '../shared/Badge';

export default function InvoiceResult({ result }) {
  const sectionStyle = {
    marginBottom: 16,
  };

  const vendorStyle = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 20,
    color: 'var(--text-primary)',
    marginBottom: 4,
  };

  const metaRowStyle = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    color: 'var(--text-muted)',
    marginBottom: 12,
  };

  const amountStyle = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 28,
    color: 'var(--text-primary)',
    marginBottom: 16,
  };

  const getDecisionStyle = (decision) => {
    const baseStyle = {
      width: '100%',
      height: 44,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
      fontFamily: "'Syne', sans-serif",
      fontWeight: 700,
      fontSize: 14,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: 16,
      animation: 'scaleIn 0.3s ease',
    };

    switch (decision) {
      case 'AUTO-APPROVE':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(0, 230, 118, 0.15)',
          border: '1px solid var(--green)',
          color: 'var(--green)',
        };
      case 'FLAG':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 215, 64, 0.15)',
          border: '1px solid var(--amber)',
          color: 'var(--amber)',
        };
      case 'REJECT':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 23, 68, 0.15)',
          border: '1px solid var(--red)',
          color: 'var(--red)',
        };
      default:
        return baseStyle;
    }
  };

  const getDecisionText = (decision) => {
    switch (decision) {
      case 'AUTO-APPROVE':
        return '✓ AUTO-APPROVED';
      case 'FLAG':
        return '⚠ FLAGGED FOR REVIEW';
      case 'REJECT':
        return '✗ REJECTED';
      default:
        return decision;
    }
  };

  const headerStyle = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 10,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
    marginBottom: 8,
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 8,
  };

  const thStyle = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    textAlign: 'left',
    padding: '8px 8px 8px 0',
    borderBottom: '1px solid var(--border)',
  };

  const thRightStyle = {
    ...thStyle,
    textAlign: 'right',
  };

  const tdStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--text-primary)',
    padding: '8px 8px 8px 0',
  };

  const tdRightStyle = {
    ...tdStyle,
    textAlign: 'right',
    fontFamily: "'Space Mono', monospace",
  };

  const anomalyStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  };

  const complianceRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  };

  const footerStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    marginTop: 12,
  };

  const getSeverityType = (severity) => {
    switch (severity) {
      case 'HIGH':
        return 'danger';
      case 'MED':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'muted';
    }
  };

  const getComplianceIcon = (result) => {
    switch (result) {
      case 'PASS':
        return '✓';
      case 'FAIL':
        return '✗';
      case 'WARN':
        return '⚠';
      default:
        return '•';
    }
  };

  const getComplianceType = (result) => {
    switch (result) {
      case 'PASS':
        return 'success';
      case 'FAIL':
        return 'danger';
      case 'WARN':
        return 'warning';
      default:
        return 'muted';
    }
  };

  return (
    <div>
      {/* Vendor Header */}
      <div style={sectionStyle}>
        <div style={vendorStyle}>{result.vendor}</div>
        <div style={metaRowStyle}>
          {result.invoice_number} · {result.invoice_date} · Due: {result.due_date}
        </div>
        <div style={amountStyle}>{result.amount_total}</div>
      </div>

      {/* Decision Badge */}
      <div style={getDecisionStyle(result.decision)}>
        {getDecisionText(result.decision)}
      </div>

      {/* Line Items */}
      {result.line_items && result.line_items.length > 0 && (
        <div style={sectionStyle}>
          <div style={headerStyle}>LINE ITEMS</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Description</th>
                <th style={thRightStyle}>Qty</th>
                <th style={thRightStyle}>Unit Price</th>
                <th style={thRightStyle}>Total</th>
              </tr>
            </thead>
            <tbody>
              {result.line_items.map((item, index) => (
                <tr key={index}>
                  <td style={tdStyle}>{item.description}</td>
                  <td style={tdRightStyle}>{item.quantity}</td>
                  <td style={tdRightStyle}>{item.unit_price}</td>
                  <td style={tdRightStyle}>{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Anomalies */}
      {result.anomalies && result.anomalies.length > 0 && (
        <div style={sectionStyle}>
          <div style={headerStyle}>ANOMALIES DETECTED</div>
          {result.anomalies.map((anomaly, index) => (
            <div key={index} style={anomalyStyle}>
              <Badge text={anomaly.severity} type={getSeverityType(anomaly.severity)} size="sm" />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--text-primary)' }}>
                {anomaly.description}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Compliance Checks */}
      {result.compliance_checks && result.compliance_checks.length > 0 && (
        <div style={sectionStyle}>
          <div style={headerStyle}>COMPLIANCE CHECKS</div>
          <div style={complianceRowStyle}>
            {result.compliance_checks.map((check, index) => (
              <Badge
                key={index}
                text={`${getComplianceIcon(check.result)} ${check.check}`}
                type={getComplianceType(check.result)}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Badge text={`Approver: ${result.recommended_approver}`} type="muted" size="sm" />
      </div>
      <div style={footerStyle}>{result.decision_reason}</div>
    </div>
  );
}
