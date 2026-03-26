import React from 'react';

interface BottomDockProps {
  onQuickAction: (action: string) => void;
  activeView: string;
  agentCount: number;
  workflowCount: number;
  pendingApprovals: number;
}

const dockItems = [
  { id: 'quick-run', icon: '\u25B6', label: 'Quick Run' },
  { id: 'new-workflow', icon: '+', label: 'New Workflow' },
  { id: 'approvals', icon: '\u2713', label: 'Approvals' },
  { id: 'messages', icon: '\uD83D\uDCAC', label: 'Messages' },
  { id: 'niyanta', icon: '\u229B', label: 'Niyanta' },
];

const dockStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'var(--bg-elevated)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid var(--border-default)',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  padding: '8px 16px',
  display: 'flex',
  gap: 4,
  zIndex: 100,
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'background 120ms ease',
  border: 'none',
  background: 'transparent',
  position: 'relative',
};

const iconStyle: React.CSSProperties = {
  fontSize: 20,
  lineHeight: '20px',
  height: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-primary)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--text-tertiary)',
  marginTop: 4,
  whiteSpace: 'nowrap',
  fontWeight: 500,
};

const badgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: 4,
  right: 10,
  minWidth: 16,
  height: 16,
  borderRadius: 8,
  background: '#ef4444',
  color: '#fff',
  fontSize: 9,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 4px',
  lineHeight: 1,
};

const BottomDock: React.FC<BottomDockProps> = ({
  onQuickAction,
  activeView,
  agentCount,
  workflowCount,
  pendingApprovals,
}) => {
  return (
    <div style={dockStyle} className="bottom-dock">
      <style>{`
        .bottom-dock__item:hover {
          background: var(--bg-active) !important;
        }
      `}</style>
      {dockItems.map((item) => (
        <button
          key={item.id}
          className="bottom-dock__item"
          style={itemStyle}
          onClick={() => onQuickAction(item.id)}
          title={item.label}
        >
          <span style={iconStyle}>{item.icon}</span>
          {item.id === 'approvals' && pendingApprovals > 0 && (
            <span style={badgeStyle}>{pendingApprovals}</span>
          )}
          <span style={labelStyle}>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomDock;
