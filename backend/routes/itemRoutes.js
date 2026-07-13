const express = require("express");
const router = express.Router();
const multer = require("multer");
const { supabase } = require("../config/db");

// Configure Multer for image uploads (keeping local uploads as before)
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
router.post("/report", upload.single("image"), async (req, res) => {
  try {
    const { itemType, itemName, description, location, date } = req.body;
    const imageFilename = req.file ? req.file.filename : null;

    const { data: item, error } = await supabase
      .from('items')
      .insert([{
        itemType,
        itemName,
        description,
        location,
        date: date || new Date().toISOString(),
        image: imageFilename,
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

// GET - All items (for Admin Dashboard), newest first
router.get("/", async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    res.json(items || []);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Server error while fetching items" });
  }
});

module.exports = router;