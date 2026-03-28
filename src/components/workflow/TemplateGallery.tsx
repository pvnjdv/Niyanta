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
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: 16 
            }}>
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  style={{
                    padding: 20, border: '1px solid var(--border)',
                    background: selectedTemplate?.id === template.id ? 'var(--bg-tile)' : 'var(--bg-panel)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    borderLeft: `4px solid ${getComplexityColor(template.complexity)}`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ 
                      fontSize: 32, lineHeight: 1, flexShrink: 0 
                    }}>
                      {template.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700,
                        marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {template.name}
                        </span>
                      </div>
                      <div style={{ 
                        fontFamily: 'var(--font-mono)', fontSize: 9, 
                        color: getComplexityColor(template.complexity),
                        textTransform: 'uppercase', fontWeight: 600,
                      }}>
                        {template.complexity}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ 
                    fontFamily: 'var(--font-body)', fontSize: 12, 
                    color: 'var(--text-secondary)', lineHeight: 1.5,
                    marginBottom: 12, minHeight: 36,
                  }}>
                    {template.description}
                  </div>

                  {/* Metadata */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    <div style={{ 
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      padding: '3px 8px', background: 'var(--bg-accent)',
                      border: '1px solid var(--border)', borderRadius: 2,
                    }}>
                      📂 {template.category}
                    </div>
                    <div style={{ 
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      padding: '3px 8px', background: 'var(--bg-accent)',
                      border: '1px solid var(--border)', borderRadius: 2,
                    }}>
                      ⏱ {template.estimatedTime}
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {template.tags.slice(0, 4).map(tag => (
                      <span key={tag} style={{ 
                        fontFamily: 'var(--font-mono)', fontSize: 9,
                        padding: '2px 6px', background: 'var(--bg-base)',
                        color: 'var(--text-muted)', borderRadius: 2,
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Preview */}
        {selectedTemplate && (
          <div style={{ 
            borderTop: '1px solid var(--border)', padding: 20,
            display: 'flex', gap: 20, background: 'var(--bg-tile)',
            flexShrink: 0,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                SELECTED TEMPLATE
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                {selectedTemplate.icon} {selectedTemplate.name}
              </div>
              <input
                type="text"
                placeholder="Custom workflow name (optional)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{
                  width: '100%', height: 36, padding: '0 12px',
                  fontFamily: 'var(--font-body)', fontSize: 13,
                  background: 'var(--bg-panel)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => { setSelectedTemplate(null); setCustomName(''); }}
                style={{
                  height: 40, padding: '0 20px', fontFamily: 'var(--font-mono)', fontSize: 11,
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleUseTemplate}
                style={{
                  height: 40, padding: '0 24px', fontFamily: 'var(--font-mono)', fontSize: 11,
                  background: '#8B5CF6', border: '1px solid #8B5CF6',
                  color: 'white', cursor: 'pointer', fontWeight: 600,
                }}
              >
                ✨ USE TEMPLATE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
