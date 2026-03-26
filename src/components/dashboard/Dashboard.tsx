import React from 'react';
import './Dashboard.css';

interface DashboardProps {
  onCreateWorkflow?: () => void;
  onOpenSamples?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onCreateWorkflow, onOpenSamples }) => {
  return (
    <div className="dashboard">
      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div className="dashboard-logo">
            <div className="logo-icon">🔄</div>
          </div>
          <h1 className="dashboard-title">Niyanta AI</h1>
          <p className="dashboard-subtitle">Enterprise Workflow Orchestration Platform</p>
          <p className="dashboard-description">
            Build, execute, and monitor complex workflows powered by AI agents. 
            Automate enterprise processes with intelligent decision-making and real-time monitoring.
          </p>
          
          <div className="dashboard-actions">
            <button className="dashboard-btn dashboard-btn-primary" onClick={onCreateWorkflow}>
              <span className="btn-icon">➕</span>
              <span>Create Workflow</span>
            </button>
            <button className="dashboard-btn dashboard-btn-secondary" onClick={onOpenSamples}>
              <span className="btn-icon">📋</span>
              <span>View Samples</span>
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3 className="feature-title">10 Specialized Agents</h3>
            <p className="feature-description">
              HR, Finance, IT, Security, and more - each with specialized expertise powered by Groq LLM
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3 className="feature-title">23 Node Types</h3>
            <p className="feature-description">
              Triggers, AI analysis, approvals, notifications, data transformations, and more
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔀</div>
            <h3 className="feature-title">Visual Workflow Builder</h3>
            <p className="feature-description">
              Drag-and-drop interface for building complex workflows without code
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💾</div>
            <h3 className="feature-title">Offline-First Database</h3>
            <p className="feature-description">
              SQLite database for reliable, fast data storage and retrieval
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Real-Time Monitoring</h3>
            <p className="feature-description">
              Track execution metrics, audit logs, and workflow performance in real-time
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3 className="feature-title">Enterprise Security</h3>
            <p className="feature-description">
              Built-in audit trails, approval chains, and compliance tracking
            </p>
          </div>
        </div>
      </div>

      {/* Agents Section */}
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">Available Agents</h2>
        <div className="agents-grid">
          <div className="agent-card">
            <div className="agent-icon">👥</div>
            <h3>HR Executive</h3>
            <p>Personnel management and recruitment</p>
          </div>
          <div className="agent-card">
            <div className="agent-icon">💰</div>
            <h3>Finance Manager</h3>
            <p>Budget analysis and cost optimization</p>
          </div>
          <div className="agent-card">
            <div className="agent-icon">🏢</div>
            <h3>Operations Lead</h3>
            <p>Process optimization and efficiency</p>
          </div>
          <div className="agent-card">
            <div className="agent-icon">🔒</div>
            <h3>Security Officer</h3>
            <p>Risk assessment and compliance</p>
          </div>
          <div className="agent-card">
            <div className="agent-icon">💻</div>
            <h3>IT Operations</h3>
            <p>Infrastructure and system management</p>
          </div>
          <div className="agent-card">
            <div className="agent-icon">📈</div>
            <h3>Business Analyst</h3>
            <p>Market analysis and insights</p>
          </div>
          <div className="agent-card">
            <div className="agent-icon">🎯</div>
            <h3>Procurement Expert</h3>
            <p>Vendor management and purchasing</p>
          </div>
          <div className="agent-card">
            <div className="agent-icon">✔️</div>
            <h3>Audit Officer</h3>
            <p>Compliance and quality assurance</p>
          </div>
          <div className="agent-card">
            <div className="agent-icon">🤝</div>
            <h3>Meeting Coordinator</h3>
            <p>Scheduling and coordination</p>
          </div>
          <div className="agent-card">
            <div className="agent-icon">📞</div>
            <h3>Support Manager</h3>
            <p>Customer support and escalation</p>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="dashboard-section dashboard-section-light">
        <h2 className="dashboard-section-title">Quick Start</h2>
        <div className="quick-start">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Create a Workflow</h4>
            <p>Click "Create Workflow" to open the workflow builder</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Add Nodes</h4>
            <p>Drag nodes from the left panel to build your workflow</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>Connect Nodes</h4>
            <p>Click and drag from output port to input port to connect nodes</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h4>Configure Nodes</h4>
            <p>Select a node and configure its settings in the right panel</p>
          </div>
          <div className="step">
            <div className="step-number">5</div>
            <h4>Save Workflow</h4>
            <p>Click "Save" to save your workflow for later use</p>
          </div>
          <div className="step">
            <div className="step-number">6</div>
            <h4>Execute</h4>
            <p>Click "Execute" to run your workflow and monitor progress</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <p>Niyanta AI v2.0 - Enterprise Workflow Orchestration</p>
        <div className="footer-links">
          <a href="#">Documentation</a>
          <a href="#">API Reference</a>
          <a href="#">Support</a>
        </div>
      </div>
    </div>
  );
};
