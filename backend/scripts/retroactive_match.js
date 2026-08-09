const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const supabase = require('../config/supabase');

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

async function runRetroactiveMatches() {
  console.log('🔄 Fetching all active items from the database...');
  const { data: items, error } = await supabase.from('items').select('*').eq('status', 'Active');
  
  if (error) {
    console.error('❌ Error fetching items:', error);
    process.exit(1);
  }
  
  console.log(`✅ Found ${items.length} active items. Processing matches...\n`);
  let matchesCreated = 0;
  
  for (const item of items) {
    const targetType = item.type === 'FOUND' ? 'LOST' : 'FOUND';
    let targetMap = new Map();
    let targetItems = [];
    
    // 1. Try Image Embedding Match
    if (item.image_embedding) {
      const { data: imgMatches } = await supabase.rpc('match_items_image', {
        query_embedding: item.image_embedding,
        match_threshold: 0.7,
        match_count: 5,
        p_type: targetType,
        p_university_id: item.university_id
      });
      if (imgMatches && imgMatches.length > 0) {
        imgMatches.forEach(m => targetMap.set(m.id, { ...m, image_similarity: m.similarity }));
      }
    }
    
    // 2. Try Text Embedding Match
    if (item.embedding) {
      const { data: vectorMatches } = await supabase.rpc('match_items_text', {
        query_embedding: item.embedding,
        match_threshold: 0.7,
        match_count: 5,
        p_type: targetType,
        p_university_id: item.university_id
      });
      if (vectorMatches && vectorMatches.length > 0) {
        vectorMatches.forEach(m => {
          if (targetMap.has(m.id)) {
             targetMap.get(m.id).similarity = m.similarity;
          } else {
             targetMap.set(m.id, { ...m, similarity: m.similarity });
          }
        });
      }
    }
    
    targetItems = Array.from(targetMap.values());
    
    // 3. Fallback to Exact Category Match
    if (!targetItems || targetItems.length === 0) {
      const { data: exactMatches } = await supabase.from('items')
        .select('*')
        .eq('type', targetType)
        .eq('category', item.category)
        .eq('university_id', item.university_id)
        .eq('status', 'Active');
      if (exactMatches && exactMatches.length > 0) targetItems = exactMatches;
    }
    
    if (targetItems && targetItems.length > 0) {
      const matchInserts = [];
      const notifications = [];

      for (const targetItem of targetItems) {
        const lostItem = item.type === 'LOST' ? item : targetItem;
        const foundItem = item.type === 'FOUND' ? item : targetItem;
        
        // Prevent duplicate match pairs
        const { data: existing } = await supabase.from('matches')
          .select('id')
          .eq('lost_item_id', lostItem.id)
          .eq('found_item_id', foundItem.id)
          .single();
          
        if (!existing) {
          const textSim = targetItem.similarity ?? null;
          const imgSim = targetItem.image_similarity ?? null;
          
          const scores = computeMatchScore(lostItem, foundItem, textSim, imgSim);
          
          if (scores.overall_score >= 50) {
            matchInserts.push({
              lost_item_id: lostItem.id,
              found_item_id: foundItem.id,
              owner_id: lostItem.user_id,
              finder_id: foundItem.user_id,
              university_id: item.university_id,
              ...scores
            });

            // Retroactive notifications
            notifications.push({
              user_id: targetItem.user_id,
              type: 'match',
              meta_data: { found_item_id: foundItem.id, lost_item_id: lostItem.id, finder_id: foundItem.user_id },
              title: 'Retroactive Match Found!',
              message: `Your item "${targetItem.title}" might match a newly analyzed item "${item.title}" with ${scores.overall_score}% confidence.`,
            });
          }
        }
      }

      if (matchInserts.length > 0) {
        const { error: matchErr } = await supabase.from('matches').insert(matchInserts);
        if (!matchErr) {
          matchesCreated += matchInserts.length;
          // Optionally send notifications
          await supabase.from('notifications').insert(notifications);
        } else {
           console.error("Error inserting matches:", matchErr);
        }
      }
    }
  }
  
  console.log(`\n🎉 Finished! Successfully generated ${matchesCreated} retroactive matches for older items.`);
  process.exit(0);
}

runRetroactiveMatches();
