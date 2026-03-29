import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AnimatedThemeToggle from '../shared/AnimatedThemeToggle';
import GradientButton from '../shared/GradientButton';
import { getStorageMode } from '../../services/storageMode';

interface NavigationSidebarProps {
  onOpenNiyantaChat?: () => void;
  onToggleAIPanel?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  alertCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'command',     label: 'Command Centre',    path: '/',            icon: '▦' },
  { id: 'studio',      label: 'Agent Studio',       path: '/agents',      icon: '◈' },
  { id: 'workflows',   label: 'Workflows',          path: '/workflows',   icon: '⇢' },
  { id: 'operations',  label: 'Operations',         path: '/monitor',     icon: '◎' },
  { id: 'approvals',   label: 'Approvals',          path: '/approvals',   icon: '✓' },
  { id: 'audit',       label: 'Audit & Compliance', path: '/audit',       icon: '⊘' },
];

const BOTTOM_ITEMS: NavItem[] = [
  { id: 'services',      label: 'Services',      path: '/services',      icon: '⊕' },
  { id: 'notifications', label: 'Notifications', path: '/notifications', icon: '◉' },
  { id: 'settings',      label: 'Settings',      path: '/settings',     icon: '⚙' },
];

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  onToggleAIPanel,
  theme = 'dark',
  onToggleTheme,
  alertCount = 0,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const searchItems = [
    { name: 'Command Centre', path: '/' },
    { name: 'Workflows', path: '/workflows' },
    { name: 'Agent Studio', path: '/agents' },
    { name: 'Operations', path: '/monitor' },
    { name: 'Approvals', path: '/approvals' },
    { name: 'Audit & Compliance', path: '/audit' },
    { name: 'Services', path: '/services' },
    { name: 'Notifications', path: '/notifications' },
    { name: 'Settings', path: '/settings' },
  ];

  const searchResults = sidebarSearch.trim()
    ? searchItems.filter(i => i.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : [];
  const storageMode = getStorageMode();
  const storageLabel = storageMode === 'browser' ? 'Browser Store' : 'Server Store';
  const storageTone = storageMode === 'browser' ? 'var(--status-info)' : 'var(--status-success)';
  const storageBg = storageMode === 'browser' ? 'var(--cc-info-bg)' : 'var(--cc-ok-bg)';
  const storageBorder = storageMode === 'browser' ? 'var(--cc-info-border)' : 'var(--cc-ok-border)';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getActiveId = (): string => {
    const p = location.pathname;
    if (p === '/') return 'command';
    if (p.startsWith('/workflows')) return 'workflows';
    if (p.startsWith('/agents')) return 'studio';
    if (p.startsWith('/monitor')) return 'operations';
    if (p.startsWith('/approvals')) return 'approvals';
    if (p.startsWith('/audit')) return 'audit';
    if (p.startsWith('/services')) return 'services';
    if (p.startsWith('/notifications')) return 'notifications';
    if (p.startsWith('/settings')) return 'settings';
    return 'command';
  };

  const activeId = getActiveId();
  const width = collapsed ? 64 : 260;

  return (
    <nav
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width,
        minWidth: width,
        background: 'var(--bg-dock)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 250ms ease, min-width 250ms ease',
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      {/* Brand */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: collapsed ? '0 12px' : '0 16px',
          gap: 10,
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--text-primary)',
                letterSpacing: '0.12em',
                whiteSpace: 'nowrap',
              }}
            >
              NIYANTA
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                width: 'fit-content',
                height: 18,
                padding: '0 8px',
                borderRadius: 999,
                border: `1px solid ${storageBorder}`,
                background: storageBg,
                color: storageTone,
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {storageLabel}
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            marginLeft: collapsed ? 'auto' : 'auto',
            width: 32,
            height: 32,
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            fontSize: 14,
            flexShrink: 0,
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '▸' : '◂'}
        </button>
      </div>

      {/* Main nav */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8px 8px', gap: 2, overflowY: 'auto' }}>

        {/* Search */}
        {!collapsed && (
          <div ref={searchRef} style={{ position: 'relative', marginBottom: 4, flexShrink: 0 }}>
            <input
              value={sidebarSearch}
              onChange={e => { setSidebarSearch(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              placeholder="Search..."
              style={{
                width: '100%', height: 32, padding: '0 12px', fontSize: 13,
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                borderRadius: 4, color: 'var(--text-primary)', outline: 'none',
                fontFamily: 'var(--font-body)', boxSizing: 'border-box',
              }}
            />
            {showSearch && searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                background: 'var(--bg-panel)', border: '1px solid var(--border)',
                borderRadius: 4, marginTop: 4,
              }}>
                {searchResults.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { navigate(item.path); setSidebarSearch(''); setShowSearch(false); }}
                    style={{
                      width: '100%', height: 36, padding: '0 12px', textAlign: 'left',
                      fontSize: 13, color: 'var(--text-primary)', background: 'transparent',
                      border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
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
        )}
        {NAV_ITEMS.map((item) => {
          const isActive = activeId === item.id;
          const isHovered = hoveredId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                height: 40,
                padding: collapsed ? '0 12px' : '0 12px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: isActive
                  ? 'var(--accent-dim)'
                  : isHovered
                    ? 'var(--bg-tile-hover)'
                    : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                textAlign: 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                transition: 'background 150ms ease',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
            >
              <span style={{ fontSize: 17, width: 22, textAlign: 'center', flexShrink: 0 }}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '8px 4px' }} />

        {/* Bottom nav items */}
        {BOTTOM_ITEMS.map((item) => {
          const isActive = activeId === item.id;
          const isHovered = hoveredId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                height: 40,
                padding: collapsed ? '0 12px' : '0 12px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: isActive
                  ? 'var(--accent-dim)'
                  : isHovered
                    ? 'var(--bg-tile-hover)'
                    : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                textAlign: 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                transition: 'background 150ms ease',
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative',
              }}
            >
              <span style={{ fontSize: 17, width: 22, textAlign: 'center', flexShrink: 0 }}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
              {item.id === 'notifications' && alertCount > 0 && (
                <span
                  style={{
                    position: collapsed ? 'absolute' : 'static',
                    top: collapsed ? 4 : undefined,
                    right: collapsed ? 4 : undefined,
                    marginLeft: collapsed ? 0 : 'auto',
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    background: 'var(--status-danger)',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    display: 'grid',
                    placeItems: 'center',
                    padding: '0 4px',
                  }}
                >
                  {alertCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          flexShrink: 0,
        }}
      >
        {/* AI Panel toggle */}
        {onToggleAIPanel && (
          <GradientButton
            onClick={onToggleAIPanel}
            width={collapsed ? '36px' : '100%'}
            height="36px"
            className="sidebar-niyanta-button"
          >
            <span style={{ color: 'var(--status-info)', fontSize: 12 }}>◎</span>
            {!collapsed && <span>Niyanta AI</span>}
          </GradientButton>
        )}

        {/* User */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            height: 40,
            padding: collapsed ? '0 12px' : '0 12px',
            justifyContent: collapsed ? 'center' : 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                background: 'var(--bg-tile)',
                border: '1px solid var(--border)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                flexShrink: 0,
              }}
            >
              AD
            </div>
            {!collapsed && (
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Admin
              </span>
            )}
          </div>
          {onToggleTheme && !collapsed && <AnimatedThemeToggle theme={theme} onToggle={onToggleTheme} />}
        </div>
      </div>
    </nav>
  );
};

export default NavigationSidebar;
