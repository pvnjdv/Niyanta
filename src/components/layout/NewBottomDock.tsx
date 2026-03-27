import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ActiveView } from '../../types/ui';

const DOCK_ITEMS: Array<{ id: ActiveView; icon: string; label: string; path: string }> = [
  { id: 'home', icon: '⌂', label: 'HOME', path: '/' },
  { id: 'workflows', icon: '⚡', label: 'WORKFLOWS', path: '/workflows' },
  { id: 'agents', icon: '◉', label: 'AGENTS', path: '/agents' },
  { id: 'monitor', icon: '◔', label: 'MONITOR', path: '/monitor' },
  { id: 'audit', icon: '◫', label: 'AUDIT', path: '/audit' },
  { id: 'services', icon: '▦', label: 'SERVICES', path: '/services' },
];

const BottomDock: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bouncing, setBouncing] = useState<string | null>(null);

  const getActive = (): ActiveView => {
    const p = location.pathname;
    if (p === '/') return 'home';
    if (p.startsWith('/workflows')) return 'workflows';
    if (p.startsWith('/agents')) return 'agents';
    if (p.startsWith('/monitor')) return 'monitor';
    if (p.startsWith('/audit')) return 'audit';
    if (p.startsWith('/services')) return 'services';
    return 'home';
  };

  const active = getActive();

  const handleClick = (item: typeof DOCK_ITEMS[0]) => {
    setBouncing(item.id);
    setTimeout(() => setBouncing(null), 300);
    navigate(item.path);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      zIndex: 100,
    }}>
      <div style={{
        background: 'var(--bg-dock)', border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-dock)', backdropFilter: 'blur(20px) saturate(180%)',
        padding: '0 20px', height: 64,
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {DOCK_ITEMS.map((item, i) => {
          const isActive = active === item.id;
          return (
            <React.Fragment key={item.id}>
              {(i === 2 || i === 4) && (
                <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />
              )}
              <button
                onClick={() => handleClick(item)}
                style={{
                  width: 72, height: 64, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  position: 'relative', background: 'transparent',
                }}
              >
                <div style={{
                  width: 36, height: 36,
                  background: isActive ? 'var(--green-dim)' : 'transparent',
                  border: isActive ? '1px solid var(--green-border)' : '1px solid transparent',
                  display: 'grid', placeItems: 'center',
                  fontSize: 18,
                  color: isActive ? 'var(--green-primary)' : 'var(--text-secondary)',
                  transition: 'all 150ms ease',
                  animation: bouncing === item.id ? 'dockBounce 300ms ease' : undefined,
                }}>
                  {item.icon}
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8, textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: isActive ? 'var(--green-primary)' : 'var(--text-muted)',
                }}>{item.label}</span>
                {isActive && (
                  <span style={{
                    position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
                    width: 3, height: 3, borderRadius: '50%', background: 'var(--green-primary)',
                    animation: 'fadeIn 200ms ease',
                  }} />
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default BottomDock;
