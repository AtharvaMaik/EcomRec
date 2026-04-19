import React from 'react';

const FALLBACK_IMAGE = '/products/electronics/electronics.svg';

export default function Cart({ checkingOut, items, onCheckout, onRemove, onUpdateQuantity }) {
  if (items.length === 0) {
    return <div className="cart-items empty">Your cart is empty</div>;
  }

  const total = items.reduce((sum, item) => {
    return sum + Number(item.product?.price || 0) * item.quantity;
  }, 0);

  return (
    <>
      <div className="cart-items">
        {items.map(item => {
          const product = item.product || {};
          return (
            <div key={item.product_id} className="cart-item fade-in">
              <img
                src={product.image_url || FALLBACK_IMAGE}
                alt={product.name || `Product ${item.product_id}`}
                className="cart-item-img"
                onError={(event) => {
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              <div className="cart-item-info">
                <div className="cart-item-name">{product.name || `Product ${item.product_id}`}</div>
                <div className="cart-item-price">${Number(product.price || 0).toFixed(2)}</div>
                <div className="quantity-row">
                  <button className="btn-quiet" onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)} title="Decrease quantity">-</button>
                  <span>{item.quantity}</span>
                  <button className="btn-quiet" onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)} title="Increase quantity">+</button>
                  <button className="btn-quiet danger" onClick={() => onRemove(item.product_id)} title="Remove item">Remove</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="cart-summary">
        <div className="cart-total">
          <span>Total</span>
          <strong>${total.toFixed(2)}</strong>
        </div>
        <button className="btn-primary checkout-button" onClick={onCheckout} disabled={checkingOut}>
          {checkingOut ? 'Checking out...' : 'Checkout'}
        </button>
      </div>
    </>
  );
}
