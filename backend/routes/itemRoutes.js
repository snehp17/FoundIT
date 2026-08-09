const express = require("express");
const router = express.Router();
const multer = require("multer");
const supabase = require("../config/supabase");
const { authenticate } = require("../middleware/auth");
const { categorizeItem, autoDescribe, generateTextEmbedding, generateImageEmbedding, computeMatchScore } = require("../services/aiService");
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST - Report a lost/found item
router.post("/report", authenticate, upload.array("images", 5), async (req, res) => {
  try {
    const { type, title, description, category, location, date, time, brand, color, secretDetail } = req.body;
    let imageFilenames = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(uniqueName, file.buffer, {
            contentType: file.mimetype,
          });
        
        if (error) {
          console.error("Error uploading to Supabase Storage:", error);
          continue;
        }
        
        const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(uniqueName);
        if (publicUrlData && publicUrlData.publicUrl) {
          imageFilenames.push(publicUrlData.publicUrl);
        }
      }
    }

    let finalCategory = category;
    let expandedDescription = description;
    
    // AI Integration: Categorize and Expand Description
    try {
      const aiCategory = await categorizeItem(title || 'Untitled', description || '');
      if (aiCategory) finalCategory = aiCategory;
      
      const aiDesc = await autoDescribe(title || 'Untitled', description || '');
      if (aiDesc) expandedDescription = aiDesc;
    } catch (aiErr) {
      console.log("AI Text features failed, continuing...", aiErr.message);
    }

    // AI Integration: Generate Embeddings
    let textEmbedding = null;
    let imageEmbedding = null;
    try {
      textEmbedding = await generateTextEmbedding(expandedDescription || title);
      if (imageFilenames.length > 0) {
         // Generate embedding for the first image only for now
         // Pass the Supabase public URL directly
         imageEmbedding = await generateImageEmbedding(imageFilenames[0]);
      }
    } catch (embErr) {
      console.log("AI Embedding generation failed, continuing...", embErr.message);
    }

    const payload = {
        type: type || 'LOST',
        title: title || 'Untitled',
        description: expandedDescription,
        category: finalCategory,
        location,
        date: date || new Date().toISOString().split('T')[0],
        time: time,
        brand: brand || null,
        primary_color: color || null,
        secret_detail: secretDetail || null,
        images: imageFilenames,
        user_id: req.user.id,
        university_id: req.user.university_id,
        status: 'Active'
    };

    const { data: item, error } = await supabase
      .from('items')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    if (textEmbedding || imageEmbedding) {
      const { error: embError } = await supabase
        .from('item_embeddings')
        .insert([{
          item_id: item.id,
          text_embedding: textEmbedding || null,
          image_embedding: imageEmbedding || null
        }]);
      if (embError) console.error("Error inserting embeddings:", embError);
    }

    // --- Smart Match Logic ---
    if (item.category) {
      const targetType = item.type === 'FOUND' ? 'LOST' : 'FOUND';

      // Vector Search: Use the text embedding to find semantic matches
      let targetMap = new Map();
      let targetItemsError = null;

      if (imageEmbedding) {
        const { data: imgMatches, error: imgErr } = await supabase
          .rpc('match_items_image', {
            query_embedding: imageEmbedding,
            match_threshold: 0.7,
            match_count: 5,
            p_type: targetType,
            p_university_id: item.university_id
          });
        targetItemsError = imgErr;
        if (imgMatches) {
          imgMatches.forEach(m => {
            targetMap.set(m.id, { ...m, image_similarity: m.similarity });
          });
        }
      }
      
      if (textEmbedding) {
        const { data: vectorMatches, error: vectorErr } = await supabase
          .rpc('match_items_text', {
            query_embedding: textEmbedding,
            match_threshold: 0.7, 
            match_count: 5,
            p_type: targetType,
            p_university_id: item.university_id
          });
        
        if (vectorErr && !targetItemsError) targetItemsError = vectorErr;
        if (vectorMatches) {
          vectorMatches.forEach(m => {
            if (targetMap.has(m.id)) {
              targetMap.get(m.id).similarity = m.similarity;
            } else {
              targetMap.set(m.id, { ...m, similarity: m.similarity });
            }
          });
        }
      }
      
      let targetItems = Array.from(targetMap.values());
      
      if (!targetItems || targetItems.length === 0 || targetItemsError) {
        // Fallback to exact category match if pgvector or embeddings failed
        const { data: exactMatches, error: exactErr } = await supabase
          .from('items')
          .select('*')
          .eq('type', targetType)
          .eq('category', item.category)
          .eq('university_id', item.university_id)
          .eq('status', 'Active');
        
        targetItems = exactMatches || [];
        targetItemsError = exactErr;
      }

      if (!targetItemsError && targetItems && targetItems.length > 0) {
        // Save match records to DB + send notifications
        const matchInserts = [];
        const notifications = [];

        for (const targetItem of targetItems) {
          // Compute hybrid score using vector similarity + metadata
          const textSim = targetItem.similarity ?? null; // from pgvector (0-1)
          const imgSim = targetItem.image_similarity ?? null;
          
          const lostItem = item.type === 'LOST' ? item : targetItem;
          const foundItem = item.type === 'FOUND' ? item : targetItem;
          
          const scores = computeMatchScore(lostItem, foundItem, textSim, imgSim);

          // Only store matches above 50% confidence
          if (scores.overall_score >= 50) {
            matchInserts.push({
              lost_item_id: lostItem.id,
              found_item_id: foundItem.id,
              owner_id: lostItem.user_id,
              finder_id: foundItem.user_id,
              university_id: item.university_id,
              ...scores
            });

            notifications.push({
              user_id: targetItem.user_id,
              type: 'match',
              meta_data: { found_item_id: foundItem.id, lost_item_id: lostItem.id, finder_id: foundItem.user_id },
              title: 'Potential Match Found!',
              message: `Your item "${targetItem.title}" might match a newly reported item "${item.title}" with ${scores.overall_score}% confidence. Open Smart Matches to review.`,
            });
          }
        }

        if (matchInserts.length > 0) {
          const { error: matchErr } = await supabase.from('matches').insert(matchInserts);
          if (matchErr) console.error('Error saving matches:', matchErr);
        }

        if (notifications.length > 0) {
          const { error: notifErr } = await supabase.from('notifications').insert(notifications);
          if (notifErr) console.error('Error sending match notifications:', notifErr);
        }
      }
    }

    res.json({ message: "Item reported successfully", item });
  } catch (error) {
    console.error("Error saving item:", error);
    res.status(500).json({ message: "Server error while saving item: " + error.message });
  }
});

