import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  hover?: boolean;
  noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  style,
  onClick,
  hover = true,
  noPadding = false,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        ease: shouldReduceMotion ? 'linear' : [0.16, 1, 0.3, 1],
      }}
      onClick={onClick}
      className={`glass-card-wrapper ${hover ? 'glass-card-hover' : ''} ${className}`}
      style={{
        position: 'relative',
        background: 'var(--glass-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        padding: noPadding ? 0 : '24px',
        ...style,
      }}
    >
      {hover && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, var(--glass-overlay) 0%, transparent 50%, transparent 100%)',
            opacity: 0,
            transition: 'opacity 300ms ease',
            pointerEvents: 'none',
            zIndex: 0,
          }}
          className="glass-card-overlay"
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
      <style>{`
        .glass-card-hover:hover .glass-card-overlay {
          opacity: 1;
        }
        .glass-card-hover:hover {
          border-color: var(--border-hover);
        }
      `}</style>
    </motion.div>
  );
};

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  noPadding?: boolean;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  style,
  title,
  subtitle,
  badge,
  noPadding = false,
}) => {
  return (
    <div
      className={className}
      style={{
        background: 'var(--glass-panel)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
        padding: noPadding ? 0 : '20px',
        overflow: 'hidden',
        ...style,
      }}
    >
      {(title || subtitle || badge) && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <div>
            {title && (
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: subtitle ? '4px' : 0,
              }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
              }}>
                {subtitle}
              </p>
            )}
          </div>
          {badge && <div>{badge}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
  style,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, var(--accent) 0%, rgba(0,230,118,0.8) 100%)',
          color: '#0A0A0F',
          border: 'none',
          boxShadow: '0 4px 12px var(--accent-glow)',
        };
      case 'danger':
        return {
          background: 'rgba(255,61,113,0.15)',
          color: 'var(--status-danger)',
          border: '1px solid var(--border-danger)',
        };
      case 'outline':
        return {
          background: 'transparent',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
        };
      default:
        return {
          background: 'var(--glass-bg)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '8px 16px', fontSize: '12px', borderRadius: '10px' };
      case 'lg':
        return { padding: '14px 28px', fontSize: '15px', borderRadius: '14px' };
      default:
        return { padding: '10px 20px', fontSize: '13px', borderRadius: '12px' };
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        ...getVariantStyles(),
        ...getSizeStyles(),
        backdropFilter: variant === 'primary' ? 'none' : 'blur(12px)',
        WebkitBackdropFilter: variant === 'primary' ? 'none' : 'blur(12px)',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 300ms cubic-bezier(0.25, 1.1, 0.4, 1)',
        outline: 'none',
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          if (variant === 'primary') {
            e.currentTarget.style.boxShadow = '0 6px 20px var(--accent-glow)';
          } else {
            e.currentTarget.style.background = 'var(--bg-tile-hover)';
            e.currentTarget.style.borderColor = 'var(--border-hover)';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0)';
          const variantStyles = getVariantStyles();
          e.currentTarget.style.background = variantStyles.background || '';
          e.currentTarget.style.borderColor = variantStyles.border?.includes('solid') 
            ? variantStyles.border.split('solid')[1].trim()
            : '';
          if (variant === 'primary') {
            e.currentTarget.style.boxShadow = '0 4px 12px var(--accent-glow)';
          }
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
        }
      }}
    >
      {children}
    </button>
  );
};

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerStyle?: React.CSSProperties;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  containerStyle,
  ...props
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...containerStyle }}>
      {label && (
        <label style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
        }}>
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${error ? 'var(--border-danger)' : 'var(--border)'}`,
          borderRadius: '12px',
          padding: '12px 16px',
          outline: 'none',
          transition: 'all 200ms ease',
          fontSize: '13px',
          fontFamily: 'var(--font-body)',
          color: 'var(--text-primary)',
          width: '100%',
          ...props.style,
        }}
      />
      {error && (
        <span style={{
          fontSize: '11px',
          color: 'var(--status-danger)',
          fontFamily: 'var(--font-body)',
        }}>
          {error}
        </span>
      )}
    </div>
  );
};

export const GlassBadge: React.FC<{
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, variant = 'neutral', className = '', style }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          background: 'rgba(0,230,118,0.15)',
          color: 'var(--status-success)',
          border: '1px solid var(--accent-border)',
        };
      case 'warning':
        return {
          background: 'rgba(255,179,0,0.15)',
          color: 'var(--status-warning)',
          border: '1px solid var(--border-warning)',
        };
      case 'danger':
        return {
          background: 'rgba(255,61,113,0.15)',
          color: 'var(--status-danger)',
          border: '1px solid var(--border-danger)',
        };
      case 'info':
        return {
          background: 'rgba(0,188,212,0.15)',
          color: 'var(--status-info)',
          border: '1px solid rgba(0,188,212,0.35)',
        };
      case 'accent':
        return {
          background: 'var(--accent-dim)',
          color: 'var(--accent)',
          border: '1px solid var(--accent-border)',
        };
      default:
        return {
          background: 'var(--glass-bg)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
        };
    }
  };

  return (
    <span
      className={className}
      style={{
        ...getVariantStyles(),
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 200ms ease',
        ...style,
      }}
    >
      {children}
    </span>
  );
};
