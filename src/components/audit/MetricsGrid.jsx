import React, { useState, useEffect, useRef } from 'react';

function AnimatedNumber({ value, duration = 1000 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const startRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    startRef.current = displayValue;
    const startTime = performance.now();
    const startValue = startRef.current;
    const diff = value - startValue;

    const animate = (currentTime) => {
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
}

export default function MetricsGrid({ metrics }) {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 8,
  };

  const cardStyle = {
    backgroundColor: 'var(--accent-dim)',
    border: '1px solid var(--border)',
    borderRadius: 2,
    padding: '14px 12px',
  };

  const numberStyle = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 28,
    color: 'var(--text-primary)',
    lineHeight: 1,
  };

  const labelStyle = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginTop: 4,
    letterSpacing: '0.05em',
  };

  const stats = [
    {
      label: 'Total Workflows',
      value: metrics?.totalWorkflowsRun || 0,
      format: 'number',
    },
    {
      label: 'Tasks Created',
      value: metrics?.totalTasksCreated || 0,
      format: 'number',
    },
    {
      label: 'Decisions Made',
      value: metrics?.totalDecisionsMade || 0,
      format: 'number',
    },
    {
      label: 'Escalations',
      value: metrics?.escalationsTriggered || 0,
      format: 'number',
    },
    {
      label: 'Avg Process Time',
      value: metrics?.avgProcessingTimeMs || 0,
      format: 'time',
    },
    {
      label: 'Agents Active',
      value: metrics?.agentsActive || 0,
      format: 'agents',
    },
  ];

  const formatValue = (value, format) => {
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
}