// GET - All items (Protected, users can only see their university items, unless super_admin)
router.get("/", authenticate, async (req, res) => {
  try {
    let query = supabase.from('items').select('*, profiles(name, email)');
    
    // Super admin can see all, otherwise filter by university_id
    if (req.user.role !== 'super_admin') {
      query = query.eq('university_id', req.user.university_id);
    }

    // Exclude closed/recovered items from browse listing
    query = query.neq('status', 'Closed');
    
    // Add sorting
    query = query.order('created_at', { ascending: false });

    const { data: items, error } = await query;

    if (error) throw error;

    res.json(items || []);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Server error while fetching items" });
  }
});

// GET - Current user's reports
router.get("/user/my-reports", authenticate, async (req, res) => {
  try {
    let query = supabase.from('items')
      .select('*, profiles(name, email)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    const { data: items, error } = await query;

    if (error) throw error;

    res.json(items || []);
  } catch (error) {
    console.error("Error fetching user items:", error);
    res.status(500).json({ message: "Server error while fetching your items" });
  }
});

// GET - Single item by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    let query = supabase.from('items').select('*, profiles(name, email)').eq('id', id).single();
    
    const { data: item, error } = await query;

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: "Item not found" });
      }
      console.error("Supabase error:", error);
      throw error;
    }
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Super admin can see all, otherwise filter by university_id
    if (req.user.role !== 'super_admin' && item.university_id !== req.user.university_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    let matches = [];
    if (item.user_id === req.user.id) {
      // Fetch matches where this item is either the lost or found item
      const { data: itemMatches } = await supabase.from('matches')
        .select(`
          id, overall_score, created_at, status, 
          lost_item:items!lost_item_id(id, title, location, date, type), 
          found_item:items!found_item_id(id, title, location, date, type)
        `)
        .or(`lost_item_id.eq.${id},found_item_id.eq.${id}`)
        .order('overall_score', { ascending: false });
        
      if (itemMatches) {
        matches = itemMatches;
      }
    }

    res.json({ ...item, matches });
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ message: "Server error while fetching item", error: error.message });
  }
});

module.exports = router;