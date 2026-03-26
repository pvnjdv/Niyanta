import React from 'react';

interface WorkflowDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: Record<string, unknown> | null;
}

const WorkflowDetailModal: React.FC<WorkflowDetailModalProps> = ({ isOpen, onClose, workflow }) => {
  if (!isOpen || !workflow) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'grid', placeItems: 'center', zIndex: 900 }}>
      <div style={{ width: 560, maxWidth: '92vw', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
        <h3>Workflow Detail</h3>
        <pre style={{ marginTop: 8, maxHeight: 360, overflow: 'auto', background: 'var(--bg-input)', borderRadius: 8, padding: 10 }}>{JSON.stringify(workflow, null, 2)}</pre>
        <button onClick={onClose} style={{ marginTop: 10 }}>Close</button>
      </div>
    </div>
  );
};

export default WorkflowDetailModal;
