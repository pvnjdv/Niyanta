import React, { useState, useRef, useEffect } from 'react';
import { NODE_CATEGORIES, NODE_GROUPS } from '../../constants/nodes';
import './N8nWorkflowBuilder.css';

interface Node {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  data?: Record<string, unknown>;
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

interface N8nWorkflowBuilderProps {
  workflowName?: string;
  onSave?: (nodes: Array<{ instanceId: string; nodeType: string; name: string; config: Record<string, unknown>; position: { x: number; y: number } }>, edges: Array<{ id: string; fromNodeId: string; toNodeId: string; condition?: string }>) => Promise<void>;
  onExecute?: (nodes: Array<{ instanceId: string; nodeType: string; name: string; config: Record<string, unknown>; position: { x: number; y: number } }>, edges: Array<{ id: string; fromNodeId: string; toNodeId: string; condition?: string }>) => Promise<void>;
  onBack?: () => void;
}

export const N8nWorkflowBuilder: React.FC<N8nWorkflowBuilderProps> = ({
  workflowName = 'My Workflow',
  onSave,
  onExecute,
  onBack,
}) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{ from: string } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

  // Scroll handler for canvas
  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  };

  // Get node by ID
  const getNode = (id: string) => nodes.find((n) => n.id === id);

  // Get connected nodes
  const getOutgoing = (nodeId: string) => edges.filter((e) => e.source === nodeId).map((e) => e.target);
  const getIncoming = (nodeId: string) => edges.filter((e) => e.target === nodeId).map((e) => e.source);

  // Add node to canvas
  const addNode = (e: React.DragEvent) => {
    if (!draggedNodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - canvasOffset.x;
    const y = e.clientY - rect.top - canvasOffset.y;

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: draggedNodeType,
      name: draggedNodeType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      position: { x, y },
      config: {},
    };

    setNodes([...nodes, newNode]);
    setDraggedNodeType(null);
  };

  // Handle drag start from palette
  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    setDraggedNodeType(nodeType);
    setIsDragging(true);
  };

  // Update node position
  const updateNodePosition = (nodeId: string, x: number, y: number) => {
    setNodes(
      nodes.map((n) =>
        n.id === nodeId
          ? { ...n, position: { x: Math.max(0, x), y: Math.max(0, y) } }
          : n
      )
    );
  };

  // Delete node
  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter((n) => n.id !== nodeId));
    setEdges(edges.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNode === nodeId) setSelectedNode(null);
  };

  // Connect nodes
  const connectNodes = (fromId: string, toId: string) => {
    if (fromId === toId) return; // Prevent self-connection
    if (edges.some((e) => e.source === fromId && e.target === toId)) return; // Prevent duplicate

    const newEdge: Edge = {
      id: `edge-${fromId}-${toId}`,
      source: fromId,
      target: toId,
    };

    setEdges([...edges, newEdge]);
    setConnecting(null);
  };

  // Delete edge
  const deleteEdge = (edgeId: string) => {
    setEdges(edges.filter((e) => e.id !== edgeId));
  };

  // Update node config
  const updateNodeConfig = (nodeId: string, config: Record<string, unknown>) => {
    setNodes(
      nodes.map((n) => (n.id === nodeId ? { ...n, config } : n))
    );
  };

  // Filter nodes based on search
  const filteredCategories = NODE_GROUPS.map((group) => ({
    ...group,
    nodes: group.nodes.filter((n) =>
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.type.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((g) => g.nodes.length > 0);

  const selectedNodeData = getNode(selectedNode || '');

  return (
    <div className="n8n-workflow-builder">
      {/* Header */}
      <div className="n8n-header">
        <div className="n8n-header-left">
          {onBack && (
            <button className="n8n-back-btn" onClick={onBack} title="Back to dashboard">
              ←
            </button>
          )}
          <h1 className="n8n-workflow-title">{workflowName}</h1>
        </div>
        <div className="n8n-header-center">
          <span className="n8n-status">●</span>
          <span className="n8n-status-text">Ready</span>
        </div>
        <div className="n8n-header-right">
          <button
            className="n8n-btn n8n-btn-secondary"
            onClick={() => onSave?.(
              nodes.map((n) => ({
                instanceId: n.id,
                nodeType: n.type,
                name: n.name,
                config: n.config,
                position: n.position,
              })),
              edges.map((e) => ({
                id: e.id,
                fromNodeId: e.source,
                toNodeId: e.target,
              }))
            )}
          >
            Save
          </button>
          <button
            className="n8n-btn n8n-btn-primary"
            onClick={() => onExecute?.(
              nodes.map((n) => ({
                instanceId: n.id,
                nodeType: n.type,
                name: n.name,
                config: n.config,
                position: n.position,
              })),
              edges.map((e) => ({
                id: e.id,
                fromNodeId: e.source,
                toNodeId: e.target,
              }))
            )}
          >
            ▶ Execute
          </button>
        </div>
      </div>

      <div className="n8n-container">
        {/* Left Sidebar - Node Palette */}
        <div className="n8n-sidebar n8n-sidebar-left">
          <div className="n8n-sidebar-header">
            <h2>Add Nodes</h2>
          </div>

          <div className="n8n-search-box">
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="n8n-search-input"
            />
          </div>

          <div className="n8n-node-palette">
            {filteredCategories.map((category) => (
              <div key={category.id} className="n8n-node-category">
                <h3 className="n8n-category-title">{category.name}</h3>
                <div className="n8n-node-list">
                  {category.nodes.map((node) => (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, node.type)}
                      className="n8n-node-item"
                      title={node.description}
                    >
                      <div className="n8n-node-icon" style={{ backgroundColor: category.color }}>
                        {node.icon || '⚙'}
                      </div>
                      <div className="n8n-node-label">
                        <div className="n8n-node-name">{node.name}</div>
                        <div className="n8n-node-subtitle">{category.name}</div>
                      </div>
                      <div className="n8n-drag-handle">☰</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="n8n-canvas-container">
          <div
            ref={canvasRef}
            className="n8n-canvas"
            onDrop={addNode}
            onDragOver={(e) => e.preventDefault()}
            onWheel={handleCanvasWheel}
          >
            {/* Grid Background */}
            <div className="n8n-grid"></div>

            {/* SVG for connections */}
            <svg className="n8n-connections">
              {edges.map((edge) => {
                const fromNode = getNode(edge.source);
                const toNode = getNode(edge.target);
                if (!fromNode || !toNode) return null;

                const from = {
                  x: fromNode.position.x + 140,
                  y: fromNode.position.y + 40,
                };
                const to = {
                  x: toNode.position.x,
                  y: toNode.position.y + 40,
                };

                const midX = (from.x + to.x) / 2;

                return (
                  <g key={edge.id}>
                    <path
                      d={`M${from.x} ${from.y} C${midX} ${from.y} ${midX} ${to.y} ${to.x} ${to.y}`}
                      className="n8n-connection-line"
                      onClick={() => deleteEdge(edge.id)}
                    />
                    <circle
                      cx={from.x}
                      cy={from.y}
                      r="4"
                      className="n8n-port n8n-port-output"
                    />
                    <circle
                      cx={to.x}
                      cy={to.y}
                      r="4"
                      className="n8n-port n8n-port-input"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
              <NodeComponent
                key={node.id}
                node={node}
                isSelected={selectedNode === node.id}
                onSelect={() => setSelectedNode(node.id)}
                onPositionChange={(x, y) => updateNodePosition(node.id, x, y)}
                onDelete={() => deleteNode(node.id)}
                onStartConnection={() => setConnecting({ from: node.id })}
                onEndConnection={() => {
                  if (connecting?.from && connecting.from !== node.id) {
                    connectNodes(connecting.from, node.id);
                  }
                }}
                isConnectionTarget={connecting?.from !== node.id}
              />
            ))}

            {nodes.length === 0 && (
              <div className="n8n-empty-state">
                <div className="n8n-empty-icon">🔄</div>
                <p>Drag nodes from the left panel to build your workflow</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Node Configuration */}
        {selectedNodeData && (
          <div className="n8n-sidebar n8n-sidebar-right">
            <div className="n8n-sidebar-header">
              <h2>Node Configuration</h2>
              <button
                className="n8n-btn-close"
                onClick={() => setSelectedNode(null)}
              >
                ✕
              </button>
            </div>

            <div className="n8n-config-panel">
              <div className="n8n-config-section">
                <label className="n8n-label">Node Name</label>
                <input
                  type="text"
                  value={selectedNodeData.name}
                  onChange={(e) => {
                    setNodes(
                      nodes.map((n) =>
                        n.id === selectedNodeData.id
                          ? { ...n, name: e.target.value }
                          : n
                      )
                    );
                  }}
                  className="n8n-input"
                />
              </div>

              <div className="n8n-config-section">
                <label className="n8n-label">Type</label>
                <div className="n8n-type-badge">{selectedNodeData.type}</div>
              </div>

              {selectedNodeData.type === 'llm_analysis' && (
                <div className="n8n-config-section">
                  <label className="n8n-label">Prompt</label>
                  <textarea
                    value={(selectedNodeData.config.prompt as string) || ''}
                    onChange={(e) =>
                      updateNodeConfig(selectedNodeData.id, {
                        ...selectedNodeData.config,
                        prompt: e.target.value,
                      })
                    }
                    className="n8n-textarea"
                    rows={4}
                  />
                </div>
              )}

              {selectedNodeData.type === 'approval' && (
                <div className="n8n-config-section">
                  <label className="n8n-label">Approver Email</label>
                  <input
                    type="email"
                    value={(selectedNodeData.config.approver as string) || ''}
                    onChange={(e) =>
                      updateNodeConfig(selectedNodeData.id, {
                        ...selectedNodeData.config,
                        approver: e.target.value,
                      })
                    }
                    className="n8n-input"
                  />
                </div>
              )}

              {selectedNodeData.type === 'notification' && (
                <div className="n8n-config-section">
                  <label className="n8n-label">Channel</label>
                  <select
                    value={(selectedNodeData.config.channel as string) || 'email'}
                    onChange={(e) =>
                      updateNodeConfig(selectedNodeData.id, {
                        ...selectedNodeData.config,
                        channel: e.target.value,
                      })
                    }
                    className="n8n-select"
                  >
                    <option value="email">Email</option>
                    <option value="slack">Slack</option>
                    <option value="webhook">Webhook</option>
                  </select>
                </div>
              )}

              <div className="n8n-config-section">
                <label className="n8n-label">Incoming Connections</label>
                <div className="n8n-connections-list">
                  {getIncoming(selectedNodeData.id).length === 0 ? (
                    <span className="n8n-empty-text">None</span>
                  ) : (
                    getIncoming(selectedNodeData.id).map((nodeId) => (
                      <div key={nodeId} className="n8n-connection-item">
                        {getNode(nodeId)?.name || nodeId}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="n8n-config-section">
                <label className="n8n-label">Outgoing Connections</label>
                <div className="n8n-connections-list">
                  {getOutgoing(selectedNodeData.id).length === 0 ? (
                    <span className="n8n-empty-text">None</span>
                  ) : (
                    getOutgoing(selectedNodeData.id).map((nodeId) => (
                      <div key={nodeId} className="n8n-connection-item">
                        {getNode(nodeId)?.name || nodeId}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="n8n-config-actions">
                <button
                  className="n8n-btn n8n-btn-danger"
                  onClick={() => deleteNode(selectedNodeData.id)}
                >
                  Delete Node
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Node Component
interface NodeComponentProps {
  node: Node;
  isSelected: boolean;
  isConnectionTarget: boolean;
  onSelect: () => void;
  onPositionChange: (x: number, y: number) => void;
  onDelete: () => void;
  onStartConnection: () => void;
  onEndConnection: () => void;
}

const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  isConnectionTarget,
  onSelect,
  onPositionChange,
  onDelete,
  onStartConnection,
  onEndConnection,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.n8n-node-port')) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      onPositionChange(e.clientX - dragOffset.x, e.clientY - dragOffset.y);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange]);

  const nodeColor = NODE_GROUPS.find((g) =>
    g.nodes.some((n) => n.type === node.type)
  )?.color || '#999';

  return (
    <div
      className={`n8n-node ${isSelected ? 'n8n-node-selected' : ''}`}
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
      }}
      onMouseDown={handleMouseDown}
      onClick={onSelect}
    >
      <div className="n8n-node-header" style={{ borderTopColor: nodeColor }}>
        <div className="n8n-node-icon-small" style={{ backgroundColor: nodeColor }}>
          ⚙
        </div>
        <div className="n8n-node-title">{node.name}</div>
        <button className="n8n-node-menu" onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}>
          ✕
        </button>
      </div>
      <div className="n8n-node-body">
        <div className="n8n-node-type">{node.type.replace(/_/g, ' ')}</div>
      </div>

      {/* Input port */}
      <div
        className="n8n-node-port n8n-node-port-input"
        onMouseDown={(e) => {
          e.stopPropagation();
          onEndConnection();
        }}
        title="Connect from another node"
      />

      {/* Output port */}
      <div
        className="n8n-node-port n8n-node-port-output"
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartConnection();
        }}
        title="Connect to another node"
      />
    </div>
  );
};
