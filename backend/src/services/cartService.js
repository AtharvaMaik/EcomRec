const crypto = require('crypto');
const { all, get, run } = require('../db');

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

async function createOrGetUser(db, userId, name = 'Guest Shopper') {
  if (!userId || typeof userId !== 'string') {
    throw Object.assign(new Error('userId is required'), { status: 400 });
  }

  const existing = await get(db, 'SELECT * FROM users WHERE id = ?', [userId]);
  if (existing) return existing;

  await run(db, 'INSERT INTO users (id, name) VALUES (?, ?)', [userId, name]);
  return get(db, 'SELECT * FROM users WHERE id = ?', [userId]);
}

async function ensureActiveCart(db, userId) {
  await createOrGetUser(db, userId);

  const existing = await get(
    db,
    "SELECT * FROM carts WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1",
    [userId]
  );

  if (existing) return existing;

  const id = makeId('cart');
  await run(db, 'INSERT INTO carts (id, user_id, status) VALUES (?, ?, ?)', [id, userId, 'active']);
  return get(db, 'SELECT * FROM carts WHERE id = ?', [id]);
}

async function getActiveCart(db, userId) {
  const cart = await ensureActiveCart(db, userId);
  const items = await all(
    db,
    'SELECT cart_id, product_id, quantity, created_at, updated_at FROM cart_items WHERE cart_id = ? ORDER BY created_at ASC',
    [cart.id]
  );

  return { ...cart, items };
}

async function addCartItem(db, userId, productId, quantity = 1) {
  const safeProductId = Number(productId);
  const safeQuantity = Math.max(1, Math.min(Number(quantity) || 1, 99));
  if (!safeProductId) {
    throw Object.assign(new Error('productId is required'), { status: 400 });
  }

  const cart = await ensureActiveCart(db, userId);
  await run(
    db,
    `
      INSERT INTO cart_items (cart_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON CONFLICT(cart_id, product_id)
      DO UPDATE SET
        quantity = quantity + excluded.quantity,
        updated_at = CURRENT_TIMESTAMP
    `,
    [cart.id, safeProductId, safeQuantity]
  );
  await run(db, 'UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [cart.id]);

  return getActiveCart(db, userId);
}

async function updateCartItem(db, userId, productId, quantity) {
  const safeProductId = Number(productId);
  const safeQuantity = Number(quantity);
  if (!safeProductId || !Number.isInteger(safeQuantity)) {
    throw Object.assign(new Error('productId and integer quantity are required'), { status: 400 });
  }

  const cart = await ensureActiveCart(db, userId);
  if (safeQuantity <= 0) {
    await removeCartItem(db, userId, safeProductId);
    return getActiveCart(db, userId);
  }

  await run(
    db,
    'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ? AND product_id = ?',
    [Math.min(safeQuantity, 99), cart.id, safeProductId]
  );
  await run(db, 'UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [cart.id]);
  return getActiveCart(db, userId);
}

async function removeCartItem(db, userId, productId) {
  const safeProductId = Number(productId);
  const cart = await ensureActiveCart(db, userId);

  await run(db, 'DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [cart.id, safeProductId]);
  await run(db, 'UPDATE carts SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [cart.id]);

  return getActiveCart(db, userId);
}

async function checkoutCart(db, userId, productDetails) {
  const cart = await getActiveCart(db, userId);
  if (cart.items.length === 0) {
    throw Object.assign(new Error('Cart is empty'), { status: 400 });
  }

  const detailsById = new Map(productDetails.map(product => [Number(product.id), product]));
  const orderId = makeId('ord');
  await run(db, 'INSERT INTO orders (id, user_id) VALUES (?, ?)', [orderId, userId]);

  for (const item of cart.items) {
    const product = detailsById.get(Number(item.product_id));
    if (!product) {
      throw Object.assign(new Error(`Product ${item.product_id} is unavailable`), { status: 404 });
    }

    await run(
      db,
      'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
      [orderId, item.product_id, item.quantity, Number(product.price)]
    );
  }

  await run(db, 'DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
  await run(db, "UPDATE carts SET status = 'checked_out', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [cart.id]);

  await ensureActiveCart(db, userId);
  return { id: orderId, user_id: userId, items: cart.items };
}

module.exports = {
  addCartItem,
  checkoutCart,
  createOrGetUser,
  ensureActiveCart,
  getActiveCart,
  removeCartItem,
  updateCartItem
};
