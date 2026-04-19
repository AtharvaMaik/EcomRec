# Cart History Recommendations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a more robust full-stack shopping experience where local bundled product images, persisted carts, real purchase history, and recent product views all influence sorted recommendations.

**Architecture:** Keep the React/Vite frontend and Express/SQLite backend, but split the backend into focused route and service modules. Recommendations are computed from TF-IDF product vectors blended into a user intent profile from cart items, previous purchases, and recent views.

**Tech Stack:** React 19, Vite, vanilla CSS, Node.js, Express, SQLite, Node built-in test runner.

---

### Task 1: Backend Tests

**Files:**
- Create: `backend/test/recommendationEngine.test.js`
- Create: `backend/test/cartHistoryServices.test.js`
- Modify: `backend/package.json`

- [ ] Add Node's built-in test script.
- [ ] Write failing tests for multi-item cart recommendations, purchase-history weighting, and cart/order persistence helpers.
- [ ] Run `npm test` in `backend` and verify tests fail because the target modules do not exist yet.

### Task 2: Backend Services And Routes

**Files:**
- Create: `backend/src/db.js`
- Create: `backend/src/app.js`
- Create: `backend/src/services/recommendationEngine.js`
- Create: `backend/src/services/cartService.js`
- Create: `backend/src/services/historyService.js`
- Create: `backend/src/services/imageCatalog.js`
- Create: `backend/src/routes/products.js`
- Create: `backend/src/routes/users.js`
- Create: `backend/src/routes/cart.js`
- Create: `backend/src/routes/orders.js`
- Create: `backend/src/routes/recommendations.js`
- Create: `backend/src/middleware/errorHandler.js`
- Modify: `backend/src/server.js`

- [ ] Move Express setup into `app.js`.
- [ ] Add schema initialization for users, carts, cart items, orders, order items, and product views.
- [ ] Implement robust products, users, cart, orders, product views, and recommendations endpoints.
- [ ] Implement blended recommendation scoring with cart weight `0.6`, purchase history weight `0.3`, and recent views weight `0.1`.
- [ ] Run backend tests and verify they pass.

### Task 3: Local Bundled Product Images

**Files:**
- Create local image files under `frontend/public/products/**`
- Create: `backend/src/services/imageCatalog.js`
- Modify: `backend/src/generate_data.js`

- [ ] Add deterministic category/noun-to-local-image mapping.
- [ ] Update product generation to save `/products/...` image paths instead of remote placeholder URLs.
- [ ] Provide frontend image fallback behavior for missing image files.

### Task 4: Frontend Full-Stack Cart And History

**Files:**
- Create: `frontend/src/services/api.js`
- Create: `frontend/src/hooks/useUserSession.js`
- Create: `frontend/src/hooks/useCart.js`
- Create: `frontend/src/hooks/useProducts.js`
- Create: `frontend/src/hooks/useRecommendations.js`
- Create: `frontend/src/components/ProductCard.jsx`
- Create: `frontend/src/components/PurchaseHistory.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/ProductList.jsx`
- Modify: `frontend/src/components/Cart.jsx`
- Modify: `frontend/src/components/Recommendations.jsx`
- Modify: `frontend/src/index.css`

- [ ] Restore or create an anonymous user session through the backend.
- [ ] Store cart state through backend APIs.
- [ ] Add checkout that creates real order history and clears the cart.
- [ ] Fetch recommendations from cart, purchase history, and views.
- [ ] Add product-view tracking when a user interacts with a product.
- [ ] Render local images with graceful fallback.

### Task 5: Verification

**Files:**
- Modify docs if behavior changes need explanation.

- [ ] Run `npm test` in `backend`.
- [ ] Run `npm run build` in `frontend`.
- [ ] Confirm the backend starts.
- [ ] Confirm the frontend build completes with local image paths and no remote placeholder dependency.

### Self-Review

- Spec coverage: local bundled images, persisted cart, checkout-created purchase history, recent views, robust backend routes, and blended recommendations are all covered.
- Placeholder scan: no unresolved `TBD` or missing scope decisions.
- Type consistency: API payloads use `userId`, `productId`, `productIds`, `quantity`, and `recommendations` consistently across tasks.
