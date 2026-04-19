const assert = require('node:assert/strict');
const test = require('node:test');
const sqlite3 = require('sqlite3').verbose();

const { initializeCommerceSchema } = require('../src/db');
const {
  createOrGetUser,
  getActiveCart,
  addCartItem,
  removeCartItem,
  checkoutCart
} = require('../src/services/cartService');
const { getPurchaseHistory, recordProductView, getRecentProductViews } = require('../src/services/historyService');

function openMemoryDb() {
  return new sqlite3.Database(':memory:');
}

test('cart checkout creates real purchase history and clears the cart', async () => {
  const db = openMemoryDb();
  await initializeCommerceSchema(db);

  await createOrGetUser(db, 'user-test');
  await addCartItem(db, 'user-test', 10, 2);
  await addCartItem(db, 'user-test', 20, 1);

  const beforeCheckout = await getActiveCart(db, 'user-test');
  assert.deepEqual(beforeCheckout.items.map(item => item.product_id), [10, 20]);

  const order = await checkoutCart(db, 'user-test', [
    { id: 10, price: 12.5 },
    { id: 20, price: 9.99 }
  ]);

  assert.ok(order.id.startsWith('ord_'));

  const history = await getPurchaseHistory(db, 'user-test');
  assert.deepEqual(history.map(item => item.product_id), [10, 20]);

  const afterCheckout = await getActiveCart(db, 'user-test');
  assert.deepEqual(afterCheckout.items, []);
});

test('product views keep the most recent unique product ids first', async () => {
  const db = openMemoryDb();
  await initializeCommerceSchema(db);

  await createOrGetUser(db, 'viewer-test');
  await recordProductView(db, 'viewer-test', 10);
  await recordProductView(db, 'viewer-test', 20);
  await recordProductView(db, 'viewer-test', 10);

  const views = await getRecentProductViews(db, 'viewer-test', 3);

  assert.deepEqual(views.map(item => item.product_id), [10, 20]);

  await removeCartItem(db, 'viewer-test', 10);
});
