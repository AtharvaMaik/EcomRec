const { all, run } = require('../db');

async function getPurchaseHistory(db, userId, limit = 30) {
  return all(
    db,
    `
      SELECT
        oi.product_id,
        p.name,
        p.category,
        p.image_url,
        p.tags,
        p.price,
        SUM(oi.quantity) as quantity,
        MAX(o.created_at) as purchased_at
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.user_id = ?
      GROUP BY oi.product_id
      ORDER BY purchased_at DESC, oi.product_id ASC
      LIMIT ?
    `,
    [userId, Math.max(1, Math.min(Number(limit) || 30, 100))]
  );
}

async function getOrders(db, userId) {
  return all(
    db,
    `
      SELECT
        o.id as order_id,
        o.created_at,
        oi.product_id,
        oi.quantity,
        oi.price_at_purchase,
        p.name,
        p.category,
        p.image_url,
        p.tags
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `,
    [userId]
  );
}

async function recordProductView(db, userId, productId) {
  const safeProductId = Number(productId);
  if (!userId || !safeProductId) {
    throw Object.assign(new Error('userId and productId are required'), { status: 400 });
  }

  await run(db, 'INSERT INTO product_views (user_id, product_id) VALUES (?, ?)', [userId, safeProductId]);
}

async function getRecentProductViews(db, userId, limit = 20) {
  return all(
    db,
    `
      SELECT product_id, MAX(viewed_at) as viewed_at, MAX(id) as last_view_id
      FROM product_views
      WHERE user_id = ?
      GROUP BY product_id
      ORDER BY viewed_at DESC, last_view_id DESC
      LIMIT ?
    `,
    [userId, Math.max(1, Math.min(Number(limit) || 20, 50))]
  );
}

module.exports = {
  getOrders,
  getPurchaseHistory,
  getRecentProductViews,
  recordProductView
};
