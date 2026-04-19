import React from 'react';

const FALLBACK_IMAGE = '/products/electronics/electronics.svg';

export default function PurchaseHistory({ purchases }) {
  if (!purchases.length) {
    return <div className="status-message compact">No purchases yet</div>;
  }

  return (
    <div className="history-list">
      {purchases.slice(0, 4).map(item => (
        <div key={item.product_id} className="history-item">
          <img
            src={item.image_url || FALLBACK_IMAGE}
            alt={item.name || `Product ${item.product_id}`}
            className="history-item-img"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          <div className="history-item-info">
            <div className="history-item-name">{item.name || `Product ${item.product_id}`}</div>
            <div className="history-item-meta">Qty {item.quantity} - {item.category || 'Purchased'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
