import React, { useState, useEffect } from 'react';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  icon: string;
  triggers: string[];
  nodes?: { id: string; type: string; name: string }[];
}

interface TemplateGalleryProps {
  onTemplateSelect: (templateId: string, customName?: string) => void;
  onClose: () => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onTemplateSelect, onClose }) => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory, selectedComplexity]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      let url = '/api/templates';
      const params = new URLSearchParams();
      
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedComplexity !== 'all') params.append('complexity', selectedComplexity);
      
      if (params.toString()) url += '?' + params.toString();
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      const response = await fetch(`/api/templates/${selectedTemplate.id}/instantiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customName: customName || selectedTemplate.name 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        onTemplateSelect(data.workflowId, customName || selectedTemplate.name);
        onClose();
      } else {
        alert(`Failed to create workflow: ${data.message}`);
      }
    } catch (error) {
      console.error('Template instantiation error:', error);
      alert('Failed to create workflow from template');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000,
    }} onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90vw', maxWidth: 1400, height: '90vh',
          background: 'var(--bg-panel)', border: '1px solid var(--border)',
          borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ 
          height: 64, borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
              📚 Workflow Templates
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
              {filteredTemplates.length} templates available
            </div>
          </div>
          
          <button 
            onClick={onClose}
            style={{
              width: 36, height: 36, border: '1px solid var(--border)',
              background: 'transparent', cursor: 'pointer', fontSize: 20,
              fontFamily: 'var(--font-display)',
            }}
          >×</button>
        </div>

        {/* Filters */}
        <div style={{ 
          padding: 16, borderBottom: '1px solid var(--border)',
          display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0,
        }}>
          {/* Search */}
          <input
            type="text"
            placeholder="🔍 Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1, height: 36, padding: '0 12px',
              fontFamily: 'var(--font-body)', fontSize: 13,
              background: 'var(--bg-tile)', border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              height: 36, padding: '0 12px', minWidth: 150,
              fontFamily: 'var(--font-mono)', fontSize: 11,
              background: 'var(--bg-tile)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', cursor: 'pointer',
            }}
          >
            <option value="all">All Categories</option>
            <option value="Finance">Finance</option>
            <option value="HR">HR</option>
            <option value="Operations">Operations</option>
            <option value="Security">Security</option>
            <option value="Compliance">Compliance</option>
            <option value="IT">IT</option>
            <option value="Document Processing">Document Processing</option>
          </select>

          {/* Complexity Filter */}
          <select
            value={selectedComplexity}
            onChange={(e) => setSelectedComplexity(e.target.value)}
            style={{
              height: 36, padding: '0 12px', minWidth: 140,
              fontFamily: 'var(--font-mono)', fontSize: 11,
              background: 'var(--bg-tile)', border: '1px solid var(--border)',
              color: 'var(--text-primary)', cursor: 'pointer',
            }}
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Template Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading ? (
            <div style={{ 
              textAlign: 'center', padding: 60,
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)'
            }}>
              Loading templates...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div style={{ 
              textAlign: 'center', padding: 60,
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)'
            }}>
              No templates found
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16 
            }}>
              {filteredTemplates.map(template => {
                const isSelected = selectedTemplate?.id === template.id;
                const complexityColor = getComplexityColor(template.complexity);
                const catColors: Record<string, string> = {
                  Finance: '#10B981', HR: '#EC4899', Operations: '#3B82F6',
                  Security: '#EF4444', Compliance: '#F59E0B', IT: '#8B5CF6',
                  'Document Processing': '#06B6D4', General: '#6B7280',
                };
                const catColor = catColors[template.category] || '#6B7280';
                const nodeCount = (template.nodes || []).length;

                return (
                  <div
                    key={template.id}
                    onClick={() => { setSelectedTemplate(template); setCustomName(''); }}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 0,
                      border: `1px solid ${isSelected ? catColor : 'var(--border)'}`,
                      borderTop: `3px solid ${catColor}`,
                      background: isSelected ? `${catColor}0d` : 'var(--bg-panel)',
                      cursor: 'pointer', transition: 'all 0.15s', borderRadius: 6,
                      boxShadow: isSelected ? `0 4px 20px ${catColor}30` : 'none',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = catColor;
                        e.currentTarget.style.boxShadow = `0 4px 16px ${catColor}20`;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {/* Card header strip */}
                    <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                        background: `${catColor}20`, border: `1px solid ${catColor}44`,
                        display: 'grid', placeItems: 'center', fontSize: 24,
                      }}>
                        {template.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
                          {template.name}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: catColor, textTransform: 'uppercase', fontWeight: 700, padding: '1px 5px', background: `${catColor}18`, borderRadius: 3 }}>{template.category}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: complexityColor, textTransform: 'uppercase', fontWeight: 700, padding: '1px 5px', background: `${complexityColor}18`, borderRadius: 3 }}>{template.complexity}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div style={{ padding: '0 16px 12px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, minHeight: 40 }}>
                      {template.description.length > 130 ? template.description.slice(0, 127) + '…' : template.description}
                    </div>

                    {/* Stats row */}
                    <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.12)', display: 'flex', gap: 16, alignItems: 'center' }}>
                      {nodeCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 11, opacity: 0.5 }}>◈</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{nodeCount} NODES</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 11, opacity: 0.5 }}>⏱</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{template.estimatedTime}</span>
                      </div>
                      {(template.triggers || []).length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
                          <span style={{ fontSize: 10, opacity: 0.5 }}>▶</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{template.triggers[0]}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div style={{ padding: '10px 16px 14px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {template.tags.slice(0, 5).map(tag => (
                        <span key={tag} style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9,
                          padding: '2px 7px', borderRadius: 3,
                          background: 'var(--bg-base)', color: 'var(--text-muted)',
                          border: '1px solid var(--border)',
                        }}>#{tag}</span>
                      ))}
                    </div>

                    {/* Use button (shows on hover/select) */}
                    {isSelected && (
                      <div style={{ padding: '0 16px 14px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); }}
                          style={{
                            width: '100%', height: 32, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                            background: catColor, border: 'none', color: 'white', borderRadius: 4, cursor: 'pointer',
                            letterSpacing: '0.05em',
                          }}
                        >
                          ✦ SELECT THIS TEMPLATE
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedTemplate && (
          <div style={{ 
            borderTop: '1px solid var(--border)', padding: '14px 20px',
            display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg-tile)',
            flexShrink: 0,
          }}>
            <div style={{ fontSize: 22, lineHeight: 1 }}>{selectedTemplate.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedTemplate.name}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {selectedTemplate.category} · {selectedTemplate.complexity} · {(selectedTemplate.nodes || []).length} nodes
              </div>
            </div>
            <input
              type="text"
              placeholder="Custom name (optional)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleUseTemplate(); }}
              style={{
                width: 220, height: 36, padding: '0 12px',
                fontFamily: 'var(--font-body)', fontSize: 12,
                background: 'var(--bg-panel)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', borderRadius: 4, outline: 'none',
              }}
            />
            <button
              onClick={() => { setSelectedTemplate(null); setCustomName(''); }}
              style={{
                height: 36, padding: '0 16px', fontFamily: 'var(--font-mono)', fontSize: 11,
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 4,
              }}
            >
              CANCEL
            </button>
            <button
              onClick={handleUseTemplate}
              style={{
                height: 36, padding: '0 24px', fontFamily: 'var(--font-mono)', fontSize: 11,
                background: '#8B5CF6', border: '1px solid #8B5CF6',
                color: 'white', cursor: 'pointer', fontWeight: 700, borderRadius: 4,
                letterSpacing: '0.04em',
              }}
            >
              ✨ USE TEMPLATE
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
