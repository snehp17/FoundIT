/**
 * AI Service for Item Categorization, Auto-Description, and Embeddings.
 * Safely handles AI enhancements with fallback logic.
 */

async function categorizeItem(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('phone') || text.includes('laptop') || text.includes('charger') || text.includes('airpods') || text.includes('earbuds') || text.includes('mobile')) {
    return 'Electronics';
  }
  if (text.includes('id') || text.includes('card') || text.includes('license') || text.includes('passport') || text.includes('wallet')) {
    return 'Documents & IDs';
  }
  if (text.includes('bag') || text.includes('backpack') || text.includes('purse') || text.includes('bottle')) {
    return 'Accessories';
  }
  if (text.includes('key') || text.includes('keys')) {
    return 'Keys';
  }
  if (text.includes('jacket') || text.includes('coat') || text.includes('hoodie') || text.includes('shirt') || text.includes('hat')) {
    return 'Clothing';
  }
  return 'Other';
}

async function autoDescribe(title = '', description = '') {
  return description || `Item reported: ${title}`;
}

async function generateTextEmbedding(text) {
  return null;
}

async function generateImageEmbedding(imagePath) {
  return null;
}

module.exports = {
  categorizeItem,
  autoDescribe,
  generateTextEmbedding,
  generateImageEmbedding
};
