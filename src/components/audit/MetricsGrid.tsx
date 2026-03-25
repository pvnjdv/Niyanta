import React, { useState, useEffect, useRef } from 'react';
import { Metrics } from '../../types';

interface MetricsGridProps {
  metrics: Metrics | null;
}

interface AnimatedNumberProps {
  value: number;
  duration?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startRef = useRef(displayValue);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = displayValue;
    const startTime = performance.now();
    const startValue = startRef.current;
    const diff = value - startValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + diff * easeOut;

      setDisplayValue(Math.round(current));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return <span>{displayValue}</span>;
};

const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--accent-dim)',
    border: '1px solid var(--border)',
    borderRadius: 2,
    padding: '14px 12px',
  };

  const numberStyle: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 28,
    color: 'var(--text-primary)',
    lineHeight: 1,
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginTop: 4,
    letterSpacing: '0.05em',
  };

  const stats = [
    { label: 'Total Workflows', value: metrics?.totalWorkflowsRun || 0, format: 'number' as const },
    { label: 'Tasks Created', value: metrics?.totalTasksCreated || 0, format: 'number' as const },
    { label: 'Decisions Made', value: metrics?.totalDecisionsMade || 0, format: 'number' as const },
    { label: 'Escalations', value: metrics?.escalationsTriggered || 0, format: 'number' as const },
    { label: 'Avg Process Time', value: metrics?.avgProcessingTimeMs || 0, format: 'time' as const },
    { label: 'Agents Active', value: metrics?.agentsActive || 0, format: 'agents' as const },
  ];

  const formatValue = (value: number, format: 'number' | 'time' | 'agents'): React.ReactNode => {
    switch (format) {
      case 'time':
        return `${(value / 1000).toFixed(1)}s`;
      case 'agents':
        return `${value} / 5`;
      default:
        return <AnimatedNumber value={value} />;
    }
  };

  return (
    <div style={gridStyle}>
      {stats.map((stat, index) => (
        <div key={index} style={cardStyle}>
          <div style={numberStyle}>{formatValue(stat.value, stat.format)}</div>
          <div style={labelStyle}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default MetricsGrid;
