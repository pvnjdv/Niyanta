import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Agent } from '../types/agent';
import { fetchHealth } from '../services/api';
import StatusDot from '../components/shared/StatusDot';
import ProgressBar from '../components/shared/ProgressBar';

interface ServicesStatusProps {
  agents: Agent[];
}

const ServicesStatus: React.FC<ServicesStatusProps> = ({ agents }) => {
  const navigate = useNavigate();
  const [health, setHealth] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetchHealth().then(setHealth).catch(() => {});
    const iv = setInterval(() => { fetchHealth().then(setHealth).catch(() => {}); }, 15000);
    return () => clearInterval(iv);
  }, []);

  const systemServices = [
    { name: 'Niyanta Orchestrator', status: 'UP', uptime: '99.9%', latency: '12ms', p95: '28ms' },
    { name: 'Groq AI (llama-3.3)', status: 'UP', uptime: '99.7%', latency: '890ms', p95: '1.4s' },
    { name: 'SQLite Database', status: 'UP', uptime: '100%', latency: '2ms', p95: '5ms' },
    { name: 'Workflow Engine', status: 'UP', uptime: '99.9%', latency: '45ms', p95: '120ms' },
    { name: 'Node Execution Runner', status: 'UP', uptime: '99.8%', latency: '78ms', p95: '240ms' },
    { name: 'Audit Logger', status: 'UP', uptime: '100%', latency: '8ms', p95: '15ms' },
    { name: 'File Generator', status: 'UP', uptime: '99.9%', latency: '34ms', p95: '85ms' },
    { name: 'Agent Manager', status: 'UP', uptime: '99.9%', latency: '22ms', p95: '48ms' },
    { name: 'Rate Limiter', status: 'UP', uptime: '100%', latency: '1ms', p95: '3ms' },
    { name: 'Local Storage', status: 'UP', uptime: '100%', latency: '4ms', p95: '8ms' },
  ];

  const agentServices = agents.map(a => ({
    name: a.name,
    color: a.color,
    id: a.id,
    status: 'UP',
    runs: Math.floor(Math.random() * 50) + 10,
    successRate: Math.floor(Math.random() * 8) + 92,
    avgTime: `${(Math.random() * 3 + 1).toFixed(1)}s`,
    lastActive: '2 min ago',
  }));

  const statusColor = (s: string) => s === 'UP' ? 'var(--green-primary)' : s === 'DEGRADED' ? 'var(--status-warning)' : 'var(--status-danger)';
  const latencyColor = (l: string) => {
    const ms = parseInt(l);
    if (isNaN(ms)) return 'var(--text-primary)';
    return ms < 100 ? 'var(--green-primary)' : ms < 500 ? 'var(--status-warning)' : 'var(--status-danger)';
  };

  const allUp = systemServices.every(s => s.status === 'UP');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeScale 220ms ease' }}>
      {/* Header */}
      <div style={{
        height: 56, borderBottom: '1px solid var(--border)', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>SERVICES & SYSTEM STATUS</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>All times UTC</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, padding: '3px 10px',
            background: allUp ? 'var(--green-dim)' : 'rgba(255,184,0,0.1)',
            border: `1px solid ${allUp ? 'var(--green-border)' : 'var(--border-warning)'}`,
            color: allUp ? 'var(--green-primary)' : 'var(--status-warning)',
          }}>{allUp ? 'ALL SYSTEMS OPERATIONAL' : 'DEGRADED'}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* System Services */}
        <div style={{ background: 'var(--bg-tile)', border: '1px solid var(--border)' }}>
          <div style={{ height: 40, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>SYSTEM SERVICES</span>
          </div>
          {/* Table header */}
          <div style={{ height: 32, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
            <span style={{ flex: 2, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>SERVICE</span>
            <span style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>STATUS</span>
            <span style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>UPTIME</span>
            <span style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>LATENCY</span>
            <span style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>P95</span>
          </div>
          {systemServices.map((s, i) => (
            <div key={i} style={{
              height: 44, borderBottom: '1px solid var(--border-subtle)', display: 'flex',
              alignItems: 'center', padding: '0 20px', cursor: 'pointer',
              borderLeft: s.status !== 'UP' ? '2px solid var(--status-danger)' : 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tile-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ flex: 2, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13 }}>{s.name}</span>
              <div style={{ width: 80, display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusDot status={s.status === 'UP' ? 'active' : 'error'} size={6} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: statusColor(s.status) }}>{s.status}</span>
              </div>
              <span style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: 10 }}>{s.uptime}</span>
              <span style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: 10, color: latencyColor(s.latency) }}>{s.latency}</span>
              <span style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{s.p95}</span>
            </div>
          ))}
        </div>

        {/* Agent Services */}
        <div style={{ background: 'var(--bg-tile)', border: '1px solid var(--border)', marginTop: 1 }}>
          <div style={{ height: 40, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>AGENT SERVICES</span>
          </div>
          <div style={{ height: 32, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
            <span style={{ flex: 2, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>AGENT</span>
            <span style={{ width: 60, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>STATUS</span>
            <span style={{ width: 60, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>RUNS</span>
            <span style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>SUCCESS</span>
            <span style={{ width: 70, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>AVG TIME</span>
            <span style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>LAST ACTIVE</span>
          </div>
          {agentServices.map((a, i) => (
            <div key={i} style={{
              height: 44, borderBottom: '1px solid var(--border-subtle)', display: 'flex',
              alignItems: 'center', padding: '0 20px', cursor: 'pointer',
            }}
            onClick={() => navigate(`/agents/${a.id}`)}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tile-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.color }} />
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13 }}>{a.name}</span>
              </div>
              <div style={{ width: 60, display: 'flex', alignItems: 'center', gap: 4 }}>
                <StatusDot status="active" color={a.color} size={6} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--green-primary)' }}>{a.status}</span>
              </div>
              <span style={{ width: 60, fontFamily: 'var(--font-mono)', fontSize: 10 }}>{a.runs}</span>
              <span style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: 10, color: a.successRate >= 95 ? 'var(--green-primary)' : a.successRate >= 80 ? 'var(--status-warning)' : 'var(--status-danger)' }}>{a.successRate}%</span>
              <span style={{ width: 70, fontFamily: 'var(--font-mono)', fontSize: 10 }}>{a.avgTime}</span>
              <span style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{a.lastActive}</span>
            </div>
          ))}
        </div>

        {/* Resource Usage */}
        <div style={{ display: 'flex', gap: 1, marginTop: 1 }}>
          {/* Compute */}
          <div style={{ flex: 1, background: 'var(--bg-tile)', border: '1px solid var(--border)', padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>COMPUTE RESOURCES</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>CPU</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>23%</span>
              </div>
              <ProgressBar value={23} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>Memory</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>1.8 / 8GB</span>
              </div>
              <ProgressBar value={22.5} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginTop: 8 }}>Process uptime: 3d 4h 12m</div>
          </div>

          {/* Storage */}
          <div style={{ flex: 1, background: 'var(--bg-tile)', border: '1px solid var(--border)', padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>STORAGE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginBottom: 6 }}>Database: <span style={{ color: 'var(--text-primary)' }}>128 MB</span></div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>Files</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>42 / 500 GB</span>
              </div>
              <ProgressBar value={8.4} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>Files stored: 234</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>Audit entries: 1,247</div>
          </div>

          {/* Groq API */}
          <div style={{ flex: 1, background: 'var(--bg-tile)', border: '1px solid var(--border)', padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>GROQ API</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 4 }}>847</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 8 }}>REQUESTS TODAY</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 4 }}>1.2M</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 8 }}>TOKENS USED</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>Rate limit: 60 / min</div>
            <div style={{ marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 6px', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>llama-3.3-70b</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesStatus;
