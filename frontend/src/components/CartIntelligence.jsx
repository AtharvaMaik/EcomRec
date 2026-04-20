import React from 'react';

export default function CartIntelligence({ intelligence }) {
  if (!intelligence) {
    return null;
  }

  const diversityPercent = Math.round((intelligence.diversityScore || 0) * 100);

  return (
    <section className="intelligence-card">
      <div className="section-label">Multi-item cart engine</div>
      <h3>{intelligence.personality}</h3>
      <p>{intelligence.summary}</p>

      <div className="intelligence-metrics">
        <div>
          <strong>{intelligence.uniqueCartItems}</strong>
          <span>cart items blended</span>
        </div>
        <div>
          <strong>{diversityPercent}%</strong>
          <span>bundle diversity</span>
        </div>
      </div>

      {intelligence.dominantCategories?.length > 0 && (
        <div className="signal-row">
          {intelligence.dominantCategories.map(category => (
            <span key={category.label}>{category.label} {Math.round(category.share * 100)}%</span>
          ))}
        </div>
      )}

      {intelligence.topSignals?.length > 0 && (
        <div className="signal-row compact">
          {intelligence.topSignals.slice(0, 6).map(signal => (
            <span key={signal}>{signal}</span>
          ))}
        </div>
      )}
    </section>
  );
}
