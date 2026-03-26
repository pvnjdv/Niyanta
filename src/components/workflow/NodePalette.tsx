import React from 'react';

const NODE_TYPES = ['manual_trigger', 'llm_analysis', 'approval', 'notification'];

const NodePalette: React.FC<{ onAdd: (type: string) => void }> = ({ onAdd }) => (
  <div style={{ display: 'grid', gap: 8 }}>
    {NODE_TYPES.map((type) => (
      <button key={type} onClick={() => onAdd(type)} style={{ border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-primary)', borderRadius: 8, padding: 8, textAlign: 'left' }}>
        + {type}
      </button>
    ))}
  </div>
);

export default NodePalette;
