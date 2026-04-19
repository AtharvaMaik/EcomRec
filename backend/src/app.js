const express = require('express');
const cors = require('cors');
const { all, initializeCommerceSchema } = require('./db');
const { errorHandler } = require('./middleware/errorHandler');
const cartRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');
const productsRouter = require('./routes/products');
const recommendationsRouter = require('./routes/recommendations');
const usersRouter = require('./routes/users');
const { buildRecommendationEngine } = require('./services/recommendationEngine');
const { migrateProductImagesToLocal } = require('./services/imageCatalog');

async function createApp(db) {
  await initializeCommerceSchema(db);
  await migrateProductImagesToLocal(db);

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  let engine = null;
  const refreshRecommendationEngine = async () => {
    const products = await all(db, 'SELECT * FROM products');
    engine = buildRecommendationEngine(products);
    return engine;
  };

  await refreshRecommendationEngine();

  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      productsIndexed: engine ? engine.productCount : 0
    });
  });

  app.post('/api/recommendations/reindex', async (req, res, next) => {
    try {
      const refreshed = await refreshRecommendationEngine();
      res.json({ ok: true, productsIndexed: refreshed.productCount });
    } catch (err) {
      next(err);
    }
  });

  app.use('/api/products', productsRouter(db));
  app.use('/api/users', usersRouter(db));
  app.use('/api/cart', cartRouter(db));
  app.use('/api/orders', ordersRouter(db));
  app.use('/api/recommendations', recommendationsRouter(db, () => engine));
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp
};
