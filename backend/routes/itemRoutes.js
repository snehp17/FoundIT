const express = require("express");
const router = express.Router();
const multer = require("multer");
const Item = require("../models/Items");

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
router.post("/report", upload.single("image"), async (req, res) => {
  try {
    const { itemType, itemName, description, location, date } = req.body;
    const imageFilename = req.file ? req.file.filename : null;

    const item = await Item.create({
      itemType,
      itemName,
      description,
      location,
      date: date || new Date(),
      image: imageFilename,
    });

    res.json({ message: "Item reported successfully", item });
  } catch (error) {
    console.error("Error saving item:", error);
    res.status(500).json({ message: "Server error while saving item" });
  }
});

// GET - All items (for Admin Dashboard), newest first
router.get("/", async (req, res) => {
  try {
    const items = await Item.findAll({ order: [["date", "DESC"]] });
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ message: "Server error while fetching items" });
  }
});

module.exports = router;