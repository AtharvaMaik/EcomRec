import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

export function useCart(userId) {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshCart = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await api.getCart(userId);
      setCart(data.cart);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(async (product) => {
    if (!userId) return;
    const data = await api.addCartItem(userId, product.id, 1);
    setCart(data.cart);
  }, [userId]);

  const updateItem = useCallback(async (productId, quantity) => {
    if (!userId) return;
    const data = await api.updateCartItem(userId, productId, quantity);
    setCart(data.cart);
  }, [userId]);

  const removeItem = useCallback(async (productId) => {
    if (!userId) return;
    const data = await api.removeCartItem(userId, productId);
    setCart(data.cart);
  }, [userId]);

  const checkout = useCallback(async () => {
    if (!userId || cart.items.length === 0) return null;
    const productIds = cart.items.map(item => item.product_id);
    const data = await api.checkout(userId, productIds);
    await refreshCart();
    return data.order;
  }, [cart.items, refreshCart, userId]);

  return { addItem, cart, checkout, error, loading, removeItem, updateItem };
}
