const express = require("express");
const router = express.Router();
const multer = require("multer");
const supabase = require("../config/supabase");
const { authenticate } = require("../middleware/auth");

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

    const { data: item, error } = await supabase
      .from('items')
      .insert([{
        type: type || 'LOST',
        title: title || 'Untitled',
        description,
        category,
        location,
        date: date || new Date().toISOString().split('T')[0],
        time: time,
        images: imageFilename ? [imageFilename] : [],
        user_id: req.user.id,
        university_id: req.user.university_id,
        status: 'Active'
      }])
      .select()
      .single();

    if (error) throw error;

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

module.exports = router;