import React from 'react';
import { WorkflowNodeInstance } from '../../types/workflow';

const NodeCard: React.FC<{ node: WorkflowNodeInstance }> = ({ node }) => (
  <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8, minWidth: 140 }}>
    <div style={{ fontSize: 12, fontWeight: 700 }}>{node.name}</div>
    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{node.nodeType}</div>
  </div>
);

export default NodeCard;
