const STORAGE_KEY = 'recommendit:demo-state';

const CATEGORY_IMAGES = {
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

const PRODUCT_BLUEPRINTS = [
  ['Electronics', ['Smart Headphones', 'Wireless Charger', 'Compact Keyboard', 'Premium Speaker', 'Travel Power Bank'], ['wireless', 'smart', 'portable', 'audio']],
  ['Groceries', ['Coffee Beans', 'Olive Oil', 'Organic Oats', 'Snack Bar', 'Spice Kit'], ['pantry', 'premium', 'daily', 'fresh']],
  ['Home & Kitchen', ['Coffee Maker', 'Knife Set', 'Modern Lamp', 'Ceramic Pan', 'Soft Towels'], ['home', 'kitchen', 'durable', 'daily']],
  ['Clothing', ['Classic Jacket', 'Modern Sneakers', 'Essential T-Shirt', 'Warm Sweater', 'Travel Scarf'], ['style', 'comfort', 'daily', 'modern']],
  ['Sports & Outdoors', ['Yoga Mat', 'Trail Backpack', 'Steel Bottle', 'Training Rope', 'Camping Light'], ['fitness', 'outdoor', 'training', 'portable']],
  ['Beauty & Personal Care', ['Hydrating Serum', 'Daily Sunscreen', 'Luxury Shampoo', 'Compact Trimmer', 'Lip Balm'], ['care', 'daily', 'premium', 'wellness']],
  ['Books', ['Sci-Fi Novel', 'Cookbook', 'History Guide', 'Productivity Journal', 'Comic Collection'], ['reading', 'learning', 'creative', 'gift']],
  ['Health', ['First Aid Kit', 'Digital Thermometer', 'Daily Vitamins', 'Pill Organizer', 'Hand Sanitizer'], ['wellness', 'daily', 'safety', 'care']],
  ['Automotive', ['Phone Mount', 'Jump Starter', 'Floor Mats', 'Microfiber Cloth', 'Air Freshener'], ['car', 'travel', 'utility', 'daily']],
  ['Toys & Games', ['Board Game', 'Puzzle Set', 'Building Blocks', 'Remote Car', 'Playing Cards'], ['family', 'gift', 'creative', 'play']]
];

const PRODUCTS = PRODUCT_BLUEPRINTS.flatMap(([category, names, tags], categoryIndex) => (
  names.map((name, index) => ({
    id: categoryIndex * 10 + index + 1,
    name,
    category,
    price: Number((18 + categoryIndex * 6 + index * 7.5).toFixed(2)),
    image_url: CATEGORY_IMAGES[category],
    tags: tags.join(',')
  }))
));

function readState() {
  const fallback = { cart: [], purchases: [], views: [] };
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || fallback;
  } catch {
    return fallback;
  }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function enrichCart(cart) {
  return {
    id: 'demo-cart',
    user_id: 'demo-user',
    status: 'active',
    items: cart.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      product: PRODUCTS.find(product => product.id === item.product_id)
    })).filter(item => item.product)
  };
}

