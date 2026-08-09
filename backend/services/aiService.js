const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Dynamic import for ES module @xenova/transformers
let pipeline;
let env;

async function loadTransformers() {
  if (!pipeline) {
    const transformers = await import('@xenova/transformers');
    pipeline = transformers.pipeline;
    env = transformers.env;
  }
  return { pipeline, env };
}

// 1. AI Categorization
async function categorizeItem(title, description) {
  try {
    const prompt = `Categorize the following lost/found item into a single broad category (e.g., Electronics, Keys, Wallet, ID/Documents, Clothing, Bag, Other) and a sub-category if applicable. Return the response in the format "Category - Subcategory".
Item Title: ${title}
Item Description: ${description}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 20
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error categorizing item:', error);
    return 'Other';
  }
}

// 2. AI Auto Description
async function generateAutoDescription(title, description, attributes) {
  try {
    let attrsString = '';
    if (attributes && Object.keys(attributes).length > 0) {
      attrsString = 'Attributes: ' + JSON.stringify(attributes);
    }
    const prompt = `Based on the user's input, generate a concise, standardized AI description of the item. Focus on the core identifying features (color, brand, type, notable marks). Output ONLY the description.
User Input:
Title: ${title}
Description: ${description}
${attrsString}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating AI description:', error);
    return description;
  }
}

// 3. Generate Text Embedding using all-MiniLM-L6-v2 (384 dimensions)
async function generateTextEmbedding(text) {
  try {
    await loadTransformers();
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    // Convert Tensor to standard JS array
    return Array.from(output.data);
  } catch (error) {
    console.error('Error generating text embedding:', error);
    return null;
  }
}

// 4. Generate Image Embedding using SigLIP (768 dimensions)
async function generateImageEmbedding(imageUrl) {
  try {
    await loadTransformers();
    // Use Xenova/siglip-base-patch16-224 which is standard for image embeddings
    const extractor = await pipeline('image-feature-extraction', 'Xenova/siglip-base-patch16-224');
    const output = await extractor(imageUrl);
    return Array.from(output.data);
  } catch (error) {
    console.error('Error generating image embedding:', error);
    return null;
  }
}

module.exports = {
  categorizeItem,
  autoDescribe: generateAutoDescription,
  generateTextEmbedding,
  generateImageEmbedding
};
