const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { getActiveCart } = require('../services/cartService');
const { getPurchaseHistory, getRecentProductViews } = require('../services/historyService');

function recommendationsRouter(db, getEngine) {
  const router = express.Router();

  router.post('/', asyncHandler(async (req, res) => {
    const engine = getEngine();
    if (!engine) {
      res.status(503).json({ error: 'Recommendation engine is still warming up' });
      return;
    }

    const userId = req.body.userId;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const [cart, purchases, views] = await Promise.all([
      getActiveCart(db, userId),
      getPurchaseHistory(db, userId, 40),
      getRecentProductViews(db, userId, 20)
    ]);

    const recommendations = engine.recommend({
      cartProductIds: cart.items.flatMap(item => Array(item.quantity).fill(item.product_id)),
      purchaseProductIds: purchases.flatMap(item => Array(item.quantity).fill(item.product_id)),
      recentViewProductIds: views.map(item => item.product_id),
      limit: req.body.limit
    });

    res.json({ recommendations });
  }));

  return router;
}

module.exports = recommendationsRouter;
