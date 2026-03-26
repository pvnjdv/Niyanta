import React from 'react';

interface ThinkingIndicatorProps {
  color: string;
}

const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ color }) => (
  <div style={{ padding: '8px 0' }}>
    <div style={{ display: 'flex', gap: 6 }}>
      {[0, 1, 2].map((i) => <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: color, animation: `blink 1s ${i * 0.2}s infinite` }} />)}
    </div>
    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
      Niyanta agent is processing...
    </div>
  </div>
);

export default ThinkingIndicator;
