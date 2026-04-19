function normalizeProduct(product) {
  return {
    ...product,
    price: Number(product.price)
  };
}

function getTokens(product) {
  const fields = [product.category, product.name, product.tags]
    .filter(Boolean)
    .join(' ');

  return fields
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map(token => token.trim())
    .filter(token => token.length > 1);
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.magnitude === 0 || vecB.magnitude === 0) return 0;

  let dotProduct = 0;
  for (const term in vecA.weights) {
    if (vecB.weights[term]) {
      dotProduct += vecA.weights[term] * vecB.weights[term];
    }
  }

  return dotProduct / (vecA.magnitude * vecB.magnitude);
}

function buildMagnitude(weights) {
  return Math.sqrt(Object.values(weights).reduce((sum, value) => sum + value * value, 0));
}

function buildProfileVector(productIds, vectorsById, weight) {
  const ids = productIds.filter(id => vectorsById.has(id));
  const weights = {};

  if (ids.length === 0 || weight <= 0) {
    return { weights, magnitude: 0 };
  }

  ids.forEach(id => {
    const vector = vectorsById.get(id);
    for (const term in vector.weights) {
      weights[term] = (weights[term] || 0) + (vector.weights[term] * weight) / ids.length;
    }
  });

  return { weights, magnitude: buildMagnitude(weights) };
}

function mergeProfiles(profiles) {
  const weights = {};
  profiles.forEach(profile => {
    for (const term in profile.weights) {
      weights[term] = (weights[term] || 0) + profile.weights[term];
    }
  });

  return { weights, magnitude: buildMagnitude(weights) };
}

function reasonForProduct(product, scoreParts) {
  const sources = [];
  if (scoreParts.cart > 0) sources.push('cart');
  if (scoreParts.purchase > 0) sources.push('purchase history');
  if (scoreParts.view > 0) sources.push('recent views');

  if (sources.length === 0) {
    return `Popular ${product.category} item`;
  }

  return `Matches your ${sources.join(', ')} in ${product.category}`;
}

function buildRecommendationEngine(products) {
  const normalizedProducts = products.map(normalizeProduct);
  const docFrequency = {};

  normalizedProducts.forEach(product => {
    const uniqueTokens = new Set(getTokens(product));
    uniqueTokens.forEach(token => {
      docFrequency[token] = (docFrequency[token] || 0) + 1;
    });
  });

  const productCount = normalizedProducts.length || 1;
  const vectorsById = new Map();

  normalizedProducts.forEach(product => {
    const tokens = getTokens(product);
    const termFrequency = {};

    tokens.forEach(token => {
      termFrequency[token] = (termFrequency[token] || 0) + 1;
    });

    const weights = {};
    Object.entries(termFrequency).forEach(([term, count]) => {
      const tf = count / tokens.length;
      const idf = Math.log((productCount + 1) / ((docFrequency[term] || 0) + 1)) + 1;
      weights[term] = tf * idf;
    });

    vectorsById.set(product.id, {
      id: product.id,
      weights,
      magnitude: buildMagnitude(weights)
    });
  });

  function recommend({ cartProductIds = [], purchaseProductIds = [], recentViewProductIds = [], limit = 8 } = {}) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 8, 24));
    const cartIds = cartProductIds.map(Number).filter(Boolean);
    const purchaseIds = purchaseProductIds.map(Number).filter(Boolean);
    const viewIds = recentViewProductIds.map(Number).filter(Boolean);

    const cartProfile = buildProfileVector(cartIds, vectorsById, 0.6);
    const purchaseProfile = buildProfileVector(purchaseIds, vectorsById, 0.3);
    const viewProfile = buildProfileVector(viewIds, vectorsById, 0.1);
    const intentProfile = mergeProfiles([cartProfile, purchaseProfile, viewProfile]);
    const excludedIds = new Set([...cartIds, ...purchaseIds, ...viewIds]);

    if (intentProfile.magnitude === 0) {
      return [];
    }

    return normalizedProducts
      .filter(product => !excludedIds.has(product.id))
      .map(product => {
        const vector = vectorsById.get(product.id);
        const scoreParts = {
          cart: cosineSimilarity(cartProfile, vector) * 0.6,
          purchase: cosineSimilarity(purchaseProfile, vector) * 0.3,
          view: cosineSimilarity(viewProfile, vector) * 0.1
        };
        const score = cosineSimilarity(intentProfile, vector);
        return {
          ...product,
          score: Number(score.toFixed(4)),
          reason: reasonForProduct(product, scoreParts)
        };
      })
      .filter(product => product.score > 0)
      .sort((a, b) => b.score - a.score || a.id - b.id)
      .slice(0, safeLimit);
  }

  return {
    productCount: normalizedProducts.length,
    recommend
  };
}

module.exports = {
  buildRecommendationEngine,
  cosineSimilarity,
  getTokens
};
