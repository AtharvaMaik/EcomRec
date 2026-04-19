import React from 'react';

const FALLBACK_IMAGE = '/products/electronics/electronics.svg';

export default function Recommendations({ items, onAddToCart }) {
  if (items.length === 0) return null;

  return (
    <div>
      {items.map(item => (
        <div
          key={`rec-${item.id}`}
          className="rec-item fade-in"
          onClick={() => onAddToCart(item)}
          title="Click to add to cart"
        >
          <img
            src={item.image_url || FALLBACK_IMAGE}
            alt={item.name}
            className="rec-item-img"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          <div className="rec-item-info">
            <div className="rec-item-name">{item.name}</div>
            <div className="rec-item-reason">${Number(item.price).toFixed(2)} - {item.reason || item.category}</div>
            <div className="score-pill">{Math.round((item.score || 0) * 100)}% match</div>
          </div>
        </div>
      ))}
    </div>
  );
}
