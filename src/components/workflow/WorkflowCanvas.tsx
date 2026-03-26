import React from 'react';
import { WorkflowEdge, WorkflowNodeInstance } from '../../types/workflow';
import NodeCard from './NodeCard';

interface WorkflowCanvasProps {
  nodes: WorkflowNodeInstance[];
  edges: WorkflowEdge[];
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ nodes, edges }) => (
  <div style={{ border: '1px solid var(--border)', borderRadius: 8, minHeight: 280, padding: 12 }}>
    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Nodes: {nodes.length} · Edges: {edges.length}</div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{nodes.map((n) => <NodeCard key={n.instanceId} node={n} />)}</div>
  </div>
);

export default WorkflowCanvas;
