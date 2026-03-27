import React from 'react';

interface LogoProps {
  variant?: 'green' | 'white' | 'black';
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'green',
  size = 32,
  className = '',
  style,
}) => {
  const logoPath = `/samples/Niyanta-${variant}.svg`;
  
  return (
    <img
      src={logoPath}
      alt="Niyanta"
      className={className}
      style={{
        height: size,
        width: 'auto',
        objectFit: 'contain',
        ...style,
      }}
    />
  );
};

export const LogoText: React.FC<{
  variant?: 'green' | 'white' | 'black';
  size?: 'sm' | 'md' | 'lg';
  withIcon?: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({
  variant = 'green',
  size = 'md',
  withIcon = true,
  className = '',
  style,
}) => {
  const sizeMap = {
    sm: { icon: 24, text: 16 },
    md: { icon: 32, text: 20 },
    lg: { icon: 48, text: 32 },
  };
  
  const { icon, text } = sizeMap[size];
  
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: withIcon ? 12 : 0,
        ...style,
      }}
    >
      {withIcon && <Logo variant={variant} size={icon} />}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: text,
          fontWeight: 800,
          color: variant === 'green' ? 'var(--accent)' : variant === 'white' ? 'var(--text-primary)' : '#0A0A0F',
          letterSpacing: '-0.02em',
        }}
      >
        नियंत
      </span>
    </div>
  );
};
