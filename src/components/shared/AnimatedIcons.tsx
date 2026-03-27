import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface IconProps {
  size?: number;
  color?: string;
  isActive?: boolean;
}

/* ─── Utility hook for auto-toggling state (demo purposes) ─── */
function useAutoToggle(interval: number, enabled: boolean = false) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setOn((v) => !v), interval);
    return () => clearInterval(id);
  }, [interval, enabled]);
  return on;
}

/* ─── 1. DASHBOARD (Home) ─── */
export function DashboardIcon({ size = 24, color = "currentColor", isActive = false }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: size, height: size }}>
      <motion.rect x="8" y="8" width="11" height="11" rx="2" stroke={color} strokeWidth={2.5}
        animate={isActive ? { scale: 1.05, opacity: 1 } : { scale: 1, opacity: 0.7 }}
        transition={{ duration: 0.3 }}
      />
      <motion.rect x="21" y="8" width="11" height="11" rx="2" stroke={color} strokeWidth={2.5}
        animate={isActive ? { scale: 1.05, opacity: 1 } : { scale: 1, opacity: 0.7 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      />
      <motion.rect x="8" y="21" width="11" height="11" rx="2" stroke={color} strokeWidth={2.5}
        animate={isActive ? { scale: 1.05, opacity: 1 } : { scale: 1, opacity: 0.7 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />
      <motion.rect x="21" y="21" width="11" height="11" rx="2" stroke={color} strokeWidth={2.5}
        animate={isActive ? { scale: 1.05, opacity: 1 } : { scale: 1, opacity: 0.7 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      />
    </svg>
  );
}

/* ─── 2. WORKFLOWS (Tasks with checkmark animation) ─── */
export function WorkflowsIcon({ size = 24, color = "currentColor", isActive = false }: IconProps) {
  const cycling = useAutoToggle(2000, isActive);
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: size, height: size }}>
      <motion.circle cx="20" cy="20" r="14" stroke={color} strokeWidth={2.5}
        animate={isActive ? { scale: 1.05 } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.path d="M13 20l5 5 9-10" stroke={color} strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round"
        animate={cycling && isActive
          ? { pathLength: [0, 1], opacity: [0.5, 1] }
          : { pathLength: 1, opacity: isActive ? 1 : 0.7 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </svg>
  );
}

/* ─── 3. AGENTS (Lightning bolt with pulse) ─── */
export function AgentsIcon({ size = 24, color = "currentColor", isActive = false }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: size, height: size }}>
      <motion.path d="M22 8L12 22h9l-3 10 12-16h-9l3-8z" 
        stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
        fill={isActive ? color : "none"}
        animate={isActive 
          ? { scale: [1, 1.15, 1], opacity: [1, 0.8, 1] }
          : { scale: 1, opacity: 0.7 }}
        transition={{ duration: 1.2, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
      />
    </svg>
  );
}

/* ─── 4. MONITORING (Pulse/Heart monitor) ─── */
export function MonitorIcon({ size = 24, color = "currentColor", isActive = false }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: size, height: size }}>
      <motion.path d="M6 20h6l3-6 4 12 4-6h11" 
        stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
        animate={isActive
          ? { pathLength: [0, 1], opacity: [0.5, 1] }
          : { pathLength: 1, opacity: 0.7 }}
        transition={{ duration: 1.5, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
      />
    </svg>
  );
}

/* ─── 5. AUDIT (Shield with checkmark) ─── */
export function AuditIcon({ size = 24, color = "currentColor", isActive = false }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: size, height: size }}>
      <motion.path d="M20 6L8 12v8c0 7.5 5.2 14.5 12 16 6.8-1.5 12-8.5 12-16v-8L20 6z"
        stroke={color} strokeWidth={2.5} strokeLinejoin="round"
        animate={isActive ? { scale: 1.05, opacity: 1 } : { scale: 1, opacity: 0.7 }}
        transition={{ duration: 0.3 }}
      />
      <motion.path d="M14 20l4 4 8-8" stroke={color} strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round"
        animate={isActive
          ? { pathLength: 1, opacity: 1 }
          : { pathLength: 0.8, opacity: 0.6 }}
        transition={{ duration: 0.4 }}
      />
    </svg>
  );
}

