const express = require('express');
const crypto = require('crypto');
const { asyncHandler } = require('../middleware/errorHandler');
const { createOrGetUser } = require('../services/cartService');
const { getOrders, getPurchaseHistory, getRecentProductViews } = require('../services/historyService');

function usersRouter(db) {
  const router = express.Router();

  router.post('/session', asyncHandler(async (req, res) => {
    const userId = req.body.userId || `anon_${crypto.randomUUID()}`;
    const user = await createOrGetUser(db, userId);
    res.status(201).json({ user });
  }));

  router.get('/:userId/history', asyncHandler(async (req, res) => {
    const [purchases, views, orders] = await Promise.all([
      getPurchaseHistory(db, req.params.userId),
      getRecentProductViews(db, req.params.userId),
      getOrders(db, req.params.userId)
    ]);

    res.json({ purchases, views, orders });
  }));

  return router;
}

module.exports = usersRouter;
