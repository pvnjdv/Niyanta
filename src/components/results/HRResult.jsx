import React, { useState } from 'react';
import Badge from '../shared/Badge';

export default function HRResult({ result }) {
  const [activeTab, setActiveTab] = useState('before_day_one');

  const sectionStyle = {
    marginBottom: 16,
  };

  const nameStyle = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 18,
    color: 'var(--text-primary)',
    marginBottom: 4,
  };

  const roleStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: 'var(--text-muted)',
    marginBottom: 12,
  };

  const chipsRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
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

  const noteStyle = {
    backgroundColor: 'rgba(255, 215, 64, 0.1)',
    border: '1px solid var(--amber)',
    borderRadius: 4,
    padding: '8px 12px',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  };

  const noteTextStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--amber)',
  };

  const tabContainerStyle = {
    display: 'flex',
    gap: 0,
    marginBottom: 12,
    borderBottom: '1px solid var(--border)',
  };

  const tabStyle = (isActive) => ({
    padding: '8px 12px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: isActive ? '#00E676' : 'var(--text-muted)',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: isActive ? '2px solid #00E676' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  const taskRowStyle = (isCritical) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '8px 0',
    borderLeft: isCritical ? '2px solid var(--red)' : '2px solid transparent',
    paddingLeft: 8,
    marginLeft: -8,
  });

  const checkboxStyle = {
    width: 14,
    height: 14,
    border: '1px solid var(--border)',
    borderRadius: 2,
    flexShrink: 0,
    marginTop: 2,
  };

  const taskTextStyle = {
    flex: 1,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: 'var(--text-primary)',
    lineHeight: 1.4,
  };

  const docChipStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'var(--accent-dim)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '4px 10px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--text-primary)',
    margin: '0 4px 4px 0',
  };

  const accessChipStyle = (level) => {
    const colors = {
      Full: 'var(--green)',
      'Read-only': '#00D4FF',
      Restricted: 'var(--amber)',
    };
    const color = colors[level] || 'var(--text-muted)';
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
      border: `1px solid ${color}`,
      borderRadius: 4,
      padding: '4px 10px',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 11,
      color: color,
      margin: '0 4px 4px 0',
    };
  };

  const buddyCardStyle = {
    backgroundColor: 'var(--accent-dim)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '12px 14px',
  };

  const buddyTitleStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    color: 'var(--text-primary)',
    marginBottom: 4,
  };

  const buddyTextStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--text-muted)',
  };

  const tabs = [
    { key: 'before_day_one', label: 'Before Day 1' },
    { key: 'day_one', label: 'Day 1' },
    { key: 'week_one', label: 'Week 1' },
    { key: 'month_one', label: 'Month 1' },
  ];

  const currentChecklist = result.checklist?.[activeTab] || [];

  return (
    <div>
      {/* Employee Header */}
      <div style={sectionStyle}>
        <div style={nameStyle}>{result.employee?.name}</div>
        <div style={roleStyle}>
          {result.employee?.role} · {result.employee?.department}
        </div>
        <div style={chipsRowStyle}>
          <Badge text={result.employee?.start_date} type="info" size="sm" />
          <Badge text={result.employee?.location} type="muted" size="sm" />
          <Badge text={result.employee?.employment_type} type="muted" size="sm" />
        </div>
      </div>

      {/* Special Notes */}
      {result.special_notes && result.special_notes.length > 0 && (
        <div style={sectionStyle}>
          <div style={headerStyle}>IMPORTANT FLAGS</div>
          {result.special_notes.map((note, index) => (
            <div key={index} style={noteStyle}>
              <span>⚠️</span>
              <span style={noteTextStyle}>{note}</span>
            </div>
          ))}
        </div>
      )}

      {/* Checklist Tabs */}
      <div style={sectionStyle}>
        <div style={headerStyle}>ONBOARDING CHECKLIST</div>
        <div style={tabContainerStyle}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              style={tabStyle(activeTab === tab.key)}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {currentChecklist.map((task, index) => (
          <div key={index} style={taskRowStyle(task.critical)}>
            <div style={checkboxStyle} />
            <div style={taskTextStyle}>{task.task}</div>
            <Badge text={task.owner} type="muted" size="sm" />
            {task.critical && <Badge text="CRITICAL" type="danger" size="sm" />}
          </div>
        ))}
      </div>

      {/* Documents Needed */}
      {result.documents_needed && result.documents_needed.length > 0 && (
        <div style={sectionStyle}>
          <div style={headerStyle}>DOCUMENTS NEEDED</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {result.documents_needed.map((doc, index) => (
              <span key={index} style={docChipStyle}>
                📄 {doc.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* System Access */}
      {result.system_access && result.system_access.length > 0 && (
        <div style={sectionStyle}>
          <div style={headerStyle}>SYSTEM ACCESS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {result.system_access.map((sys, index) => (
              <span key={index} style={accessChipStyle(sys.access_level)}>
                {sys.system} ({sys.access_level})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Buddy Program */}
      {result.buddy_program?.assigned && (
        <div style={sectionStyle}>
          <div style={buddyCardStyle}>
            <div style={buddyTitleStyle}>👥 Buddy Assigned</div>
            <div style={buddyTextStyle}>
              {result.buddy_program.buddy_role} · First meeting: {result.buddy_program.first_meeting}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
