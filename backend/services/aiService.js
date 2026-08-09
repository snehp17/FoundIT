const https = require('https');

async function callGeminiAPI(model, payload) {
  return new Promise((resolve, reject) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return reject(new Error('GEMINI_API_KEY is not defined in environment variables'));
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const postData = JSON.stringify(payload);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error('Failed to parse Gemini response JSON'));
          }
        } else {
          reject(new Error(`Gemini API error (Status ${res.statusCode}): ${body}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

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
    const promptText = `Categorize the following lost/found item into a single broad category (e.g., Electronics, Keys, Wallet, ID/Documents, Clothing, Bag, Other) and a sub-category if applicable. Return the response in the format "Category - Subcategory".
Item Title: ${title}
Item Description: ${description}`;

    const payload = {
      contents: [{
        parts: [{ text: promptText }]
      }],
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.2
      }
    };

    const res = await callGeminiAPI('gemini-1.5-flash-latest', payload);
    const text = res.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Invalid response structure from Gemini API');
    return text.trim();
  } catch (error) {
    console.error('Error categorizing item with Gemini:', error.message);
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
    const promptText = `Based on the user's input, generate a concise, standardized AI description of the item. Focus on the core identifying features (color, brand, type, notable marks). Output ONLY the description.
User Input:
Title: ${title}
Description: ${description}
${attrsString}`;

    const payload = {
      contents: [{
        parts: [{ text: promptText }]
      }],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.2
      }
    };

    const res = await callGeminiAPI('gemini-1.5-flash-latest', payload);
    const text = res.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Invalid response structure from Gemini API');
    return text.trim();
  } catch (error) {
    console.error('Error generating AI description with Gemini:', error.message);
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
    
    let data = output.data;
    // Mean pooling if output is 3D [batch_size, sequence_length, hidden_size] e.g., [1, 196, 768]
    if (output.dims && output.dims.length === 3) {
      const seqLen = output.dims[1];
      const dim = output.dims[2];
      const pooled = new Float32Array(dim);
      for (let i = 0; i < seqLen; i++) {
        for (let j = 0; j < dim; j++) {
          pooled[j] += data[i * dim + j];
        }
      }
      for (let j = 0; j < dim; j++) {
        pooled[j] /= seqLen;
      }
      data = pooled;
    }

    return Array.from(data);
  } catch (error) {
    console.error('Error generating image embedding:', error);
    return null;
  }
}

// 5. Support Chat
async function supportChat(messages) {
  try {
    const systemPrompt = `You are the FoundIT AI Support Assistant. FoundIT is an AI-powered lost and found platform for university campuses. 
Your goal is to help students navigate the platform, understand how to report items, explain the AI matching process, and give general advice on recovering lost items.
Keep responses concise, friendly, and helpful. If a student needs to escalate a complex issue, advise them they can click "Talk to University Admin".`;

    // Map OpenAI roles to Gemini roles ('user' and 'model')
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const payload = {
      contents: contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7
      }
    };

    const res = await callGeminiAPI('gemini-1.5-flash-latest', payload);
    const text = res.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Invalid response structure from Gemini API');
    return text.trim();
  } catch (error) {
    console.error('Error in support chat with Gemini:', error.message);
    
    // Offline / Quota exceeded fallback responses
    if (messages && messages.length > 0) {
      const userMessage = messages[messages.length - 1].content.toLowerCase();
      
      if (userMessage.includes('fraud') || userMessage.includes('fake') || userMessage.includes('issue') || userMessage.includes('scam')) {
         return "If you are facing a personal issue like fraud or need urgent assistance, please click 'Talk to University Admin' below to connect directly with your university administration.";
      }
      if (userMessage.includes('report') || userMessage.includes('lost') || userMessage.includes('found')) {
         return "To report an item, click on 'Report Item' in the navigation bar. You can choose whether you lost or found the item, provide details, and upload an image for AI matching.";
      }
      if (userMessage.includes('hello') || userMessage.includes('hi')) {
         return "Hello! I am the FoundIT AI Support Assistant. How can I help you today?";
      }
    }
    
    return "I am currently running in offline fallback mode because my AI brain is encountering an issue. For basic questions, I can help you report items. For personal issues or fraud, please escalate to your university admin by clicking the button below.";
  }
}

// 6. Hybrid match score computation
function computeMatchScore(lostItem, foundItem, textSimilarity = null, imageSimilarity = null) {
  // Category match (0 or 100)
  const categoryMatch = !!(lostItem.category && foundItem.category &&
    lostItem.category.toLowerCase().split(' - ')[0] === foundItem.category.toLowerCase().split(' - ')[0]);
  const categoryScore = categoryMatch ? 100 : 30;

  // Location similarity (keyword overlap)
  const lostWords = (lostItem.location || '').toLowerCase().split(/[\s,]+/).filter(w => w.length > 2);
  const foundWords = (foundItem.location || '').toLowerCase().split(/[\s,]+/).filter(w => w.length > 2);
  const intersection = lostWords.filter(w => foundWords.includes(w));
  const union = [...new Set([...lostWords, ...foundWords])];
  const locationScore = union.length > 0 ? (intersection.length / union.length) * 100 : 50;

  // Date similarity (closer = higher score, -15 per day)
  const lostDate = lostItem.date ? new Date(lostItem.date) : new Date(lostItem.created_at);
  const foundDate = foundItem.date ? new Date(foundItem.date) : new Date(foundItem.created_at);
  const daysDiff = Math.abs((lostDate - foundDate) / (1000 * 60 * 60 * 24));
  const dateScore = Math.max(0, 100 - daysDiff * 15);

  // Text similarity (from vector search 0-1 → 0-100, default 60)
  const textScore = textSimilarity !== null ? Math.min(100, textSimilarity * 100) : 60;

  // Image similarity (from vector search 0-1 → 0-100)
  const imageScore = imageSimilarity !== null ? Math.min(100, imageSimilarity * 100) : null;

  // Weighted overall score
  let overall;
  if (imageScore !== null) {
    overall = textScore * 0.35 + imageScore * 0.20 + categoryScore * 0.20 + locationScore * 0.15 + dateScore * 0.10;
  } else {
    overall = textScore * 0.45 + categoryScore * 0.25 + locationScore * 0.20 + dateScore * 0.10;
  }

  return {
    overall_score: Math.min(100, Math.round(overall * 10) / 10),
    text_score: Math.round(textScore * 10) / 10,
    image_score: imageScore !== null ? Math.round(imageScore * 10) / 10 : null,
    category_match: categoryMatch,
    location_score: Math.round(locationScore * 10) / 10,
    date_score: Math.round(dateScore * 10) / 10
  };
}

module.exports = {
  categorizeItem,
  autoDescribe: generateAutoDescription,
  generateTextEmbedding,
  generateImageEmbedding,
  supportChat,
  computeMatchScore
};
