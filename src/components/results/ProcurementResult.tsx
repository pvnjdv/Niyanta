import React from 'react';
import Badge from '../shared/Badge';
import { ProcurementResult as ProcurementResultType } from '../../types';

interface ProcurementResultProps {
  result: ProcurementResultType;
}

const ProcurementResult: React.FC<ProcurementResultProps> = ({ result }) => {
  const sectionStyle: React.CSSProperties = {
    marginBottom: 16,
  };

  const itemStyle: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 18,
    color: 'var(--text-primary)',
    marginBottom: 4,
  };

  const requestIdStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    color: 'var(--text-muted)',
    marginBottom: 12,
  };

  const chipsRowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  };

  const costStyle: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 32,
    color: 'var(--text-primary)',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  };

  const getDecisionStyle = (decision: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
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
      case 'PROCEED':
        return { ...baseStyle, backgroundColor: 'rgba(0, 230, 118, 0.15)', border: '1px solid var(--green)', color: 'var(--green)' };
      case 'HOLD':
        return { ...baseStyle, backgroundColor: 'rgba(255, 215, 64, 0.15)', border: '1px solid var(--amber)', color: 'var(--amber)' };
      case 'REJECT':
        return { ...baseStyle, backgroundColor: 'rgba(255, 23, 68, 0.15)', border: '1px solid var(--red)', color: 'var(--red)' };
      case 'ESCALATE':
        return { ...baseStyle, backgroundColor: 'rgba(0, 212, 255, 0.15)', border: '1px solid #00D4FF', color: '#00D4FF' };
      default:
        return baseStyle;
    }
  };

  const getDecisionText = (decision: string): string => {
    switch (decision) {
      case 'PROCEED': return '✓ PROCEED WITH PURCHASE';
      case 'HOLD': return '⏸ ON HOLD';
      case 'REJECT': return '✗ REJECTED';
      case 'ESCALATE': return '↑ ESCALATE FOR APPROVAL';
      default: return decision;
    }
  };

  const headerStyle: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 10,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
    marginBottom: 12,
  };

  const approvalChainStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    marginBottom: 16,
    overflowX: 'auto',
    paddingBottom: 8,
  };

  const stepStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 80,
  };

  const stepCircleStyle = (isRequired: boolean): React.CSSProperties => ({
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: `1px solid ${isRequired ? '#FF6B6B' : 'var(--border)'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    color: isRequired ? '#FF6B6B' : 'var(--text-muted)',
    marginBottom: 6,
  });

  const stepLabelStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: 'var(--text-primary)',
    textAlign: 'center',
  };

  const stepRoleStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: 'var(--text-muted)',
    textAlign: 'center',
  };

  const connectorStyle: React.CSSProperties = {
    flex: 1,
    height: 1,
    borderTop: '1px dashed var(--border)',
    minWidth: 20,
    marginTop: -20,
  };

  const flagStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 23, 68, 0.05)',
    borderLeft: '3px solid var(--red)',
    padding: '8px 12px',
    marginBottom: 8,
    borderRadius: '0 4px 4px 0',
  };

  const flagTextStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: 'var(--text-primary)',
    marginBottom: 4,
  };

  const flagActionStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: 'var(--text-muted)',
  };

  const timelineRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    marginBottom: 8,
  };

  const stepItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  };

  const stepNumberStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    color: '#FF6B6B',
    minWidth: 20,
  };

  const stepTextStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--text-primary)',
  };

  const getUrgencyType = (urgency: string): 'danger' | 'warning' | 'muted' | 'success' => {
    switch (urgency) {
      case 'CRITICAL': return 'danger';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'muted';
      case 'LOW': return 'success';
      default: return 'muted';
    }
  };

  return (
    <div>
      <div style={sectionStyle}>
        <div style={itemStyle}>{result.item}</div>
        <div style={requestIdStyle}>{result.request_id}</div>
        <div style={chipsRowStyle}>
          <Badge text={result.category} type="info" size="sm" />
          <Badge text={result.department} type="muted" size="sm" />
          <Badge text={result.requester} type="muted" size="sm" />
          <Badge text={result.urgency} type={getUrgencyType(result.urgency)} size="sm" />
        </div>
      </div>

      <div style={costStyle}>
        {result.estimated_cost}
        <Badge text={result.currency || 'USD'} type="muted" size="md" />
      </div>

      <div style={getDecisionStyle(result.decision)}>{getDecisionText(result.decision)}</div>

      {result.approval_chain && result.approval_chain.length > 0 && (
        <div style={sectionStyle}>
          <div style={headerStyle}>APPROVAL CHAIN</div>
          <div style={approvalChainStyle}>
            {result.approval_chain.map((step, index) => (
              <React.Fragment key={index}>
                <div style={stepStyle}>
                  <div style={stepCircleStyle(step.status === 'REQUIRED')}>{step.step}</div>
                  <div style={stepLabelStyle}>{step.approver}</div>
                  <div style={stepRoleStyle}>{step.role}</div>
                  <Badge text={step.status} type={step.status === 'REQUIRED' ? 'warning' : 'muted'} size="sm" />
                </div>
                {index < result.approval_chain.length - 1 && <div style={connectorStyle} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {result.compliance_flags && result.compliance_flags.length > 0 && (
        <div style={sectionStyle}>
          <div style={headerStyle}>COMPLIANCE FLAGS</div>
          {result.compliance_flags.map((flag, index) => (
            <div key={index} style={flagStyle}>
              <div style={flagTextStyle}>
                <Badge text={flag.severity} type={flag.severity === 'HIGH' ? 'danger' : 'warning'} size="sm" /> {flag.flag}
              </div>
              <div style={flagActionStyle}>Action: {flag.action_required}</div>
            </div>
          ))}
        </div>
      )}

      {result.timeline && (
        <div style={sectionStyle}>
          <div style={headerStyle}>TIMELINE</div>
          <div style={timelineRowStyle}>
            <Badge text={`Approval by: ${result.timeline.approval_deadline}`} type="warning" size="sm" />
            <Badge text={`Delivery: ${result.timeline.expected_delivery}`} type="info" size="sm" />
            {result.timeline.contract_required && <Badge text="Contract Required" type="danger" size="sm" />}
          </div>
        </div>
      )}

      {result.next_steps && result.next_steps.length > 0 && (
        <div style={sectionStyle}>
          <div style={headerStyle}>NEXT STEPS</div>
          <div>
            {result.next_steps.map((step, index) => (
              <div key={index} style={stepItemStyle}>
                <span style={stepNumberStyle}>{index + 1}.</span>
                <span style={stepTextStyle}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementResult;
