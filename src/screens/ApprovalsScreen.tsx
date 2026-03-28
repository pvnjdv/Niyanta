import React, { useState, useEffect } from 'react';
import { ApprovalQueue } from '../components/workflow/ApprovalQueue';

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  total: number;
  averageResponseTimeMinutes: number;
}

export const ApprovalsScreen: React.FC = () => {
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [currentUser] = useState('admin'); // In real app, get from auth context

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/approvals/stats/summary');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch approval stats:', error);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      {/* Top Stats Bar */}
      <div style={{ 
        height: 80, borderBottom: '1px solid var(--border)', 
        display: 'flex', alignItems: 'center', gap: 24, 
        padding: '0 24px', background: 'var(--bg-panel)',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>
          Approvals
        </div>

        {stats && (
          <>
            <div style={{ flex: 1 }} />
            
            <StatCard 
              label="PENDING" 
              value={stats.pending} 
              color="#F59E0B"
              icon="⏳"
            />
            <StatCard 
              label="APPROVED" 
              value={stats.approved} 
              color="#10B981"
              icon="✓"
            />
            <StatCard 
              label="REJECTED" 
              value={stats.rejected} 
              color="#EF4444"
              icon="✕"
            />
            <StatCard 
              label="AVG RESPONSE" 
              value={`${stats.averageResponseTimeMinutes}m`} 
              color="#3B82F6"
              icon="⏱"
            />
          </>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ApprovalQueue 
          assignedTo={currentUser}
          onApprove={(id) => {
            console.log('Approved:', id);
            fetchStats();
          }}
          onReject={(id) => {
            console.log('Rejected:', id);
            fetchStats();
          }}
        />
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  icon: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color, icon }) => (
  <div style={{
    height: 56, minWidth: 120, padding: '0 16px',
    border: '1px solid var(--border)', background: 'var(--bg-tile)',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
  }}>
    <div style={{ 
      fontFamily: 'var(--font-mono)', fontSize: 9, 
      color: 'var(--text-muted)', marginBottom: 4,
    }}>
      {icon} {label}
    </div>
    <div style={{ 
      fontFamily: 'var(--font-display)', fontSize: 20, 
      fontWeight: 700, color,
    }}>
      {value}
    </div>
  </div>
);
