import React, { type HTMLAttributes } from 'react';

interface GradientButtonProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  width?: string;
  height?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const GradientButton = ({
  children,
  width = '600px',
  height = '100px',
  className = '',
  onClick,
  disabled = false,
  ...props
}: GradientButtonProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div className="gradient-button-shell">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={`rotatingGradient gradient-button ${disabled ? 'gradient-button--disabled' : ''} ${className}`.trim()}
        style={{
          minWidth: width,
          height,
          ['--r' as string]: '0deg',
        } as React.CSSProperties}
        onClick={disabled ? undefined : onClick}
        onKeyDown={handleKeyDown}
        aria-disabled={disabled}
        {...props}
      >
        <span className="gradient-button-label label">{children}</span>
      </div>
    </div>
  );
};

export default GradientButton;
