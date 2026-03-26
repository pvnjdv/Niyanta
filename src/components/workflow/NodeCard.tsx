import React from 'react';
import { WorkflowNodeInstance } from '../../types/workflow';

interface NodeCardProps {
  node: WorkflowNodeInstance;
  onPointerDown?: (instanceId: string, event: React.PointerEvent<HTMLDivElement>) => void;
}

const NodeCard: React.FC<NodeCardProps> = ({ node, onPointerDown }) => (
  <div
    onPointerDown={(e) => onPointerDown?.(node.instanceId, e)}
    style={{
      position: 'absolute',
      left: node.position.x,
      top: node.position.y,
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: 8,
      minWidth: 150,
      background: 'var(--bg-panel)',
      cursor: 'grab',
      boxShadow: 'var(--shadow)',
      userSelect: 'none',
    }}
  >
    <div style={{ fontSize: 12, fontWeight: 700 }}>{node.name}</div>
    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{node.nodeType}</div>
  </div>
);

export default NodeCard;