/* ─── 6. SERVICES (Nodes/Network) ─── */
export function ServicesIcon({ size = 24, color = "currentColor", isActive = false }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: size, height: size }}>
      <motion.circle cx="20" cy="12" r="4" stroke={color} strokeWidth={2.5}
        animate={isActive ? { scale: 1.1 } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.circle cx="10" cy="28" r="4" stroke={color} strokeWidth={2.5}
        animate={isActive ? { scale: 1.1 } : { scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />
      <motion.circle cx="30" cy="28" r="4" stroke={color} strokeWidth={2.5}
        animate={isActive ? { scale: 1.1 } : { scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      />
      <motion.line x1="20" y1="16" x2="12" y2="24" stroke={color} strokeWidth={2}
        animate={{ opacity: isActive ? 1 : 0.5 }}
        transition={{ duration: 0.3 }}
      />
      <motion.line x1="20" y1="16" x2="28" y2="24" stroke={color} strokeWidth={2}
        animate={{ opacity: isActive ? 1 : 0.5 }}
        transition={{ duration: 0.3 }}
      />
    </svg>
  );
}

/* ─── 7. FILES (Document icon) ─── */
export function FilesIcon({ size = 24, color = "currentColor", isActive = false }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: size, height: size }}>
      <motion.path d="M12 6h11l7 7v19a2 2 0 01-2 2H12a2 2 0 01-2-2V8a2 2 0 012-2z"
        stroke={color} strokeWidth={2.5} strokeLinejoin="round"
        animate={isActive ? { scale: 1.05, opacity: 1 } : { scale: 1, opacity: 0.7 }}
        transition={{ duration: 0.3 }}
      />
      <motion.path d="M23 6v7h7" stroke={color} strokeWidth={2.5} strokeLinejoin="round"
        animate={{ opacity: isActive ? 1 : 0.5 }}
        transition={{ duration: 0.3 }}
      />
      <motion.line x1="16" y1="20" x2="24" y2="20" stroke={color} strokeWidth={2} strokeLinecap="round"
        animate={{ opacity: isActive ? 1 : 0.4 }}
      />
      <motion.line x1="16" y1="25" x2="24" y2="25" stroke={color} strokeWidth={2} strokeLinecap="round"
        animate={{ opacity: isActive ? 1 : 0.4 }}
      />
    </svg>
  );
}

/* ─── 8. SETTINGS (Gear with rotation) ─── */
export function SettingsIcon({ size = 24, color = "currentColor", isActive = false }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: size, height: size }}>
      <motion.path
        d="M20 12a8 8 0 100 16 8 8 0 000-16z"
        stroke={color} strokeWidth={2.5}
        animate={isActive ? { rotate: 180 } : { rotate: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{ transformOrigin: "20px 20px" }}
      />
      <motion.circle cx="20" cy="20" r="3" stroke={color} strokeWidth={2}
        animate={isActive ? { scale: 1.1 } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.path
        d="M20 8v4m0 16v4m8-20l-2.8 2.8m-10.4 10.4L9 28m23-8h-4M12 20H8m20-9l-2.8 2.8M14.8 25.2L12 28"
        stroke={color} strokeWidth={2.5} strokeLinecap="round"
        animate={isActive ? { rotate: 180, opacity: 1 } : { rotate: 0, opacity: 0.7 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{ transformOrigin: "20px 20px" }}
      />
    </svg>
  );
}

/* ─── 9. NIYANTA CHAT (AI Chat bubble with sparkle) ─── */
export function NiyantaChatIcon({ size = 24, color = "currentColor", isActive = false }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: size, height: size }}>
      <motion.path
        d="M32 18c0 6.6-5.4 12-12 12-1.8 0-3.5-.4-5-1.1L8 32l3.1-7c-.7-1.5-1.1-3.2-1.1-5 0-6.6 5.4-12 12-12s12 5.4 12 12z"
        stroke={color} strokeWidth={2.5} strokeLinejoin="round"
        animate={isActive ? { scale: 1.05, opacity: 1 } : { scale: 1, opacity: 0.7 }}
        transition={{ duration: 0.3 }}
      />
      {/* Sparkle effect */}
      <motion.g
        animate={isActive 
          ? { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }
          : { scale: 1, opacity: 0 }}
        transition={{ duration: 1.5, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
      >
        <motion.path d="M16 16v2m0 2v2m2-4h2m2 0h2m-6-2l1.5 1.5m1.5 1.5l1.5 1.5m-4.5 0l1.5-1.5m1.5-1.5l1.5-1.5"
          stroke={color} strokeWidth={1.5} strokeLinecap="round"
        />
      </motion.g>
    </svg>
  );
}

