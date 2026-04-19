const assert = require('node:assert/strict');
const test = require('node:test');

const { getLocalImagePath, localizeProductImage } = require('../src/services/imageCatalog');

test('maps known product categories to bundled local product images', () => {
  assert.equal(getLocalImagePath('Electronics'), '/products/electronics/electronics.svg');
  assert.equal(getLocalImagePath('Home & Kitchen'), '/products/home-kitchen/home-kitchen.svg');
  assert.equal(getLocalImagePath('Beauty & Personal Care'), '/products/beauty/beauty.svg');
});

test('localizeProductImage replaces remote placeholder URLs with bundled images', () => {
  const product = {
    id: 1,
    name: 'Premium Headphones',
    category: 'Electronics',
    image_url: 'https://picsum.photos/seed/1/400/300'
  };

  assert.equal(localizeProductImage(product), '/products/electronics/electronics.svg');
});
