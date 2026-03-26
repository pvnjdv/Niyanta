import React from 'react';
import { WorkflowEdge, WorkflowNodeInstance } from '../../types/workflow';
import NodeCard from './NodeCard';

interface WorkflowCanvasProps {
  nodes: WorkflowNodeInstance[];
  edges: WorkflowEdge[];
  onNodePointerDown: (instanceId: string, event: React.PointerEvent<HTMLDivElement>) => void;
  onCreateEdge: (from: string, to: string) => void;
}

const centerOf = (node: WorkflowNodeInstance): { x: number; y: number } => ({
  x: node.position.x + 75,
  y: node.position.y + 24,
});

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ nodes, edges, onNodePointerDown, onCreateEdge }) => {
  const byId = Object.fromEntries(nodes.map((n) => [n.instanceId, n]));

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, minHeight: 420, height: 420, position: 'relative', overflow: 'hidden', background: 'var(--bg-input)' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        {edges.map((edge) => {
          const from = byId[edge.fromNodeId];
          const to = byId[edge.toNodeId];
          if (!from || !to) return null;
          const a = centerOf(from);
          const b = centerOf(to);
          return <line key={edge.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--accent)" strokeWidth="2" />;
        })}
      </svg>

      {nodes.map((node) => (
        <NodeCard key={node.instanceId} node={node} onPointerDown={onNodePointerDown} />
      ))}

      {nodes.length >= 2 && (
        <div style={{ position: 'absolute', right: 10, bottom: 10, display: 'flex', gap: 8 }}>
          <button onClick={() => onCreateEdge(nodes[nodes.length - 2].instanceId, nodes[nodes.length - 1].instanceId)} style={{ border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-primary)', borderRadius: 8, padding: '6px 8px', fontSize: 11 }}>
            Connect Last Two
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkflowCanvas;
