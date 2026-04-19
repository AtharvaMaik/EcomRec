const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with ${response.status}`);
  }

  return data;
}

export const api = {
  createSession(userId) {
    return request('/users/session', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },
  getProducts(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') query.set(key, value);
    });
    return request(`/products?${query.toString()}`);
  },
  getCategories() {
    return request('/products/categories');
  },
  recordProductView(userId, productId) {
    return request(`/products/${productId}/views`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },
  getCart(userId) {
    return request(`/cart/${userId}`);
  },
  addCartItem(userId, productId, quantity = 1) {
    return request(`/cart/${userId}/items`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });
  },
  updateCartItem(userId, productId, quantity) {
    return request(`/cart/${userId}/items/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity })
    });
  },
  removeCartItem(userId, productId) {
    return request(`/cart/${userId}/items/${productId}`, { method: 'DELETE' });
  },
  checkout(userId, productIds) {
    return request(`/orders/${userId}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ productIds })
    });
  },
  getHistory(userId) {
    return request(`/users/${userId}/history`);
  },
  getRecommendations(userId, limit = 8) {
    return request('/recommendations', {
      method: 'POST',
      body: JSON.stringify({ userId, limit })
    });
  }
};
