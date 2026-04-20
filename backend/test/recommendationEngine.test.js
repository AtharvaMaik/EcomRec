const assert = require('node:assert/strict');
const test = require('node:test');

const { buildRecommendationEngine } = require('../src/services/recommendationEngine');

const PRODUCTS = [
  { id: 1, name: 'Smart Headphones', category: 'Electronics', tags: 'wireless,audio,smart', price: 99, image_url: '/products/electronics/headphones.svg' },
  { id: 2, name: 'Wireless Charger', category: 'Electronics', tags: 'wireless,charging,smart', price: 29, image_url: '/products/electronics/charger.svg' },
  { id: 3, name: 'Coffee Beans', category: 'Groceries', tags: 'coffee,beans,premium', price: 14, image_url: '/products/groceries/coffee.svg' },
  { id: 4, name: 'Olive Oil', category: 'Groceries', tags: 'cooking,premium,pantry', price: 12, image_url: '/products/groceries/oil.svg' },
  { id: 5, name: 'Yoga Mat', category: 'Sports & Outdoors', tags: 'fitness,stretch,training', price: 24, image_url: '/products/sports/yoga-mat.svg' }
];

test('multi-item cart recommendations exclude cart products and sort by blended cart similarity', () => {
  const engine = buildRecommendationEngine(PRODUCTS);

  const results = engine.recommend({
    cartProductIds: [1, 3],
    purchaseProductIds: [],
    recentViewProductIds: [],
    limit: 3
  });

  assert.deepEqual(results.map(product => product.id), [2, 4]);
  assert.ok(results[0].score > results[1].score);
  assert.match(results[0].reason, /cart/i);
});

test('purchase history is used when the cart is empty', () => {
  const engine = buildRecommendationEngine(PRODUCTS);

  const results = engine.recommend({
    cartProductIds: [],
    purchaseProductIds: [1],
    recentViewProductIds: [],
    limit: 2
  });

  assert.equal(results[0].id, 2);
  assert.match(results[0].reason, /purchase/i);
});

test('recent views provide a light recommendation signal', () => {
  const engine = buildRecommendationEngine(PRODUCTS);

  const results = engine.recommend({
    cartProductIds: [],
    purchaseProductIds: [],
    recentViewProductIds: [3],
    limit: 2
  });

  assert.equal(results[0].id, 4);
  assert.match(results[0].reason, /view/i);
});

test('detailed recommendations expose cart mix intelligence and per-item score breakdowns', () => {
  const engine = buildRecommendationEngine(PRODUCTS);

  const payload = engine.recommendDetailed({
    cartProductIds: [1, 3],
    purchaseProductIds: [5],
    recentViewProductIds: [4],
    limit: 3
  });

  assert.equal(payload.intelligence.uniqueCartItems, 2);
  assert.equal(payload.intelligence.totalCartSignals, 2);
  assert.ok(payload.intelligence.diversityScore > 0);
  assert.ok(payload.intelligence.dominantCategories.length >= 2);
  assert.ok(payload.intelligence.topSignals.length > 0);
  assert.match(payload.intelligence.summary, /multi-item/i);

  assert.equal(payload.recommendations[0].id, 2);
  assert.ok(payload.recommendations[0].breakdown.cart > 0);
  assert.ok(Array.isArray(payload.recommendations[0].matchedSignals));
  assert.ok(payload.bundleBuilder.length > 0);
});
