import React from 'react';
import Badge from '../shared/Badge';

export default function SecurityResult({ result }) {
  const sectionStyle = {
    marginBottom: 16,
  };

  const getSeverityStyle = (severity) => {
    const baseStyle = {
      width: '100%',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
      fontFamily: "'Syne', sans-serif",
      fontWeight: 700,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: 16,
    };

    switch (severity) {
      case 'CRITICAL':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 23, 68, 0.2)',
          border: '1px solid var(--red)',
          color: 'var(--red)',
          animation: 'criticalPulse 2s infinite',
        };
      case 'HIGH':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 215, 64, 0.15)',
          border: '1px solid var(--amber)',
          color: 'var(--amber)',
        };
      case 'MEDIUM':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          border: '1px solid #FF9800',
          color: '#FF9800',
        };
      case 'LOW':
        return {
          ...baseStyle,
          backgroundColor: 'var(--accent-dim)',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
        };
      default:
        return baseStyle;
    }
  };

  const getSeverityText = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return '⚠ CRITICAL THREAT ACTIVE · IMMEDIATE ACTION REQUIRED';
      case 'HIGH':
        return '⚠ HIGH SEVERITY EVENT';
      case 'MEDIUM':
        return 'MEDIUM SEVERITY EVENT';
      case 'LOW':
        return 'LOW SEVERITY NOTICE';
      default:
        return severity;
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

  const chipsRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  };

  const affectedStyle = {
    marginBottom: 8,
  };

  const affectedItemStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 23, 68, 0.1)',
    border: '1px solid rgba(255, 23, 68, 0.3)',
    borderRadius: 4,
    padding: '4px 10px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: 'var(--red)',
    margin: '0 4px 4px 0',
  };

  const dataChipStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 64, 0.1)',
    border: '1px solid rgba(255, 215, 64, 0.3)',
    borderRadius: 4,
    padding: '4px 10px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: 'var(--amber)',
    margin: '0 4px 4px 0',
  };

  const timelineRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    marginBottom: 16,
  };

  const actionRowStyle = (priority) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px',
    borderLeft: priority === 1 ? '3px solid var(--red)' : '3px solid transparent',
    backgroundColor: priority === 1 ? 'rgba(255, 23, 68, 0.05)' : 'transparent',
    borderBottom: '1px solid var(--border-light)',
  });

  const priorityNumberStyle = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 24,
    color: '#FF4488',
    minWidth: 40,
  };

  const actionTextStyle = {
    flex: 1,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: 'var(--text-primary)',
    lineHeight: 1.5,
  };

  const escalationCardStyle = (needsEscalation) => ({
    backgroundColor: needsEscalation ? 'rgba(255, 23, 68, 0.1)' : 'rgba(0, 230, 118, 0.1)',
    border: `1px solid ${needsEscalation ? 'var(--red)' : 'var(--green)'}`,
    borderRadius: 4,
    padding: '12px 16px',
    marginBottom: 16,
  });

  const escalationTitleStyle = (needsEscalation) => ({
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 12,
    color: needsEscalation ? 'var(--red)' : 'var(--green)',
    marginBottom: 4,
  });

  const escalationTextStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--text-muted)',
  };

  const regulatoryChipStyle = (isTrue) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: isTrue ? 'rgba(255, 23, 68, 0.1)' : 'var(--accent-dim)',
    border: `1px solid ${isTrue ? 'var(--red)' : 'var(--border)'}`,
    borderRadius: 4,
    padding: '4px 10px',
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: isTrue ? 'var(--red)' : 'var(--text-muted)',
    margin: '0 4px 4px 0',
  });

  const responseStyle = (level) => {
    const colors = {
      Monitor: 'var(--text-muted)',
      Contain: 'var(--amber)',
      Eradicate: 'var(--red)',
      'Full Incident Response': 'var(--red)',
    };
    const color = colors[level] || 'var(--text-muted)';
    const isPulsing = level === 'Full Incident Response';

    return {
      width: '100%',
      padding: '12px',
      backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
      border: `1px solid ${color}`,
      borderRadius: 4,
      fontFamily: "'Syne', sans-serif",
      fontWeight: 700,
      fontSize: 12,
      textTransform: 'uppercase',
      color: color,
      textAlign: 'center',
      animation: isPulsing ? 'criticalPulse 2s infinite' : 'none',
    };
  };

  return (
    <div>
      {/* Severity Banner */}
      <div style={getSeverityStyle(result.severity)}>
        {getSeverityText(result.severity)}
      </div>

      {/* Incident Metadata */}
      <div style={chipsRowStyle}>
        <Badge text={result.incident_id} type="muted" size="sm" />
        <Badge text={result.event_type} type="danger" size="sm" />
        <Badge text={`Confidence: ${result.confidence}`} type="info" size="sm" />
        <Badge text={result.threat_actor} type="warning" size="sm" />
        <Badge text={result.affected?.blast_radius} type="danger" size="sm" />
      </div>

      {/* Affected Resources */}
      {result.affected && (
        <div style={sectionStyle}>
          <div style={headerStyle}>AFFECTED</div>
          {result.affected.users && result.affected.users.length > 0 && (
            <div style={affectedStyle}>
              {result.affected.users.map((user, index) => (
                <span key={index} style={affectedItemStyle}>
                  👤 {user}
                </span>
              ))}
            </div>
          )}
          {result.affected.systems && result.affected.systems.length > 0 && (
            <div style={affectedStyle}>
              {result.affected.systems.map((system, index) => (
                <span key={index} style={affectedItemStyle}>
                  💻 {system}
                </span>
              ))}
            </div>
          )}
          {result.affected.data_at_risk && result.affected.data_at_risk.length > 0 && (
            <div style={affectedStyle}>
              {result.affected.data_at_risk.map((data, index) => (
                <span key={index} style={dataChipStyle}>
                  🔒 {data}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {result.timeline && (
        <div style={timelineRowStyle}>
          <Badge text={`Detected: ${result.timeline.detected_at}`} type="info" size="sm" />
          <Badge text={`Started: ${result.timeline.started_at}`} type="muted" size="sm" />
          <Badge text={`Duration: ${result.timeline.duration}`} type="muted" size="sm" />
          {result.timeline.still_active && (
            <Badge text="ACTIVE" type="danger" size="sm" />
          )}
        </div>
      )}

      {/* Immediate Actions */}
      {result.immediate_actions && result.immediate_actions.length > 0 && (
        <div style={sectionStyle}>
          <div style={headerStyle}>IMMEDIATE ACTIONS</div>
          {result.immediate_actions.map((action, index) => (
            <div key={index} style={actionRowStyle(action.priority)}>
              <span style={priorityNumberStyle}>{action.priority}</span>
              <span style={actionTextStyle}>{action.action}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <Badge text={action.owner} type="muted" size="sm" />
                <Badge text={action.eta} type="warning" size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Escalation Card */}
      <div style={escalationCardStyle(result.escalate_to_human)}>
        <div style={escalationTitleStyle(result.escalate_to_human)}>
          {result.escalate_to_human
            ? '🚨 HUMAN ESCALATION REQUIRED'
            : '✓ CONTAINED — No human escalation required'}
        </div>
        {result.escalate_to_human && (
          <>
            <Badge text={result.escalation_contact} type="danger" size="sm" />
            <div style={escalationTextStyle}>{result.escalation_reason}</div>
          </>
        )}
      </div>

      {/* Regulatory Impact */}
      {result.regulatory_impact && (
        Object.values(result.regulatory_impact).some(v => v === true) && (
          <div style={sectionStyle}>
            <div style={headerStyle}>REGULATORY IMPACT</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <span style={regulatoryChipStyle(result.regulatory_impact.gdpr)}>GDPR</span>
              <span style={regulatoryChipStyle(result.regulatory_impact.hipaa)}>HIPAA</span>
              <span style={regulatoryChipStyle(result.regulatory_impact.pci)}>PCI</span>
              <span style={regulatoryChipStyle(result.regulatory_impact.sox)}>SOX</span>
            </div>
            {result.regulatory_impact.notification_required && (
              <div style={{ marginTop: 8 }}>
                <Badge text="⚠ REGULATORY NOTIFICATION REQUIRED" type="danger" size="md" />
              </div>
            )}
          </div>
        )
      )}

      {/* Recommended Response Level */}
      {result.recommended_response_level && (
        <div style={responseStyle(result.recommended_response_level)}>
          Recommended: {result.recommended_response_level}
        </div>
      )}
    </div>
  );
}
