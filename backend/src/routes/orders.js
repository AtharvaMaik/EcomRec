const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkoutCart } = require('../services/cartService');
const { getOrders } = require('../services/historyService');
const { getProductsByIds } = require('../services/productService');

function ordersRouter(db) {
  const router = express.Router();

  router.get('/:userId', asyncHandler(async (req, res) => {
    res.json({ orders: await getOrders(db, req.params.userId) });
  }));

  router.post('/:userId/checkout', asyncHandler(async (req, res) => {
    const productIds = Array.isArray(req.body.productIds) ? req.body.productIds : [];
    const products = await getProductsByIds(db, productIds);
    const order = await checkoutCart(db, req.params.userId, products);
    res.status(201).json({ order });
  }));

  return router;
}

module.exports = ordersRouter;
