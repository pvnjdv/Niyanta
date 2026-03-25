import React from 'react';
import { AGENT_LIST } from '../../constants/agents';

const EmptyState: React.FC = () => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  };

  const logoStyle: React.CSSProperties = {
    width: 64,
    height: 64,
    borderRadius: '50%',
    border: '2px solid var(--accent)',
    opacity: 0.3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  };

  const sanskritStyle: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 28,
    opacity: 0.3,
    color: 'var(--text-primary)',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 20,
    color: 'var(--text-muted)',
    letterSpacing: '0.3em',
    marginBottom: 8,
  };

  const subtitleStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: 'var(--text-muted)',
    textAlign: 'center',
  };

  const dotsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    marginTop: 24,
  };

  const dotStyle = (color: string): React.CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: color,
    opacity: 0.5,
  });

  return (
    <div style={containerStyle}>
      <div style={logoStyle}>
        <span style={sanskritStyle}>नि</span>
      </div>
      <div style={titleStyle}>NIYANTA</div>
      <div style={subtitleStyle}>
        Select an agent from the sidebar
        <br />
        to begin autonomous processing
      </div>
      <div style={dotsContainerStyle}>
        {AGENT_LIST.map((agent) => (
          <div key={agent.id} style={dotStyle(agent.color)} />
        ))}
      </div>
    </div>
  );
};

export default EmptyState;
