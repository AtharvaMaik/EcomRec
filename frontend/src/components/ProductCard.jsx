import React from 'react';

const FALLBACK_IMAGE = '/products/electronics/electronics.svg';

export default function ProductCard({ alreadyInCart, isLast, onAddToCart, onView, product }) {
  return (
    <div className="product-card glass fade-in" ref={isLast || null}>
      <button className="product-image-button" onClick={() => onView(product)} title="View product">
        <img
          src={product.image_url || FALLBACK_IMAGE}
          alt={product.name}
          className="product-image"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
      </button>
      <div className="product-info">
        <div className="product-category">{product.category}</div>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-tags">
          {product.tags && product.tags.split(',').map(tag => (
            <span key={tag} className="product-tag">{tag}</span>
          ))}
        </div>
        <div className="product-footer">
          <span className="product-price">${Number(product.price).toFixed(2)}</span>
          <button className="btn-primary" onClick={() => onAddToCart(product)} disabled={alreadyInCart}>
            {alreadyInCart ? 'In Cart' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
