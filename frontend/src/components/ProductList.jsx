import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { useProducts } from '../hooks/useProducts';
import ProductCard from './ProductCard';

export default function ProductList({ cartItems, onAddToCart, onViewProduct }) {
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '', sort: '' });
  const { error, hasMore, loadMore, loading, products } = useProducts(filters);
  const cartIds = new Set(cartItems.map(item => item.product_id));

  const observer = useRef();
  const lastElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [hasMore, loadMore, loading]);

  useEffect(() => {
    api.getCategories()
      .then(data => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  return (
    <>
      <div className="catalog-toolbar glass">
        <input
          value={filters.search}
          onChange={(event) => setFilters(prev => ({ ...prev, search: event.target.value }))}
          placeholder="Search products"
          className="catalog-input"
        />
        <select
          value={filters.category}
          onChange={(event) => setFilters(prev => ({ ...prev, category: event.target.value }))}
          className="catalog-select"
        >
          <option value="">All categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          value={filters.sort}
          onChange={(event) => setFilters(prev => ({ ...prev, sort: event.target.value }))}
          className="catalog-select"
        >
          <option value="">Featured</option>
          <option value="price_asc">Price low to high</option>
          <option value="price_desc">Price high to low</option>
          <option value="name_asc">Name</option>
        </select>
      </div>
      {error && <div className="status-message">{error}</div>}
      <div className="product-grid">
        {products.map((product, index) => {
          const isLast = products.length === index + 1;
          return (
            <ProductCard
              alreadyInCart={cartIds.has(product.id)}
              isLast={isLast ? lastElementRef : null}
              key={product.id}
              onAddToCart={onAddToCart}
              onView={onViewProduct}
              product={product}
            />
          );
        })}
      </div>
      {loading && <div className="loader"></div>}
    </>
  );
}
