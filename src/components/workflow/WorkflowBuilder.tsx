import React, { useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { WorkflowEdge, WorkflowNodeInstance } from '../../types/workflow';
import NodePalette from './NodePalette';
import WorkflowCanvas from './WorkflowCanvas';

interface WorkflowBuilderProps {
  onSave: (nodes: WorkflowNodeInstance[], edges: WorkflowEdge[]) => Promise<void>;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ onSave }) => {
  const [nodes, setNodes] = useState<WorkflowNodeInstance[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const addNode = (type: string) => {
    setNodes((prev) => [...prev, { instanceId: uuid(), nodeType: type, name: type, config: {}, position: { x: 20 + prev.length * 18, y: 20 + prev.length * 16 } }]);
  };

  const onNodePointerDown = (instanceId: string, event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget.getBoundingClientRect();
    dragRef.current = { id: instanceId, offsetX: event.clientX - target.left, offsetY: event.clientY - target.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const canvas = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - canvas.left - dragRef.current.offsetX) / zoom;
    const y = (event.clientY - canvas.top - dragRef.current.offsetY) / zoom;
    setNodes((prev) => prev.map((n) => (n.instanceId === dragRef.current?.id ? { ...n, position: { x: Math.max(4, x), y: Math.max(4, y) } } : n)));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onCreateEdge = (from: string, to: string) => {
    if (from === to) return;
    setEdges((prev) => [...prev, { id: uuid(), fromNodeId: from, toNodeId: to }]);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 10 }}>
      <NodePalette onAdd={addNode} />
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button onClick={() => void onSave(nodes, edges)} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-panel)', color: 'var(--text-primary)', padding: '8px 10px' }}>Save Workflow</button>
          <button style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-panel)', color: 'var(--text-primary)', padding: '8px 10px' }}>Run Workflow</button>
          <button onClick={() => { setNodes([]); setEdges([]); }} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-panel)', color: 'var(--text-primary)', padding: '8px 10px' }}>Clear</button>
          <button onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-panel)', color: 'var(--text-primary)', padding: '8px 10px' }}>Zoom In</button>
          <button onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-panel)', color: 'var(--text-primary)', padding: '8px 10px' }}>Zoom Out</button>
        </div>
        <div onPointerMove={onPointerMove} onPointerUp={onPointerUp} style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          <WorkflowCanvas nodes={nodes} edges={edges} onNodePointerDown={onNodePointerDown} onCreateEdge={onCreateEdge} />
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
