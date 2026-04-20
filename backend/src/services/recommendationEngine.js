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

function topWeightedTerms(vector, limit = 6) {
  return Object.entries(vector.weights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term]) => term);
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    if (!key) return counts;
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function rankedEntries(counts, total, limit = 5) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({
      label,
      count,
      share: Number((count / Math.max(total, 1)).toFixed(2))
    }));
}

function buildCartIntelligence(cartIds, productsById, cartProfile) {
  const cartProducts = cartIds.map(id => productsById.get(id)).filter(Boolean);
  const uniqueCartItems = new Set(cartIds).size;
  const categoryCounts = countBy(cartProducts, product => product.category);
  const categoryTotal = cartProducts.length || 0;
  const dominantCategories = rankedEntries(categoryCounts, categoryTotal, 4);
  const topSignals = topWeightedTerms(cartProfile, 8);
  const diversityScore = Number((Object.keys(categoryCounts).length / Math.max(uniqueCartItems, 1)).toFixed(2));
  const personality = diversityScore >= 0.75
    ? 'Cross-category bundle'
    : dominantCategories[0]
      ? `${dominantCategories[0].label} power cart`
      : 'Fresh shopper profile';

  return {
    uniqueCartItems,
    totalCartSignals: cartIds.length,
    dominantCategories,
    topSignals,
    diversityScore,
    personality,
    summary: uniqueCartItems > 1
      ? `Multi-item cart vector built from ${uniqueCartItems} distinct products and ${topSignals.length} weighted signals.`
      : 'Add multiple items to unlock the full multi-item cart vector.'
  };
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

function buildBundleBuilder(recommendations) {
  const labels = ['Best next cart add', 'Category bridge', 'Repeat preference', 'Exploration pick'];
  return recommendations.slice(0, 4).map((product, index) => ({
    label: labels[index] || 'High-confidence pick',
    productId: product.id,
    name: product.name,
    category: product.category,
    score: product.score
  }));
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
  const productsById = new Map(normalizedProducts.map(product => [product.id, product]));

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

  function buildRecommendations({ cartProductIds = [], purchaseProductIds = [], recentViewProductIds = [], limit = 8 } = {}) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 8, 24));
    const cartIds = cartProductIds.map(Number).filter(Boolean);
    const purchaseIds = purchaseProductIds.map(Number).filter(Boolean);
    const viewIds = recentViewProductIds.map(Number).filter(Boolean);

    const cartProfile = buildProfileVector(cartIds, vectorsById, 0.6);
    const purchaseProfile = buildProfileVector(purchaseIds, vectorsById, 0.3);
    const viewProfile = buildProfileVector(viewIds, vectorsById, 0.1);
    const intentProfile = mergeProfiles([cartProfile, purchaseProfile, viewProfile]);
    const excludedIds = new Set([...cartIds, ...purchaseIds, ...viewIds]);

    const intelligence = buildCartIntelligence(cartIds, productsById, cartProfile);

    if (intentProfile.magnitude === 0) {
      return { recommendations: [], intelligence, bundleBuilder: [] };
    }

    const recommendations = normalizedProducts
      .filter(product => !excludedIds.has(product.id))
      .map(product => {
        const vector = vectorsById.get(product.id);
        const rawParts = {
          cart: cosineSimilarity(cartProfile, vector),
          purchase: cosineSimilarity(purchaseProfile, vector),
          view: cosineSimilarity(viewProfile, vector)
        };
        const weightedParts = {
          cart: rawParts.cart * 0.6,
          purchase: rawParts.purchase * 0.3,
          view: rawParts.view * 0.1
        };
        const score = cosineSimilarity(intentProfile, vector);
        const matchedSignals = topWeightedTerms({
          weights: Object.fromEntries(
            Object.keys(vector.weights)
              .filter(term => intentProfile.weights[term])
              .map(term => [term, intentProfile.weights[term]])
          )
        }, 5);

        return {
          ...product,
          score: Number(score.toFixed(4)),
          reason: reasonForProduct(product, weightedParts),
          breakdown: {
            cart: Number(rawParts.cart.toFixed(4)),
            purchase: Number(rawParts.purchase.toFixed(4)),
            view: Number(rawParts.view.toFixed(4))
          },
          matchedSignals
        };
      })
      .filter(product => product.score > 0)
      .sort((a, b) => b.score - a.score || a.id - b.id)
      .slice(0, safeLimit);

    return {
      recommendations,
      intelligence,
      bundleBuilder: buildBundleBuilder(recommendations)
    };
  }

  function recommend(options = {}) {
    return buildRecommendations(options).recommendations;
  }

  function recommendDetailed(options = {}) {
    return buildRecommendations(options);
  }

  return {
    productCount: normalizedProducts.length,
    recommend,
    recommendDetailed
  };
}

module.exports = {
  buildRecommendationEngine,
  cosineSimilarity,
  getTokens
};
