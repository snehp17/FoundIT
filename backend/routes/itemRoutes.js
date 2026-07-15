const express = require("express");
const router = express.Router();
const multer = require("multer");
const supabase = require("../config/supabase");
const { authenticate } = require("../middleware/auth");
const { categorizeItem, autoDescribe, generateTextEmbedding, generateImageEmbedding } = require("../services/aiService");
const path = require('path');

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// POST - Report a lost/found item
router.post("/report", authenticate, upload.single("image"), async (req, res) => {
  try {
    const { type, title, description, category, location, date, time } = req.body;
    const imageFilename = req.file ? req.file.filename : null;

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
      if (imageFilename) {
         const imagePath = path.join(__dirname, '..', 'uploads', imageFilename);
         imageEmbedding = await generateImageEmbedding(imagePath);
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
        images: imageFilename ? [imageFilename] : [],
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
    if (item.type === 'FOUND' && item.category) {
      // Vector Search: Use the text embedding to find semantic matches
      let lostItems = [];
      let lostItemsError = null;

      if (imageEmbedding) {
        const { data: imgMatches, error: imgErr } = await supabase
          .rpc('match_items_image', {
            query_embedding: imageEmbedding,
            match_threshold: 0.7,
            match_count: 5,
            p_type: 'LOST',
            p_university_id: item.university_id
          });
        lostItems = imgMatches || [];
        lostItemsError = imgErr;
      }
      
      if ((!lostItems || lostItems.length === 0) && textEmbedding) {
        // Use the pgvector RPC function if embeddings exist
        const { data: vectorMatches, error: vectorErr } = await supabase
          .rpc('match_items_text', {
            query_embedding: textEmbedding,
            match_threshold: 0.7, // 70% similarity threshold
            match_count: 5,
            p_type: 'LOST',
            p_university_id: item.university_id
          });
        
        lostItems = vectorMatches || [];
        lostItemsError = vectorErr;
      } else {
        // Fallback to exact category match if pgvector or embeddings failed
        const { data: exactMatches, error: exactErr } = await supabase
          .from('items')
          .select('id, user_id, title')
          .eq('type', 'LOST')
          .eq('category', item.category)
          .eq('university_id', item.university_id)
          .eq('status', 'Active');
        
        lostItems = exactMatches || [];
        lostItemsError = exactErr;
      }

      if (!lostItemsError && lostItems && lostItems.length > 0) {
        const notifications = lostItems.map(lostItem => ({
          user_id: lostItem.user_id,
          type: 'match',
          meta_data: { found_item_id: item.id, lost_item_id: lostItem.id, finder_id: req.user.id },
          title: 'Potential Match Found!',
          message: `A found item "${item.title}" might match your lost item "${lostItem.title}". Click here to open secure chat with the finder.`,
        }));
        
        await supabase.from('notifications').insert(notifications);
      }
    }

    res.json({ message: "Item reported successfully", item });
  } catch (error) {
    console.error("Error saving item:", error);
    res.status(500).json({ message: "Server error while saving item" });
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

    res.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ message: "Server error while fetching item", error: error.message });
  }
});

module.exports = router;