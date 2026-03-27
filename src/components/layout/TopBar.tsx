import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  onToggleAIPanel: () => void;
  aiPanelOpen?: boolean;
  alertCount?: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  sidebarWidth?: number;
}

const TopBar: React.FC<TopBarProps> = ({
  onToggleAIPanel,
  aiPanelOpen = false,
  alertCount = 0,
  theme = 'dark',
  onToggleTheme,
  sidebarWidth = 260,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onToggleAIPanel();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onToggleAIPanel]);

  const searchItems = [
    { name: 'Command Centre', path: '/' },
    { name: 'Workflows', path: '/workflows' },
    { name: 'Agent Studio', path: '/agents' },
    { name: 'Operations', path: '/monitor' },
    { name: 'Audit & Compliance', path: '/audit' },
    { name: 'Services', path: '/services' },
  ];

  const filtered = search.trim()
    ? searchItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <header
      style={{
        height: 48,
        position: 'fixed',
        top: 0,
        left: sidebarWidth,
        right: 0,
        zIndex: 100,
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        transition: 'left 250ms ease',
      }}
    >
      {/* Search */}
      <div ref={searchRef} style={{ flex: 1, maxWidth: 420, position: 'relative' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          placeholder="Search... (Ctrl+K for AI)"
          style={{
            width: '100%',
            height: 32,
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '0 12px',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        {filtered.length > 0 && showResults && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
            background: 'var(--bg-panel)', border: '1px solid var(--border)',
            borderRadius: 4, marginTop: 4, maxHeight: 200, overflowY: 'auto',
          }}>
            {filtered.map((item, i) => (
              <button
                key={i}
                onClick={() => { navigate(item.path); setSearch(''); setShowResults(false); }}
                style={{
                  width: '100%', height: 36, padding: '0 12px', textAlign: 'left',
                  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tile-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          style={{
            width: 32, height: 32, borderRadius: 4,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'grid', placeItems: 'center', fontSize: 16,
          }}
        >
          {theme === 'dark' ? '◐' : '◑'}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          style={{
            width: 32, height: 32, borderRadius: 4,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer',
            display: 'grid', placeItems: 'center', fontSize: 16,
            position: 'relative',
          }}
        >
          ◉
          {alertCount > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2, width: 14, height: 14,
              borderRadius: '50%', background: 'var(--status-danger)',
              fontFamily: 'var(--font-mono)', fontSize: 8, color: '#fff',
              display: 'grid', placeItems: 'center',
            }}>{alertCount}</span>
          )}
        </button>

        {/* AI Panel toggle */}
        <button
          onClick={onToggleAIPanel}
          style={{
            height: 32, padding: '0 12px', borderRadius: 4,
            border: '1px solid var(--border)',
            background: aiPanelOpen ? 'var(--accent-dim)' : 'transparent',
            color: aiPanelOpen ? 'var(--accent)' : 'var(--text-primary)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          AI
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--text-muted)', border: '1px solid var(--border)',
            padding: '1px 4px', borderRadius: 2,
          }}>⌘K</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
