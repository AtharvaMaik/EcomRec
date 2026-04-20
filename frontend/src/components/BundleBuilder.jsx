import React from 'react';

export default function BundleBuilder({ bundles }) {
  if (!bundles?.length) {
    return null;
  }

  return (
    <section className="bundle-builder">
      <div className="section-label">Complete the bundle</div>
      {bundles.map(bundle => (
        <div className="bundle-row" key={`${bundle.label}-${bundle.productId}`}>
          <div>
            <strong>{bundle.label}</strong>
            <span>{bundle.name}</span>
          </div>
          <em>{Math.round((bundle.score || 0) * 100)}%</em>
        </div>
      ))}
    </section>
  );
}
