import React from 'react';

const NODE_GROUPS: Record<string, string[]> = {
  trigger: ['manual_trigger', 'file_upload_trigger', 'timer_trigger'],
  ai: ['llm_analysis', 'classification', 'summarization', 'risk_analysis'],
  decision: ['approval', 'conditional_routing', 'threshold_decision'],
  action: ['notification', 'task_assignment', 'report_generation'],
  data: ['data_storage', 'data_retrieval', 'audit_storage'],
  utility: ['delay', 'retry', 'workflow_completion'],
};

const NodePalette: React.FC<{ onAdd: (type: string) => void }> = ({ onAdd }) => (
  <div style={{ display: 'grid', gap: 10 }}>
    {Object.entries(NODE_GROUPS).map(([group, types]) => (
      <div key={group}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>{group}</div>
        <div style={{ display: 'grid', gap: 6 }}>
          {types.map((type) => (
            <button key={type} onClick={() => onAdd(type)} style={{ border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-primary)', borderRadius: 8, padding: 8, textAlign: 'left', fontSize: 12 }}>
              + {type}
            </button>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default NodePalette;
