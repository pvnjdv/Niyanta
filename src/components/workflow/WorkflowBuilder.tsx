import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { WorkflowEdge, WorkflowNodeInstance } from '../../types/workflow';
import NodePalette from './NodePalette';
import WorkflowCanvas from './WorkflowCanvas';

interface WorkflowBuilderProps {
  onSave: (nodes: WorkflowNodeInstance[], edges: WorkflowEdge[]) => Promise<void>;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ onSave }) => {
  const [nodes, setNodes] = useState<WorkflowNodeInstance[]>([]);
  const [edges] = useState<WorkflowEdge[]>([]);

  const addNode = (type: string) => {
    setNodes((prev) => [...prev, { instanceId: uuid(), nodeType: type, name: type, config: {}, position: { x: 0, y: 0 } }]);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 10 }}>
      <NodePalette onAdd={addNode} />
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button onClick={() => onSave(nodes, edges)} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-panel)', color: 'var(--text-primary)', padding: '8px 10px' }}>Save Workflow</button>
          <button style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-panel)', color: 'var(--text-primary)', padding: '8px 10px' }}>Run Workflow</button>
          <button onClick={() => setNodes([])} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-panel)', color: 'var(--text-primary)', padding: '8px 10px' }}>Clear</button>
        </div>
        <WorkflowCanvas nodes={nodes} edges={edges} />
      </div>
    </div>
  );
};

export default WorkflowBuilder;
