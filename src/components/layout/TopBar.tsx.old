import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogoText } from '../shared/Logo';

interface TopBarProps {
  onOpenNiyantaChat: () => void;
  alertCount?: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onOpenNiyantaChat, alertCount = 0, theme = 'dark', onToggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [showAlerts, setShowAlerts] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (alertRef.current && !alertRef.current.contains(e.target as Node)) setShowAlerts(false);
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) setShowAdmin(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenNiyantaChat();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onOpenNiyantaChat]);

  const searchItems = [
    { name: 'Command Center', type: 'screen', path: '/' },
    { name: 'Workflows', type: 'screen', path: '/workflows' },
    { name: 'Agents', type: 'screen', path: '/agents' },
    { name: 'Operations Monitor', type: 'screen', path: '/monitor' },
    { name: 'Audit & Compliance', type: 'screen', path: '/audit' },
    { name: 'Services', type: 'screen', path: '/services' },
    { name: 'Meeting Intelligence', type: 'agent', path: '/agents/meeting' },
    { name: 'Invoice Processor', type: 'agent', path: '/agents/invoice' },
    { name: 'HR Operations', type: 'agent', path: '/agents/hr' },
    { name: 'Procurement', type: 'agent', path: '/agents/procurement' },
    { name: 'Security Monitor', type: 'agent', path: '/agents/security' },
    { name: 'Compliance Agent', type: 'agent', path: '/agents/compliance' },
    { name: 'IT Operations', type: 'agent', path: '/agents/it_ops' },
  ];

  const filtered = search.trim()
    ? searchItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div className="topbar" style={{
      height: 48,
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <LogoText size="sm" variant="green" />
        <span style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)',
          border: '1px solid var(--border)', padding: '2px 6px',
        }}>v2.0</span>
      </div>

      {/* Center — Search */}
      <div style={{ flex: 1, maxWidth: 500, margin: '0 auto', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--text-secondary)' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search workflows, agents, logs... (⌘K)"
            style={{
              width: '100%', height: 30, background: 'var(--bg-input)',
              border: '1px solid var(--border)', borderRadius: 0,
              paddingLeft: 30, fontFamily: 'var(--font-mono)', fontSize: 11,
            }}
          />
        </div>
        {filtered.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
            background: 'var(--bg-panel)', border: '1px solid var(--border)',
            maxHeight: 240, overflowY: 'auto',
          }}>
            {filtered.map((item, i) => (
              <button key={i} onClick={() => { navigate(item.path); setSearch(''); }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                height: 36, padding: '0 12px', textAlign: 'left',
                color: 'var(--text-primary)', background: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tile-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', padding: '1px 4px', textTransform: 'uppercase',
                }}>{item.type}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {/* LIVE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
            animation: 'accentPulse 2s infinite',
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.15em' }}>LIVE</span>
        </div>

        {/* Niyanta AI Button */}
        <button
          onClick={onOpenNiyantaChat}
          style={{
            height: 28, padding: '0 10px',
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent-border)',
            borderRadius: 3,
            display: 'flex', alignItems: 'center', gap: 5,
            fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-glow)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-dim)'; }}
        >
          <span style={{ fontSize: 11 }}>⚡</span> NIYANTA AI
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 8,
            background: 'var(--bg-tile)', border: '1px solid var(--border)',
            padding: '1px 4px', borderRadius: 2, color: 'var(--text-secondary)',
          }}>⌘K</span>
        </button>

        {/* Theme toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </span>
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            <div className="theme-toggle__knob" />
          </button>
        </div>

        {/* Alert bell */}
        <div ref={alertRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            style={{
              width: 28, height: 28, border: '1px solid var(--border)', background: 'transparent',
              display: 'grid', placeItems: 'center', position: 'relative',
            }}
          >
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>🔔</span>
            {alertCount > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3, width: 14, height: 14,
                borderRadius: '50%', background: 'var(--status-danger)',
                fontFamily: 'var(--font-mono)', fontSize: 8, color: '#fff',
                display: 'grid', placeItems: 'center',
              }}>{alertCount}</span>
            )}
          </button>
          {showAlerts && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 200, width: 320,
              background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: 8,
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', padding: '4px 8px', textTransform: 'uppercase' }}>RECENT ALERTS</div>
              <div style={{ padding: '8px', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontSize: 12 }}>No new alerts</div>
              <button
                onClick={() => { navigate('/audit'); setShowAlerts(false); }}
                style={{ width: '100%', padding: '8px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--green-primary)', borderTop: '1px solid var(--border)' }}
              >View All in Audit →</button>
            </div>
          )}
        </div>

        {/* Admin */}
        <div ref={adminRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAdmin(!showAdmin)}
            style={{
              height: 28, padding: '0 10px', background: 'var(--bg-tile)',
              border: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-dim)',
              border: '1px solid var(--accent-border)', display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)',
            }}>AD</div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>Admin</span>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>▾</span>
          </button>
          {showAdmin && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 200, minWidth: 180,
              background: 'var(--bg-panel)', border: '1px solid var(--border)',
            }}>
              {['Profile', 'Settings', 'Admin Panel'].map(item => (
                <button key={item} style={{
                  width: '100%', height: 36, padding: '0 12px', textAlign: 'left',
                  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tile-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >{item}</button>
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <button style={{
                width: '100%', height: 36, padding: '0 12px', textAlign: 'left',
                fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--status-danger)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tile-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >Logout</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
