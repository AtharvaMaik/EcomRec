const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  addCartItem,
  getActiveCart,
  removeCartItem,
  updateCartItem
} = require('../services/cartService');
const { enrichCartItems } = require('../services/productService');

function cartRouter(db) {
  const router = express.Router();

  router.get('/:userId', asyncHandler(async (req, res) => {
    const cart = await getActiveCart(db, req.params.userId);
    res.json({ cart: await enrichCartItems(db, cart) });
  }));

  router.post('/:userId/items', asyncHandler(async (req, res) => {
    const cart = await addCartItem(db, req.params.userId, req.body.productId, req.body.quantity);
    res.status(201).json({ cart: await enrichCartItems(db, cart) });
  }));

  router.patch('/:userId/items/:productId', asyncHandler(async (req, res) => {
    const cart = await updateCartItem(db, req.params.userId, req.params.productId, req.body.quantity);
    res.json({ cart: await enrichCartItems(db, cart) });
  }));

  router.delete('/:userId/items/:productId', asyncHandler(async (req, res) => {
    const cart = await removeCartItem(db, req.params.userId, req.params.productId);
    res.json({ cart: await enrichCartItems(db, cart) });
  }));

  return router;
}

module.exports = cartRouter;
