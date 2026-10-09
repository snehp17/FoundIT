const express = require("express");
const router = express.Router();
const multer = require("multer");
const supabase = require("../config/supabase");
const { authenticate } = require("../middleware/auth");
const { categorizeItem, autoDescribe, generateTextEmbedding, generateImageEmbedding } = require("../services/aiService");
const { matchReportedItem } = require('../services/matchingService');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// POST - Report a lost/found item
router.post("/report", authenticate, upload.array("images", 5), async (req, res) => {
  try {
    const { type, title, description, category, location, date, time, brand, color, secretDetail } = req.body;
    if (!['LOST', 'FOUND'].includes(type) || !title?.trim() || !req.user.university_id) {
      return res.status(400).json({ message: 'A report needs a type, title and university.' });
    }
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

    let finalCategory = category?.trim();
    let expandedDescription = description;
    
    // Keep the category selected by the reporter; use AI only when one was not supplied.
    try {
      if (!finalCategory) finalCategory = await categorizeItem(title, description || '');
      const aiDesc = await autoDescribe(title, description || '');
      if (aiDesc) expandedDescription = aiDesc;
    } catch (aiErr) {
      console.log("AI Text features failed, continuing...", aiErr.message);
    }

    // AI Integration: Generate Embeddings
    let textEmbedding = null;
    let imageEmbedding = null;
    try {
      textEmbedding = await generateTextEmbedding([title, description, brand, color].filter(Boolean).join(' '));
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
        category: finalCategory || 'Other',
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

    let matching;
    try {
      matching = await matchReportedItem(supabase, item, { textEmbedding, imageEmbedding });
      if (matching.errors.length) console.error('Report matching needs attention:', matching.errors);
    } catch (matchError) {
      console.error('Report matching failed:', matchError);
      matching = { status: 'failed', matchesCreated: 0, notificationsCreated: 0 };
    }

    res.status(201).json({
      message: 'Item reported successfully',
      item,
      matching: {
        status: matching.status,
        matchesCreated: matching.matchesCreated,
        notificationsCreated: matching.notificationsCreated
      }
    });
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

// Retry matching a saved report without creating another item or duplicate alerts.
router.post('/:id/rematch', authenticate, async (req, res) => {
  try {
    const { data: item, error } = await supabase.from('items')
      .select('*').eq('id', req.params.id).single();
    if (error || !item) return res.status(404).json({ message: 'Report not found' });
    const isUniversityAdmin = req.user.role === 'university_admin' &&
      req.user.university_id === item.university_id;
    if (item.user_id !== req.user.id && !isUniversityAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (item.status !== 'Active') {
      return res.status(409).json({ message: 'Only active reports can be matched' });
    }

    const { data: embeddings, error: embeddingError } = await supabase.from('item_embeddings')
      .select('text_embedding,image_embedding').eq('item_id', item.id).maybeSingle();
    if (embeddingError) console.warn('Stored embeddings unavailable for retry:', embeddingError.message);
    const matching = await matchReportedItem(supabase, item, {
      textEmbedding: embeddings?.text_embedding,
      imageEmbedding: embeddings?.image_embedding
    });
    if (matching.errors.length) console.error('Report rematch needs attention:', matching.errors);
    res.json({ matching: {
      status: matching.status,
      matchesCreated: matching.matchesCreated,
      notificationsCreated: matching.notificationsCreated
    } });
  } catch (error) {
    console.error('Error retrying report matching:', error);
    res.status(500).json({ message: 'Could not retry report matching' });
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
          id, lost_item_id, found_item_id, overall_score, created_at, status,
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
