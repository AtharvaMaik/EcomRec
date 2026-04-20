import React, { useCallback, useState } from 'react';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import BundleBuilder from './components/BundleBuilder';
import CartIntelligence from './components/CartIntelligence';
import Recommendations from './components/Recommendations';
import PurchaseHistory from './components/PurchaseHistory';
import { useCart } from './hooks/useCart';
import { useRecommendations } from './hooks/useRecommendations';
import { useUserHistory } from './hooks/useUserHistory';
import { useUserSession } from './hooks/useUserSession';
import { api } from './services/api';
import './index.css';

function App() {
  const { error: sessionError, loading: sessionLoading, user } = useUserSession();
  const { addItem, cart, checkout, error: cartError, loading: cartLoading, removeItem, updateItem } = useCart(user?.id);
  const { error: historyError, history, refreshHistory } = useUserHistory(user?.id);
  const [refreshKey, setRefreshKey] = useState(0);
  const { bundleBuilder, error: recError, intelligence, loading: recLoading, recommendations, refreshRecommendations } = useRecommendations(user?.id, `${refreshKey}-${cart.items.length}`);
  const [checkingOut, setCheckingOut] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(true);
  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const bumpRecommendationRefresh = () => setRefreshKey(key => key + 1);

  const addToCart = useCallback(async (product) => {
    await addItem(product);
    bumpRecommendationRefresh();
  }, [addItem]);

  const viewProduct = useCallback(async (product) => {
    if (!user?.id) return;
    await api.recordProductView(user.id, product.id);
    bumpRecommendationRefresh();
  }, [user?.id]);

  const handleCheckout = useCallback(async () => {
    setCheckingOut(true);
    try {
      await checkout();
      await refreshHistory();
      await refreshRecommendations();
      bumpRecommendationRefresh();
    } finally {
      setCheckingOut(false);
    }
  }, [checkout, refreshHistory, refreshRecommendations]);

  const handleRemove = useCallback(async (productId) => {
    await removeItem(productId);
    bumpRecommendationRefresh();
  }, [removeItem]);

  const handleUpdateQuantity = useCallback(async (productId, quantity) => {
    await updateItem(productId, quantity);
    bumpRecommendationRefresh();
  }, [updateItem]);

  return (
    <div className={`app-container ${isCartOpen ? 'cart-open' : 'cart-collapsed'}`}>
      <header className="header fade-in">
        <div>
          <div className="store-kicker">Personal storefront</div>
          <h1>RecommendIt Market</h1>
          <p>Multi-item cart recommendations ranked across your bag, browsing, and purchase history.</p>
        </div>
        <button className="bag-toggle" onClick={() => setIsCartOpen(open => !open)} aria-expanded={isCartOpen} aria-controls="shopping-panel">
          <span className="bag-icon" aria-hidden="true"></span>
          <span>Bag</span>
          <strong>{cartCount}</strong>
        </button>
      </header>

      <main>
        {(sessionError || cartError || historyError) && (
          <div className="status-message">{sessionError || cartError || historyError}</div>
        )}
        <div className="storefront-intelligence">
          <CartIntelligence intelligence={intelligence} />
          <BundleBuilder bundles={bundleBuilder} />
        </div>
        <ProductList
          cartItems={cart.items}
          onAddToCart={addToCart}
          onViewProduct={viewProduct}
        />
      </main>

      <aside className={`side-panel glass-panel ${isCartOpen ? 'open' : 'closed'}`} id="shopping-panel">
        <div className="panel-header">
          <div>
            <span>Shopping Bag</span>
            <small>{cartCount} item{cartCount === 1 ? '' : 's'}</small>
          </div>
          <button className="panel-close" onClick={() => setIsCartOpen(false)} title="Collapse cart">x</button>
        </div>
        {(sessionLoading || cartLoading) && <div className="status-message compact">Loading cart...</div>}
        <Cart
          checkingOut={checkingOut}
          items={cart.items}
          onCheckout={handleCheckout}
          onRemove={handleRemove}
          onUpdateQuantity={handleUpdateQuantity}
        />

        <div className="history-wrapper">
          <h3 className="rec-title">Purchase History</h3>
          <PurchaseHistory purchases={history.purchases || []} />
        </div>

        {(recommendations.length > 0 || recLoading || recError) && (
          <div className="recommendations-wrapper fade-in">
            <h3 className="rec-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 21l3-3m11-13l3-3M2 12h4m14 0h4M12 2v4m0 14v4M6.343 6.343l2.828 2.828m8.486 8.486l2.828 2.828M6.343 17.657l2.828-2.828m8.486-8.486l2.828-2.828"></path>
              </svg>
              Suggested Items
            </h3>
            {recLoading && <div className="status-message compact">Finding matches...</div>}
            {recError && <div className="status-message compact">{recError}</div>}
            <Recommendations items={recommendations} onAddToCart={addToCart} />
          </div>
        )}
      </aside>
      {!isCartOpen && (
        <button className="floating-bag" onClick={() => setIsCartOpen(true)} title="Open shopping bag">
          <span>Bag</span>
          <strong>{cartCount}</strong>
        </button>
      )}
    </div>
  );
}

export default App;
