import React from 'react';

interface TileProps {
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  warning?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const Tile: React.FC<TileProps> = ({ children, active, danger, warning, onClick, style }) => {
  const [hovered, setHovered] = React.useState(false);
  const borderColor = danger ? 'var(--border-danger)' : warning ? 'var(--border-warning)' : active ? 'var(--border-active)' : hovered ? 'var(--border-hover)' : 'var(--border)';
  const boxShadow = active ? 'var(--shadow-active)' : undefined;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-tile)',
        border: `1px solid ${borderColor}`,
        borderRadius: 0,
        boxShadow,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        cursor: onClick ? 'pointer' : undefined,
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Tile;
