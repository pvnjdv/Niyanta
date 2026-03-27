import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ActiveView } from '../../types/ui';
import {
  DashboardIcon,
  WorkflowsIcon,
  AgentsIcon,
  MonitorIcon,
  AuditIcon,
  ServicesIcon,
  FilesIcon,
  SettingsIcon,
  NiyantaChatIcon,
  SearchIcon,
  ThemeIcon,
  NotificationIcon,
  ProfileIcon,
} from '../shared/AnimatedIcons';

const softSpringEasing = 'cubic-bezier(0.25, 1.1, 0.4, 1)';

interface MenuItem {
  icon?: string;
  label: string;
  action?: () => void;
  hasDropdown?: boolean;
  children?: MenuItem[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface NavItem {
  id: ActiveView;
  icon: string;
  label: string;
  path: string;
  sections?: MenuSection[];
}

interface NavigationSidebarProps {
  onOpenNiyantaChat?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  alertCount?: number;
}

/* ----------------------------- Brand / Logos ----------------------------- */
function NiyantaLogo() {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: '2px solid var(--accent)',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'Syne, sans-serif',
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--accent)',
      }}
    >
      नि
    </div>
  );
}

function BrandBadge() {
  return (
    <div
      style={{
        position: 'relative',
        flexShrink: 0,
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: 4,
          width: '100%',
        }}
      >
        <div
          style={{
            height: 40,
            width: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 8,
          }}
        >
          <NiyantaLogo />
        </div>
        <div
          style={{
            padding: '4px 8px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 16,
              color: 'var(--text-primary)',
              letterSpacing: '0.1em',
            }}
          >
            NIYANTA
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Avatar -------------------------------- */
function AvatarCircle() {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '50%',
        flexShrink: 0,
        width: 32,
        height: 32,
        background: 'var(--accent-dim)',
        border: '1px solid var(--accent-border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--accent)',
        }}
      >
        AD
      </div>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1px solid var(--border)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

/* ------------------------------ Search Input ----------------------------- */
function SearchContainer({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const [searchValue, setSearchValue] = useState('');

  return (
    <div
      style={{
        position: 'relative',
        flexShrink: 0,
        transition: `all 500ms ${softSpringEasing}`,
        width: isCollapsed ? '100%' : '100%',
        display: isCollapsed ? 'flex' : 'block',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
      }}
    >
      <div
        style={{
          background: 'var(--bg-input)',
          height: 40,
          position: 'relative',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          transition: `all 500ms ${softSpringEasing}`,
          width: isCollapsed ? 40 : '100%',
          minWidth: isCollapsed ? 40 : 'auto',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: `all 500ms ${softSpringEasing}`,
            padding: isCollapsed ? 4 : '0 4px',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <SearchIcon size={18} />
          </div>
        </div>

        <div
          style={{
            flex: 1,
            position: 'relative',
            transition: `opacity 500ms ${softSpringEasing}`,
            overflow: 'hidden',
            opacity: isCollapsed ? 0 : 1,
            width: isCollapsed ? 0 : 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              height: '100%',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingRight: 8,
                paddingTop: 4,
                paddingBottom: 4,
                width: '100%',
              }}
            >
              <input
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  lineHeight: '20px',
                }}
                tabIndex={isCollapsed ? -1 : 0}
              />
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 8,
            border: '1px solid var(--border)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------ Section Title ---------------------------- */
function SectionTitle({
  title,
  onToggleCollapse,
  isCollapsed,
}: {
  title: string;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}) {
  if (isCollapsed) {
    return (
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          transition: `all 500ms ${softSpringEasing}`,
        }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            width: 40,
            height: 40,
            minWidth: 40,
            transition: `all 500ms ${softSpringEasing}`,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
          }}
          aria-label="Expand sidebar"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-tile-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <span
            style={{
              display: 'inline-block',
              transform: 'rotate(180deg)',
              fontSize: 14,
            }}
          >
            ❮
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        overflow: 'hidden',
        transition: `all 500ms ${softSpringEasing}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 40,
          }}
        >
          <div
            style={{
              padding: '4px 8px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 18,
                color: 'var(--text-primary)',
                lineHeight: '27px',
              }}
            >
              {title}
            </div>
          </div>
        </div>
        <div
          style={{
            paddingRight: 4,
          }}
        >
          <button
            type="button"
            onClick={onToggleCollapse}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              width: 40,
              height: 40,
              minWidth: 40,
              transition: `all 500ms ${softSpringEasing}`,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
            aria-label="Collapse sidebar"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tile-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <span style={{ fontSize: 14, transform: 'rotate(-90deg)' }}>❮</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Icon Nav Rail ---------------------------- */
function IconNavButton({
  children,
  isActive = false,
  onClick,
}: {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        width: 40,
        height: 40,
        minWidth: 40,
        transition: `colors 500ms ${softSpringEasing}`,
        background: isActive ? 'var(--accent-dim)' : 'transparent',
        border: isActive ? '1px solid var(--accent-border)' : 'none',
        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        cursor: 'pointer',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--bg-tile-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      {children}
    </button>
  );
}

function IconNavigation({
  activeSection,
  onSectionChange,
  onOpenNiyantaChat,
  theme,
  onToggleTheme,
  alertCount,
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenNiyantaChat?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  alertCount?: number;
}) {
  const navItems = [
    { id: 'dashboard', Icon: DashboardIcon, label: 'Dashboard' },
    { id: 'tasks', Icon: WorkflowsIcon, label: 'Workflows' },
    { id: 'projects', Icon: AgentsIcon, label: 'AI Agents' },
    { id: 'calendar', Icon: MonitorIcon, label: 'Monitoring' },
    { id: 'teams', Icon: AuditIcon, label: 'Audit' },
    { id: 'analytics', Icon: ServicesIcon, label: 'Services' },
    { id: 'files', Icon: FilesIcon, label: 'Files' },
  ];

  return (
    <aside
      style={{
        background: 'var(--bg-dock)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
        padding: 16,
        width: 64,
        height: '100%',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          marginBottom: 8,
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
          }}
        >
          <NiyantaLogo />
        </div>
      </div>

      {/* Navigation Icons */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: '100%',
          alignItems: 'center',
        }}
      >
        {navItems.map((item) => (
          <IconNavButton
            key={item.id}
            isActive={activeSection === item.id}
            onClick={() => onSectionChange(item.id)}
          >
            <item.Icon size={20} isActive={activeSection === item.id} />
          </IconNavButton>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* Bottom section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: '100%',
          alignItems: 'center',
        }}
      >
        {/* Niyanta Chat Button */}
        <IconNavButton onClick={onOpenNiyantaChat}>
          <NiyantaChatIcon size={20} isActive={false} />
        </IconNavButton>
        
        {/* Theme Toggle */}
        <IconNavButton onClick={onToggleTheme}>
          <ThemeIcon size={20} isDark={theme === 'dark'} />
        </IconNavButton>

        {/* Notifications */}
        <IconNavButton>
          <NotificationIcon size={20} hasNotif={alertCount ? alertCount > 0 : false} count={alertCount || 0} />
        </IconNavButton>

        {/* Settings */}
        <IconNavButton
          isActive={activeSection === 'settings'}
          onClick={() => onSectionChange('settings')}
        >
          <SettingsIcon size={20} isActive={activeSection === 'settings'} />
        </IconNavButton>

        {/* User Profile */}
        <div
          style={{
            width: 32,
            height: 32,
          }}
        >
          <AvatarCircle />
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------- Menu Elements ---------------------------- */
function MenuItem({
  item,
  isExpanded,
  onToggle,
  onItemClick,
  isCollapsed,
}: {
  item: MenuItem;
  isExpanded?: boolean;
  onToggle?: () => void;
  onItemClick?: () => void;
  isCollapsed?: boolean;
}) {
  const handleClick = () => {
    if (item.hasDropdown && onToggle) onToggle();
    else onItemClick?.();
  };

  return (
    <div
      style={{
        position: 'relative',
        flexShrink: 0,
        transition: `all 500ms ${softSpringEasing}`,
        width: isCollapsed ? '100%' : '100%',
        display: isCollapsed ? 'flex' : 'block',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
      }}
    >
      <div
        style={{
          borderRadius: 8,
          cursor: 'pointer',
          transition: `all 500ms ${softSpringEasing}`,
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          background: 'transparent',
          border: 'none',
          width: isCollapsed ? 40 : '100%',
          minWidth: isCollapsed ? 40 : 'auto',
          height: 40,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          padding: isCollapsed ? 16 : '8px 16px',
        }}
        onClick={handleClick}
        title={isCollapsed ? item.label : undefined}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-tile-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 14 }}>{item.icon}</span>
        </div>

        <div
          style={{
            flex: 1,
            position: 'relative',
            transition: `opacity 500ms ${softSpringEasing}`,
            overflow: 'hidden',
            opacity: isCollapsed ? 0 : 1,
            width: isCollapsed ? 0 : 'auto',
            marginLeft: isCollapsed ? 0 : 12,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--text-primary)',
              lineHeight: '20px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.label}
          </div>
        </div>

        {item.hasDropdown && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: `opacity 500ms ${softSpringEasing}`,
              opacity: isCollapsed ? 0 : 1,
              width: isCollapsed ? 0 : 'auto',
              marginLeft: isCollapsed ? 0 : 8,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: 'var(--text-secondary)',
                transition: `transform 500ms ${softSpringEasing}`,
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              ▼
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function SubMenuItem({
  item,
  onItemClick,
}: {
  item: MenuItem;
  onItemClick?: () => void;
}) {
  return (
    <div
      style={{
        width: '100%',
        paddingLeft: 36,
        paddingRight: 4,
        paddingTop: 1,
        paddingBottom: 1,
      }}
    >
      <div
        style={{
          height: 40,
          width: '100%',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'colors 150ms',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          padding: '4px 12px',
        }}
        onClick={onItemClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-tile-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: '18px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.label}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuSection({
  section,
  expandedItems,
  onToggleExpanded,
  isCollapsed,
}: {
  section: MenuSection;
  expandedItems: Set<string>;
  onToggleExpanded: (itemKey: string) => void;
  isCollapsed?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
      }}
    >
      <div
        style={{
          position: 'relative',
          flexShrink: 0,
          width: '100%',
          transition: `all 500ms ${softSpringEasing}`,
          overflow: 'hidden',
          height: isCollapsed ? 0 : 40,
          opacity: isCollapsed ? 0 : 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 40,
            padding: '0 16px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {section.title}
          </div>
        </div>
      </div>

      {section.items.map((item, index) => {
        const itemKey = `${section.title}-${index}`;
        const isExpanded = expandedItems.has(itemKey);
        return (
          <div key={itemKey} style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <MenuItem
              item={item}
              isExpanded={isExpanded}
              onToggle={() => onToggleExpanded(itemKey)}
              onItemClick={() => item.action?.()}
              isCollapsed={isCollapsed}
            />
            {isExpanded && item.children && !isCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                {item.children.map((child, childIndex) => (
                  <SubMenuItem
                    key={`${itemKey}-${childIndex}`}
                    item={child}
                    onItemClick={() => child.action?.()}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------- Detail Sidebar ---------------------------- */
function DetailSidebar({
  activeSection,
  theme,
  onToggleTheme,
  alertCount,
  onOpenNiyantaChat,
  navigate,
}: {
  activeSection: string;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  alertCount?: number;
  onOpenNiyantaChat?: () => void;
  navigate: any;
}) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (alertRef.current && !alertRef.current.contains(e.target as Node)) setShowAlerts(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  const toggleCollapse = () => setIsCollapsed((s) => !s);

  const getSidebarContent = (section: string): { title: string; sections: MenuSection[] } => {
    const contentMap: Record<string, { title: string; sections: MenuSection[] }> = {
      dashboard: {
        title: 'Command Center',
        sections: [
          {
            title: 'Quick Stats',
            items: [
              { icon: '⚡', label: 'Active Workflows', action: () => navigate('/workflows') },
              { icon: '⚠', label: 'Failed Tasks', action: () => navigate('/monitor') },
              { icon: '◔', label: 'Pending Approvals', action: () => navigate('/audit') },
            ],
          },
          {
            title: 'Live Feed',
            items: [
              { icon: '●', label: 'Running Workflows' },
              { icon: '◆', label: 'AI Insights' },
              { icon: '▣', label: 'Agent Health' },
            ],
          },
        ],
      },
      tasks: {
        title: 'Workflows',
        sections: [
          {
            title: 'Quick Actions',
            items: [
              { icon: '+', label: 'New Workflow', action: () => navigate('/workflows') },
              { icon: '⊙', label: 'Templates' },
            ],
          },
          {
            title: 'Active Workflows',
            items: [
              { icon: '●', label: 'Running (47)', hasDropdown: true, children: [
                { icon: '📊', label: 'Invoice Processing #892' },
                { icon: '👥', label: 'Employee Onboarding #156' },
              ]},
              { icon: '◐', label: 'Scheduled (12)', hasDropdown: true },
              { icon: '◯', label: 'Paused (3)', hasDropdown: true },
            ],
          },
          {
            title: 'Categories',
            items: [
              { icon: '💰', label: 'Finance Operations' },
              { icon: '👥', label: 'HR Operations' },
              { icon: '🔒', label: 'Security & Compliance' },
              { icon: '💻', label: 'IT Operations' },
            ],
          },
        ],
      },
      projects: {
        title: 'AI Agents',
        sections: [
          {
            title: 'Quick Actions',
            items: [
              { icon: '▶', label: 'Run All Agents' },
              { icon: '⊕', label: 'Deploy New Agent' },
            ],
          },
          {
            title: 'Agent List',
            items: [
              { icon: '💰', label: 'Finance Operations', hasDropdown: true, children: [
                { icon: '📄', label: 'Invoice Processing' },
                { icon: '💳', label: 'Expense Analysis' },
              ]},
              { icon: '👥', label: 'HR Operations', hasDropdown: true },
              { icon: '🔒', label: 'Security Monitor', hasDropdown: true },
              { icon: '💻', label: 'IT Operations', hasDropdown: true },
            ],
          },
          {
            title: 'Status',
            items: [
              { icon: '●', label: 'Active: 11/11' },
              { icon: '◐', label: 'Processing: 3' },
              { icon: '✓', label: 'Health: 98%' },
            ],
          },
        ],
      },
      calendar: {
        title: 'Operations',
        sections: [
          {
            title: 'Monitoring',
            items: [
              { icon: '◔', label: 'Live Dashboard', action: () => navigate('/monitor') },
              { icon: '📊', label: 'Metrics & Analytics' },
              { icon: '⚡', label: 'Performance Logs' },
            ],
          },
          {
            title: 'Alerts',
            items: [
              { icon: '🔴', label: 'Critical: 2', hasDropdown: true },
              { icon: '🟡', label: 'Warnings: 5', hasDropdown: true },
              { icon: '🟢', label: 'Info: 12', hasDropdown: true },
            ],
          },
        ],
      },
      teams: {
        title: 'Audit & Compliance',
        sections: [
          {
            title: 'Compliance',
            items: [
              { icon: '📋', label: 'Audit Trail', action: () => navigate('/audit') },
              { icon: '✓', label: 'Approvals' },
              { icon: '🔍', label: 'Reviews' },
            ],
          },
          {
            title: 'Reports',
            items: [
              { icon: '📊', label: 'Daily Reports' },
              { icon: '📈', label: 'Weekly Summary' },
              { icon: '📉', label: 'Compliance Status' },
            ],
          },
        ],
      },
      analytics: {
        title: 'Services',
        sections: [
          {
            title: 'System Health',
            items: [
              { icon: '●', label: 'All Services: Online' },
              { icon: '🔌', label: 'API Gateway' },
              { icon: '📦', label: 'Database' },
              { icon: '⚙', label: 'Worker Queues' },
            ],
          },
          {
            title: 'Integrations',
            items: [
              { icon: '🔗', label: 'Connected Services' },
              { icon: '🔑', label: 'API Keys' },
            ],
          },
        ],
      },
      files: {
        title: 'Files',
        sections: [
          {
            title: 'Quick Actions',
            items: [
              { icon: '☁', label: 'Upload file' },
              { icon: '+', label: 'New folder' },
            ],
          },
        ],
      },
      settings: {
        title: 'Settings',
        sections: [
          {
            title: 'Account',
            items: [
              { icon: '👤', label: 'Profile settings' },
              { icon: '🔒', label: 'Security' },
              { icon: '🔔', label: 'Notifications' },
            ],
          },
          {
            title: 'Workspace',
            items: [
              { icon: '⚙', label: 'Preferences', hasDropdown: true, children: [
                { icon: '🎨', label: 'Theme settings' },
                { icon: '🕐', label: 'Time zone' },
              ]},
              { icon: '🔗', label: 'Integrations' },
            ],
          },
        ],
      },
    };

    return contentMap[section] || contentMap.tasks;
  };

  const content = getSidebarContent(activeSection);

  return (
    <aside
      style={{
        background: 'var(--bg-dock)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        alignItems: 'flex-start',
        padding: isCollapsed ? '16px 0' : 16,
        width: isCollapsed ? 64 : 320,
        minWidth: isCollapsed ? 64 : 320,
        transition: `all 500ms ${softSpringEasing}`,
        height: '100%',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        borderRight: '1px solid var(--border)',
      }}
    >
      {!isCollapsed && <BrandBadge />}

      <SectionTitle title={content.title} onToggleCollapse={toggleCollapse} isCollapsed={isCollapsed} />
      <SearchContainer isCollapsed={isCollapsed} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          overflowY: 'auto',
          transition: `all 500ms ${softSpringEasing}`,
          gap: isCollapsed ? 8 : 16,
          alignItems: isCollapsed ? 'center' : 'flex-start',
          flex: 1,
        }}
      >
        {content.sections.map((section, index) => (
          <MenuSection
            key={`${activeSection}-${index}`}
            section={section}
            expandedItems={expandedItems}
            onToggleExpanded={toggleExpanded}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>

      {!isCollapsed && (
        <div
          style={{
            width: '100%',
            marginTop: 'auto',
            paddingTop: 8,
            borderTop: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 8px',
            }}
          >
            <AvatarCircle />
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--text-primary)',
              }}
            >
              Admin User
            </div>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                marginLeft: 'auto',
                width: 32,
                height: 32,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
              }}
              aria-label="More"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-tile-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: 14 }}>⋯</span>
            </button>
          </div>
          {showUserMenu && (
            <div
              ref={userMenuRef}
              style={{
                position: 'absolute',
                bottom: 60,
                left: 16,
                right: 16,
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 4,
                zIndex: 1000,
              }}
            >
              {['Profile', 'Settings', 'Admin Panel'].map(item => (
                <button key={item} style={{
                  width: '100%', height: 36, padding: '0 12px', textAlign: 'left',
                  fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)',
                  background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tile-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >{item}</button>
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <button style={{
                width: '100%', height: 36, padding: '0 12px', textAlign: 'left',
                fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--status-danger)',
                background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tile-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >Logout</button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

/* --------------------------------- Main Layout ------------------------------ */
const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  onOpenNiyantaChat,
  theme = 'dark',
  onToggleTheme,
  alertCount = 0,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');

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

  const mapActiveToSection = (active: ActiveView): string => {
    const mapping: Record<ActiveView, string> = {
      home: 'dashboard',
      workflows: 'tasks',
      agents: 'projects',
      monitor: 'calendar',
      audit: 'teams',
      services: 'analytics',
    };
    return mapping[active] || 'dashboard';
  };

  useEffect(() => {
    setActiveSection(mapActiveToSection(getActive()));
  }, [location.pathname]);

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'row',
        zIndex: 50,
      }}
    >
      <IconNavigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onOpenNiyantaChat={onOpenNiyantaChat}
        theme={theme}
        onToggleTheme={onToggleTheme}
        alertCount={alertCount}
      />
      <DetailSidebar
        activeSection={activeSection}
        theme={theme}
        onToggleTheme={onToggleTheme}
        alertCount={alertCount}
        onOpenNiyantaChat={onOpenNiyantaChat}
        navigate={navigate}
      />
    </div>
  );
};

export default NavigationSidebar;