/* ─── 10. SEARCH (Magnifying glass) ─── */
export function SearchIcon({ size = 24, color = "currentColor", isActive = false }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: size, height: size }}>
      <motion.circle cx="18" cy="18" r="8" stroke={color} strokeWidth={2.5}
        animate={isActive ? { scale: 1.1 } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.line x1="24" y1="24" x2="32" y2="32" stroke={color} strokeWidth={2.5} strokeLinecap="round"
        animate={isActive ? { pathLength: 1 } : { pathLength: 0.8 }}
        transition={{ duration: 0.3 }}
      />
    </svg>
  );
}

/* ─── 11. THEME TOGGLE (Sun/Moon) ─── */
export function ThemeIcon({ size = 24, color = "currentColor", isDark = true }: { size?: number; color?: string; isDark?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: size, height: size }}>
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.g key="moon"
            initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.3 }}
            style={{ transformOrigin: "20px 20px" }}
          >
            <path d="M21 12.79A7.5 7.5 0 1027.21 19 9 9 0 0121 12.79z"
              stroke={color} strokeWidth={2.5} strokeLinejoin="round"
              fill={color} fillOpacity={0.2}
            />
          </motion.g>
        ) : (
          <motion.g key="sun"
            initial={{ scale: 0.5, opacity: 0, rotate: 90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: -90 }}
            transition={{ duration: 0.3 }}
            style={{ transformOrigin: "20px 20px" }}
          >
            <circle cx="20" cy="20" r="6" stroke={color} strokeWidth={2.5} fill={color} fillOpacity={0.2} />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "20px 20px" }}
            >
              <line x1="20" y1="8" x2="20" y2="11" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
              <line x1="20" y1="29" x2="20" y2="32" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
              <line x1="32" y1="20" x2="29" y2="20" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
              <line x1="11" y1="20" x2="8" y2="20" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
              <line x1="28.24" y1="11.76" x2="26.12" y2="13.88" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
              <line x1="13.88" y1="26.12" x2="11.76" y2="28.24" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
              <line x1="28.24" y1="28.24" x2="26.12" y2="26.12" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
              <line x1="13.88" y1="13.88" x2="11.76" y2="11.76" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
            </motion.g>
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}

/* ─── 12. NOTIFICATION (Bell with badge) ─── */
export function NotificationIcon({ size = 24, color = "currentColor", hasNotif = false, count = 0 }: { size?: number; color?: string; hasNotif?: boolean; count?: number }) {
  return (
    <motion.svg viewBox="0 0 40 40" fill="none" 
      style={{ width: size, height: size, transformOrigin: "20px 8px" }}
      animate={hasNotif ? { rotate: [0, 10, -10, 8, -8, 4, 0] } : { rotate: 0 }}
      transition={{ duration: 0.6 }}
    >
      <path d="M30 18a10 10 0 00-20 0c0 10-5 13-5 13h30s-5-3-5-13" 
        stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" 
      />
      <path d="M17.5 35a3 3 0 005 0" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      {hasNotif && (
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.4 }}
        >
          <circle cx="28" cy="10" r="6" fill="#EF4444" />
          {count > 0 && count < 10 && (
            <text x="28" y="13" textAnchor="middle" fill="white" fontSize="8" fontWeight="700">
              {count}
            </text>
          )}
          {count >= 10 && (
            <text x="28" y="13" textAnchor="middle" fill="white" fontSize="7" fontWeight="700">
              9+
            </text>
          )}
        </motion.g>
      )}
    </motion.svg>
  );
}

/* ─── 13. USER/PROFILE (Avatar circle) ─── */
export function ProfileIcon({ size = 24, color = "currentColor", isActive = false }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" style={{ width: size, height: size }}>
      <motion.circle cx="20" cy="20" r="14" stroke={color} strokeWidth={2.5}
        animate={isActive ? { scale: 1.05 } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.circle cx="20" cy="16" r="5" stroke={color} strokeWidth={2.5}
        animate={isActive ? { scale: 1.1 } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.path d="M10 32c0-5.5 4.5-10 10-10s10 4.5 10 10" 
        stroke={color} strokeWidth={2.5} strokeLinecap="round"
        animate={{ opacity: isActive ? 1 : 0.7 }}
        transition={{ duration: 0.3 }}
      />
    </svg>
  );
}
