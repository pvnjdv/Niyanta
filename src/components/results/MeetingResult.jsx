import React from 'react';
import Badge from '../shared/Badge';

export default function MeetingResult({ result }) {
  const sectionStyle = {
    marginBottom: 16,
  };

  const summaryStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    lineHeight: 1.6,
    color: 'var(--text-primary)',
    marginBottom: 12,
  };

  const chipsRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  };

  const headerTextStyle = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 10,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
  };

  const decisionRowStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '8px 0',
    borderBottom: '1px solid var(--border-light)',
  };

  const decisionNumberStyle = {
    width: 20,
    height: 20,
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    color: '#00D4FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    flexShrink: 0,
  };

  const decisionTextStyle = {
    flex: 1,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: 'var(--text-primary)',
    lineHeight: 1.5,
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

  const tdStyle = (index) => ({
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--text-primary)',
    padding: '8px 8px 8px 0',
    backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--accent-dim)',
  });

  const riskStyle = {
    backgroundColor: 'rgba(255, 23, 68, 0.05)',
    borderLeft: '3px solid var(--red)',
    padding: '8px 12px',
    marginBottom: 8,
    borderRadius: '0 4px 4px 0',
  };

  const riskTextStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: 'var(--text-primary)',
    marginBottom: 4,
  };

  const mitigationStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  };

  const footerRowStyle = {
    display: 'flex',
    gap: 12,
    marginTop: 16,
  };

  const getSentimentType = (sentiment) => {
    switch (sentiment) {
      case 'PRODUCTIVE':
        return 'success';
      case 'TENSE':
        return 'danger';
      case 'INCONCLUSIVE':
        return 'warning';
      case 'ALIGNED':
        return 'info';
      default:
        return 'muted';
    }
  };

  const getImpactType = (impact) => {
    switch (impact) {
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

  return (
    <div>
      {/* Summary */}
      <div style={sectionStyle}>
        <div style={summaryStyle}>{result.summary}</div>
        <div style={chipsRowStyle}>
          <Badge text={result.meeting_type || 'Meeting'} type="info" size="sm" />
          <Badge
            text={result.sentiment}
            type={getSentimentType(result.sentiment)}
            size="sm"
          />
          <Badge
            text={`${result.attendees?.length || 0} attendees`}
            type="muted"
            size="sm"
          />
        </div>
      </div>

      {/* Decisions */}
      {result.decisions && result.decisions.length > 0 && (
        <div style={sectionStyle}>
          <div style={headerStyle}>
            <span style={headerTextStyle}>DECISIONS</span>
            <Badge text={result.decisions.length.toString()} type="info" size="sm" />
          </div>
          {result.decisions.map((decision, index) => (
            <div key={index} style={decisionRowStyle}>
              <div style={decisionNumberStyle}>{decision.id || index + 1}</div>
              <div style={decisionTextStyle}>
                {decision.text}
                {decision.owner && (
                  <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                    — {decision.owner}
                  </span>
                )}
              </div>
              <Badge text={decision.impact} type={getImpactType(decision.impact)} size="sm" />
            </div>
          ))}
        </div>
      )}

      {/* Action Items */}
      {result.tasks && result.tasks.length > 0 && (
        <div style={sectionStyle}>
          <div style={headerStyle}>
            <span style={headerTextStyle}>ACTION ITEMS</span>
            <Badge text={result.tasks.length.toString()} type="info" size="sm" />
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Task</th>
                <th style={thStyle}>Owner</th>
                <th style={thStyle}>Deadline</th>
                <th style={thStyle}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {result.tasks.map((task, index) => (
                <tr key={index}>
                  <td style={tdStyle(index)}>{task.title}</td>
                  <td style={tdStyle(index)}>{task.owner}</td>
                  <td style={tdStyle(index)}>{task.deadline}</td>
                  <td style={tdStyle(index)}>
                    <Badge
                      text={task.priority}
                      type={getImpactType(task.priority)}
                      size="sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Risks */}
      {result.risks && result.risks.length > 0 && (
        <div style={sectionStyle}>
          <div style={headerStyle}>
            <span style={headerTextStyle}>⚠ RISKS</span>
          </div>
          {result.risks.map((risk, index) => (
            <div key={index} style={riskStyle}>
              <div style={riskTextStyle}>{risk.text}</div>
              <div style={mitigationStyle}>Mitigation: {risk.mitigation}</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={footerRowStyle}>
        <Badge
          text={result.follow_up_meeting?.needed ? 'Follow-up needed' : 'No follow-up'}
          type={result.follow_up_meeting?.needed ? 'warning' : 'success'}
          size="sm"
        />
        <Badge
          text={result.sentiment}
          type={getSentimentType(result.sentiment)}
          size="sm"
        />
      </div>
    </div>
  );
}