function productTokens(product) {
  return `${product.name} ${product.category} ${product.tags}`.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function overlapScore(candidate, signalProducts) {
  if (!signalProducts.length) return 0;
  const candidateTokens = new Set(productTokens(candidate));
  const signalTokens = new Set(signalProducts.flatMap(productTokens));
  let overlap = 0;
  candidateTokens.forEach(token => {
    if (signalTokens.has(token)) overlap += 1;
  });
  return overlap / Math.max(candidateTokens.size, 1);
}

function buildIntelligence(cartItems) {
  const products = cartItems.map(item => PRODUCTS.find(product => product.id === item.product_id)).filter(Boolean);
  const categories = products.reduce((counts, product) => {
    counts[product.category] = (counts[product.category] || 0) + 1;
    return counts;
  }, {});
  const dominantCategories = Object.entries(categories).map(([label, count]) => ({
    label,
    count,
    share: Number((count / Math.max(products.length, 1)).toFixed(2))
  }));
  const topSignals = [...new Set(products.flatMap(product => product.tags.split(',')))].slice(0, 8);
  const uniqueCartItems = new Set(cartItems.map(item => item.product_id)).size;
  const diversityScore = Number((dominantCategories.length / Math.max(uniqueCartItems, 1)).toFixed(2));

  return {
    uniqueCartItems,
    totalCartSignals: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    dominantCategories,
    topSignals,
    diversityScore,
    personality: diversityScore >= 0.75 ? 'Cross-category bundle' : `${dominantCategories[0]?.label || 'Fresh'} power cart`,
    summary: uniqueCartItems > 1
      ? `Demo mode is blending ${uniqueCartItems} cart items into one multi-item ranking profile.`
      : 'Add multiple products to watch the multi-item cart profile sharpen.'
  };
}

function makeRecommendations(limit = 8) {
  const state = readState();
  const cartIds = new Set(state.cart.map(item => item.product_id));
  const cartProducts = state.cart.map(item => PRODUCTS.find(product => product.id === item.product_id)).filter(Boolean);
  const purchaseProducts = state.purchases.map(item => PRODUCTS.find(product => product.id === item.product_id)).filter(Boolean);
  const viewProducts = state.views.map(id => PRODUCTS.find(product => product.id === id)).filter(Boolean);

  const recommendations = PRODUCTS
    .filter(product => !cartIds.has(product.id))
    .map(product => {
      const breakdown = {
        cart: overlapScore(product, cartProducts),
        purchase: overlapScore(product, purchaseProducts),
        view: overlapScore(product, viewProducts)
      };
      const score = breakdown.cart * 0.6 + breakdown.purchase * 0.3 + breakdown.view * 0.1;
      const matchedSignals = product.tags.split(',').filter(tag => (
        cartProducts.concat(purchaseProducts, viewProducts).some(signal => signal.tags.includes(tag))
      ));

      return {
        ...product,
        score: Number(score.toFixed(4)),
        breakdown,
        matchedSignals,
        reason: breakdown.cart > 0
          ? `Matches your multi-item bag in ${product.category}`
          : `Adds ${product.category} variety to your profile`
      };
    })
    .filter(product => product.score > 0 || cartProducts.length === 0)
    .sort((a, b) => b.score - a.score || a.id - b.id)
    .slice(0, limit);

  return {
    recommendations,
    intelligence: buildIntelligence(state.cart),
    bundleBuilder: recommendations.slice(0, 4).map((product, index) => ({
      label: ['Best next cart add', 'Category bridge', 'Repeat preference', 'Exploration pick'][index],
      productId: product.id,
      name: product.name,
      category: product.category,
      score: product.score
    }))
  };
}

export const demoApi = {
  createSession(userId) {
    return Promise.resolve({ user: { id: userId || 'demo-user', name: 'Demo Shopper' } });
  },
  getProducts(params = {}) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    let products = [...PRODUCTS];
    if (params.category) products = products.filter(product => product.category === params.category);
    if (params.search) {
      const term = params.search.toLowerCase();
      products = products.filter(product => `${product.name} ${product.category} ${product.tags}`.toLowerCase().includes(term));
    }
    if (params.sort === 'price_asc') products.sort((a, b) => a.price - b.price);
    if (params.sort === 'price_desc') products.sort((a, b) => b.price - a.price);
    if (params.sort === 'name_asc') products.sort((a, b) => a.name.localeCompare(b.name));
    const start = (page - 1) * limit;
    return Promise.resolve({
      total: products.length,
      page,
      totalPages: Math.ceil(products.length / limit),
      products: products.slice(start, start + limit)
    });
  },
  getCategories() {
    return Promise.resolve({ categories: Object.keys(CATEGORY_IMAGES) });
  },
  recordProductView(userId, productId) {
    const state = readState();
    state.views = [Number(productId), ...state.views.filter(id => id !== Number(productId))].slice(0, 20);
    writeState(state);
    return Promise.resolve({ ok: true });
  },
  getCart() {
    return Promise.resolve({ cart: enrichCart(readState().cart) });
  },
  addCartItem(userId, productId, quantity = 1) {
    const state = readState();
    const existing = state.cart.find(item => item.product_id === Number(productId));
    if (existing) existing.quantity += quantity;
    else state.cart.push({ product_id: Number(productId), quantity });
    writeState(state);
    return Promise.resolve({ cart: enrichCart(state.cart) });
  },
  updateCartItem(userId, productId, quantity) {
    const state = readState();
    state.cart = quantity <= 0
      ? state.cart.filter(item => item.product_id !== Number(productId))
      : state.cart.map(item => item.product_id === Number(productId) ? { ...item, quantity } : item);
    writeState(state);
    return Promise.resolve({ cart: enrichCart(state.cart) });
  },
  removeCartItem(userId, productId) {
    const state = readState();
    state.cart = state.cart.filter(item => item.product_id !== Number(productId));
    writeState(state);
    return Promise.resolve({ cart: enrichCart(state.cart) });
  },
  checkout() {
    const state = readState();
    state.purchases = [...state.cart, ...state.purchases];
    state.cart = [];
    writeState(state);
    return Promise.resolve({ order: { id: `demo-order-${Date.now()}` } });
  },
  getHistory() {
    const state = readState();
    return Promise.resolve({
      purchases: state.purchases.map(item => ({
        ...PRODUCTS.find(product => product.id === item.product_id),
        product_id: item.product_id,
        quantity: item.quantity
      })).filter(Boolean),
      views: state.views.map(product_id => ({ product_id })),
      orders: []
    });
  },
  getRecommendations(userId, limit = 8) {
    return Promise.resolve(makeRecommendations(limit));
  }
};
