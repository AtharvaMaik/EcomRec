import { demoApi } from './demoApi';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';
const USE_DEMO_API = import.meta.env.VITE_DEMO_MODE === 'true'
  || (typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app'));

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
    if (USE_DEMO_API) return demoApi.createSession(userId);
    return request('/users/session', {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },
  getProducts(params = {}) {
    if (USE_DEMO_API) return demoApi.getProducts(params);
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') query.set(key, value);
    });
    return request(`/products?${query.toString()}`);
  },
  getCategories() {
    if (USE_DEMO_API) return demoApi.getCategories();
    return request('/products/categories');
  },
  recordProductView(userId, productId) {
    if (USE_DEMO_API) return demoApi.recordProductView(userId, productId);
    return request(`/products/${productId}/views`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },
  getCart(userId) {
    if (USE_DEMO_API) return demoApi.getCart(userId);
    return request(`/cart/${userId}`);
  },
  addCartItem(userId, productId, quantity = 1) {
    if (USE_DEMO_API) return demoApi.addCartItem(userId, productId, quantity);
    return request(`/cart/${userId}/items`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });
  },
  updateCartItem(userId, productId, quantity) {
    if (USE_DEMO_API) return demoApi.updateCartItem(userId, productId, quantity);
    return request(`/cart/${userId}/items/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity })
    });
  },
  removeCartItem(userId, productId) {
    if (USE_DEMO_API) return demoApi.removeCartItem(userId, productId);
    return request(`/cart/${userId}/items/${productId}`, { method: 'DELETE' });
  },
  checkout(userId, productIds) {
    if (USE_DEMO_API) return demoApi.checkout(userId, productIds);
    return request(`/orders/${userId}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ productIds })
    });
  },
  getHistory(userId) {
    if (USE_DEMO_API) return demoApi.getHistory(userId);
    return request(`/users/${userId}/history`);
  },
  getRecommendations(userId, limit = 8) {
    if (USE_DEMO_API) return demoApi.getRecommendations(userId, limit);
    return request('/recommendations', {
      method: 'POST',
      body: JSON.stringify({ userId, limit })
    });
  }
};
