const { all, get } = require('../db');
const { localizeProductImage } = require('./imageCatalog');

function normalizeProduct(product) {
  if (!product) return null;
  return {
    ...product,
    price: Number(product.price),
    image_url: localizeProductImage(product)
  };
}

function parsePagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(Number.parseInt(query.limit, 10) || 20, 60));
  return { page, limit, offset: (page - 1) * limit };
}

function parseSort(sort) {
  const sortMap = {
    price_asc: 'price ASC',
    price_desc: 'price DESC',
    name_asc: 'name ASC',
    category_asc: 'category ASC'
  };

  return sortMap[sort] || 'id ASC';
}

async function listProducts(db, query = {}) {
  const { page, limit, offset } = parsePagination(query);
  const where = [];
  const params = [];

  if (query.category) {
    where.push('category = ?');
    params.push(query.category);
  }

  if (query.search) {
    where.push('(LOWER(name) LIKE ? OR LOWER(tags) LIKE ? OR LOWER(category) LIKE ?)');
    const searchTerm = `%${String(query.search).toLowerCase()}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = parseSort(query.sort);
  const products = await all(
    db,
    `SELECT * FROM products ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const total = await get(db, `SELECT COUNT(*) as count FROM products ${whereSql}`, params);

  return {
    total: total.count,
    page,
    totalPages: Math.ceil(total.count / limit),
    products: products.map(normalizeProduct)
  };
}

async function getProductById(db, productId) {
  const product = await get(db, 'SELECT * FROM products WHERE id = ?', [Number(productId)]);
  return normalizeProduct(product);
}

async function getProductsByIds(db, productIds) {
  const ids = [...new Set(productIds.map(Number).filter(Boolean))];
  if (ids.length === 0) return [];

  const placeholders = ids.map(() => '?').join(',');
  const products = await all(db, `SELECT * FROM products WHERE id IN (${placeholders})`, ids);
  const byId = new Map(products.map(product => [product.id, normalizeProduct(product)]));
  return ids.map(id => byId.get(id)).filter(Boolean);
}

async function listCategories(db) {
  const rows = await all(db, 'SELECT DISTINCT category FROM products ORDER BY category ASC');
  return rows.map(row => row.category);
}

async function enrichCartItems(db, cart) {
  const products = await getProductsByIds(db, cart.items.map(item => item.product_id));
  const byId = new Map(products.map(product => [product.id, product]));

  return {
    ...cart,
    items: cart.items.map(item => ({
      ...item,
      product: byId.get(item.product_id) || null
    }))
  };
}

module.exports = {
  enrichCartItems,
  getProductById,
  getProductsByIds,
  listCategories,
  listProducts,
  normalizeProduct
};
