const { all, run } = require('../db');

const CATEGORY_IMAGE_PATHS = {
  Automotive: '/products/automotive/automotive.svg',
  'Beauty & Personal Care': '/products/beauty/beauty.svg',
  Books: '/products/books/books.svg',
  Clothing: '/products/clothing/clothing.svg',
  Electronics: '/products/electronics/electronics.svg',
  Groceries: '/products/groceries/groceries.svg',
  Health: '/products/health/health.svg',
  'Home & Kitchen': '/products/home-kitchen/home-kitchen.svg',
  'Sports & Outdoors': '/products/sports/sports.svg',
  'Toys & Games': '/products/toys/toys.svg'
};

const DEFAULT_IMAGE_PATH = '/products/electronics/electronics.svg';

function getLocalImagePath(category) {
  return CATEGORY_IMAGE_PATHS[category] || DEFAULT_IMAGE_PATH;
}

function isRemotePlaceholder(imageUrl) {
  return !imageUrl || /^https?:\/\//i.test(imageUrl);
}

function localizeProductImage(product) {
  if (!product) return DEFAULT_IMAGE_PATH;
  if (!isRemotePlaceholder(product.image_url)) {
    return product.image_url;
  }

  return getLocalImagePath(product.category);
}

async function migrateProductImagesToLocal(db) {
  const products = await all(
    db,
    "SELECT category, COUNT(*) as count FROM products WHERE image_url IS NULL OR image_url LIKE 'http%' GROUP BY category"
  );
  let changed = 0;

  for (const row of products) {
    const nextImageUrl = getLocalImagePath(row.category);
    const result = await run(
      db,
      "UPDATE products SET image_url = ? WHERE category = ? AND (image_url IS NULL OR image_url LIKE 'http%')",
      [nextImageUrl, row.category]
    );
    changed += result.changes || 0;
  }

  return changed;
}

module.exports = {
  CATEGORY_IMAGE_PATHS,
  DEFAULT_IMAGE_PATH,
  getLocalImagePath,
  localizeProductImage,
  migrateProductImagesToLocal
};
