const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { getProductById, listCategories, listProducts } = require('../services/productService');
const { recordProductView } = require('../services/historyService');

function productsRouter(db) {
  const router = express.Router();

  router.get('/', asyncHandler(async (req, res) => {
    res.json(await listProducts(db, req.query));
  }));

  router.get('/categories', asyncHandler(async (req, res) => {
    res.json({ categories: await listCategories(db) });
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    const product = await getProductById(db, req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ product });
  }));

  router.post('/:id/views', asyncHandler(async (req, res) => {
    await recordProductView(db, req.body.userId, req.params.id);
    res.status(201).json({ ok: true });
  }));

  return router;
}

module.exports = productsRouter;
