# RecommendIt Market

RecommendIt Market is a full-stack ecommerce recommendation platform built with React, Express, and SQLite. It demonstrates a production-style recommendation workflow where the app learns from the user's current cart, real checkout history, and recent product views to rank the next best products from a 10,000 item catalog.

The project is designed to look and behave like a polished storefront rather than a static demo: products use bundled local category artwork, the cart is persisted through backend APIs, checkout creates real order history, and recommendations are explainable with match scores and reasons.

## Highlights

- Full-stack ecommerce flow with product browsing, search, filters, cart management, checkout, order history, and recommendations.
- Multi-signal recommendation engine using TF-IDF vectors and cosine similarity.
- Blended ranking profile:
  - 60% current cart intent
  - 30% previous purchase history
  - 10% recent product views
- Persistent anonymous user sessions through `localStorage` and backend user records.
- SQLite-backed carts, cart items, orders, order items, product views, and products.
- Local bundled product images for reliable demos without remote image dependencies.
- Collapsible shopping bag UI with quantity controls, checkout, purchase history, and suggested items.
- Backend tests covering cart checkout, purchase history, recent views, image localization, and recommendation ranking.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, vanilla CSS |
| Backend | Node.js, Express |
| Database | SQLite |
| Recommendation Engine | TF-IDF, cosine similarity, weighted profile blending |
| Testing | Node built-in test runner |

## Architecture

```text
frontend/
  src/
    components/        UI components for catalog, cart, history, recommendations
    hooks/             React data hooks for session, cart, products, history
    services/api.js    Central API client
  public/products/     Local bundled product artwork

backend/
  src/
    app.js             Express app assembly
    server.js          Server entrypoint
    db.js              SQLite helpers and schema initialization
    routes/            Product, user, cart, order, recommendation APIs
    services/          Recommendation, cart, history, product, image services
  test/                Backend behavior tests
```

## Recommendation Engine

Each product becomes a text document made from its name, category, and tags. The backend tokenizes that document, computes TF-IDF weights, and stores each product as a sparse vector.

When recommendations are requested, the backend builds a blended user intent vector:

```text
intent = (cart profile * 0.60)
       + (purchase history profile * 0.30)
       + (recent views profile * 0.10)
```

Every candidate product is compared against that intent vector with cosine similarity. Items already represented in the active signal set are excluded, and the top scoring products are returned with:

- `score`: normalized match strength
- `reason`: human-readable explanation, such as cart or purchase-history alignment
- full product metadata for rendering

## API Overview

### Products

```http
GET /api/products?page=1&limit=20&search=coffee&category=Groceries&sort=price_asc
GET /api/products/categories
GET /api/products/:id
POST /api/products/:id/views
```

### User Sessions and History

```http
POST /api/users/session
GET /api/users/:userId/history
```

### Cart

```http
GET /api/cart/:userId
POST /api/cart/:userId/items
PATCH /api/cart/:userId/items/:productId
DELETE /api/cart/:userId/items/:productId
```

### Orders

```http
POST /api/orders/:userId/checkout
GET /api/orders/:userId
```

### Recommendations

```http
POST /api/recommendations
```

Example response:

```json
{
  "recommendations": [
    {
      "id": 42,
      "name": "Smart Headphones",
      "category": "Electronics",
      "price": 79.99,
      "score": 0.84,
      "reason": "Matches your cart, purchase history in Electronics"
    }
  ]
}
```

## Getting Started

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Seed the product catalog

```bash
cd backend
npm run seed
```

This creates `backend/src/database.sqlite` with 10,000 synthetic products and local image paths.

### 3. Start the backend

```bash
cd backend
npm start
```

The backend runs on:

```text
http://localhost:3001
```

### 4. Start the frontend

```bash
cd frontend
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

If you want to use a different backend URL, set:

```bash
VITE_API_BASE=http://localhost:3001/api
```

## Testing

Run backend tests:

```bash
cd backend
npm test
```

Build the frontend:

```bash
cd frontend
npm run build
```

## Resume Bullets

- Built a full-stack ecommerce recommendation platform indexing 10,000 products with a custom TF-IDF and cosine-similarity ranking engine across cart, purchase-history, and browsing signals.
- Engineered persistent commerce workflows with SQLite-backed users, carts, checkout, order history, product views, and explainable recommendations, turning a static product grid into a personalized shopping system.
- Shipped a polished React storefront with local bundled product imagery, collapsible cart UX, search/filter/sort controls, recommendation scores, and tested backend services covering critical recommendation and checkout behavior.

## Project Status

This project is ready for local demo and portfolio use. The current version focuses on anonymous personalization rather than authentication, making it easy to run without external services while still demonstrating real full-stack state and recommendation logic.
