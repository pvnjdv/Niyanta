import React from 'react';

const EmptyState: React.FC = () => (
  <div style={{ flex: 1, display: 'grid', placeItems: 'center', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid var(--accent)', display: 'grid', placeItems: 'center', margin: '0 auto 12px', fontFamily: 'Syne, sans-serif' }}>नि</div>
      <h2 style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '.14em' }}>NIYANTA</h2>
      <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Select an agent to begin orchestration</p>
    </div>
  </div>
);

export default EmptyState;
