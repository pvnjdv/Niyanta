import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { GlassCard, GlassPanel, GlassBadge, GlassButton } from '../components/shared/GlassCard';
import { Check, ArrowUpRight, Clock, AlertCircle, TrendingUp } from 'lucide-react';

// Example of how to update any screen component with glass morphism
export function ExampleGlassScreen() {
  const shouldReduceMotion = useReducedMotion();

  const stats = [
    { label: 'Active Workflows', value: 47, change: '+3', trend: 'up' },
    { label: 'Failed Today', value: 3, change: 'requires action', trend: 'down' },
    { label: 'Pending Approvals', value: 8, change: '2 overdue', trend: 'warning' },
    { label: 'Critical Alerts', value: 2, change: 'security', trend: 'danger' },
  ];

  return (
    <div style={{
      height: '100%',
      padding: '24px',
      overflow: 'auto',
      background: 'var(--bg-base)',
    }}>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '24px' }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              marginBottom: '12px',
            }}>
              <span style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
              }}>
                Command Center
              </span>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}>
              Workflow Operations Dashboard
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
            }}>
              Monitor active workflows, agent health, and system metrics in real-time
            </p>
          </div>
          <GlassBadge variant="accent">
            <span style={{ fontSize: '8px' }}>●</span>
            All Systems Operational
          </GlassBadge>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <GlassCard noPadding>
              <div style={{ padding: '20px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}>
                  <span style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                  }}>
                    {stat.label}
                  </span>
                  {stat.trend === 'up' && <TrendingUp size={16} color="var(--status-success)" />}
                  {stat.trend === 'warning' && <Clock size={16} color="var(--status-warning)" />}
                  {stat.trend === 'danger' && <AlertCircle size={16} color="var(--status-danger)" />}
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '40px',
                  fontWeight: 700,
                  color: stat.trend === 'danger' ? 'var(--status-danger)' : 
                         stat.trend === 'warning' ? 'var(--status-warning)' : 
                         'var(--accent)',
                  lineHeight: 1,
                  marginBottom: '8px',
                }}>
                  {stat.value}
                </div>
                <span style={{
                  fontSize: '11px',
                  color: stat.trend === 'danger' || stat.trend === 'warning' 
                    ? 'var(--status-' + stat.trend + ')' 
                    : 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)',
                }}>
                  {stat.change}
                </span>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px',
      }}>
        {/* Live Workflow Feed - Takes 8 columns */}
        <div style={{ gridColumn: 'span 8' }}>
          <GlassCard noPadding>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}>
                  Live Workflow Feed
                </h2>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}>
                  Real-time workflow execution status
                </p>
              </div>
              <GlassBadge variant="success">
                5 Running
              </GlassBadge>
            </div>
            <div style={{ padding: '16px' }}>
              {/* Workflow items would go here */}
              <WorkflowItem
                name="Invoice Processing #892"
                node="8/11"
                agent="Invoice Processor"
                progress={73}
                status="RUNNING"
              />
              <WorkflowItem
                name="Employee Onboarding #156"
                node="5/8"
                agent="HR Operations"
                progress={62}
                status="RUNNING"
              />
              <WorkflowItem
                name="Security Scan #201"
                node="6/6"
                agent="Security Monitor"
                progress={100}
                status="COMPLETED"
              />
            </div>
          </GlassCard>
        </div>

        {/* Sidebar - Takes 4 columns */}
        <div style={{ gridColumn: 'span 4' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* AI Insights Panel */}
            <GlassPanel
              title="AI Insights"
              subtitle="Smart workflow analysis"
              badge={<GlassBadge variant="accent">✨ Auto</GlassBadge>}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <InsightItem 
                  text="Invoice #892 depends on Procurement #44 — potential bottleneck"
                />
                <InsightItem 
                  text="Security scan completion ready for GDPR compliance review"
                />
              </div>
            </GlassPanel>

            {/* Pending Approvals */}
            <GlassPanel
              title="Pending Approvals"
              subtitle="Requires immediate action"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <ApprovalItem
                  description="Invoice #892 — $48,816 payment"
                  wait="6.2 hours"
                  overdue
                />
                <ApprovalItem
                  description="Procurement #44 — Platform approval"
                  wait="3.1 hours"
                />
              </div>
            </GlassPanel>

            {/* Quick Actions */}
            <GlassPanel noPadding>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <GlassButton variant="primary" fullWidth>
                  Run All Agents
                </GlassButton>
                <GlassButton variant="outline" fullWidth>
                  View Analytics
                </GlassButton>
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function WorkflowItem({ name, node, agent, progress, status }: any) {
  return (
    <div style={{
      padding: '16px',
      background: 'var(--glass-bg)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      marginBottom: '12px',
      transition: 'all 200ms ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'var(--bg-tile-hover)';
      e.currentTarget.style.borderColor = 'var(--border-hover)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'var(--glass-bg)';
      e.currentTarget.style.borderColor = 'var(--border)';
    }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px',
      }}>
        <div>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}>
            {name}
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}>
            {agent} • Node {node}
          </div>
        </div>
        <GlassBadge variant={status === 'COMPLETED' ? 'success' : 'info'}>
          {status}
        </GlassBadge>
      </div>
      <div style={{ position: 'relative', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            background: status === 'COMPLETED' ? 'var(--status-success)' : 'var(--accent)',
            borderRadius: '3px',
          }}
        />
      </div>
      <div style={{
        fontSize: '11px',
        color: 'var(--text-secondary)',
        marginTop: '8px',
      }}>
        {progress}% complete
      </div>
    </div>
  );
}

function InsightItem({ text }: { text: string }) {
  return (
    <div style={{
      padding: '12px',
      background: 'var(--accent-dim)',
      border: '1px solid var(--accent-border)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
    }}>
      <span style={{ fontSize: '12px', marginTop: '2px' }}>💡</span>
      <span style={{
        fontSize: '12px',
        color: 'var(--text-primary)',
        lineHeight: 1.5,
      }}>
        {text}
      </span>
    </div>
  );
}

function ApprovalItem({ description, wait, overdue }: any) {
  return (
    <div style={{
      padding: '12px',
      background: overdue ? 'rgba(255,61,113,0.10)' : 'var(--glass-bg)',
      border: `1px solid ${overdue ? 'var(--border-danger)' : 'var(--border)'}`,
      borderRadius: '10px',
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        marginBottom: '4px',
      }}>
        {description}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        color: overdue ? 'var(--status-danger)' : 'var(--text-secondary)',
      }}>
        <Clock size={12} />
        Waiting {wait}
        {overdue && <span style={{ color: 'var(--status-danger)', fontWeight: 600 }}>OVERDUE</span>}
      </div>
    </div>
  );
}

export default ExampleGlassScreen;
