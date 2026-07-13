const express = require("express");
const router = express.Router();
const { supabase } = require("../config/db");

// USER REGISTRATION
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, universityId } = req.body;

    if (!universityId) {
      return res.status(400).json({ message: "University ID is required" });
    }

    // Check if university exists
    const { data: university, error: uniError } = await supabase
      .from('universities')
      .select('*')
      .eq('id', universityId)
      .maybeSingle();
      
    if (uniError || !university) {
      return res.status(404).json({ message: "University not found" });
    }

    // Check if email is whitelisted for this university
    const { data: isWhitelisted, error: whiteError } = await supabase
      .from('whitelisted_emails')
      .select('*')
      .eq('email', email)
      .eq('universityId', universityId)
      .maybeSingle();
      
    if (whiteError || !isWhitelisted) {
      return res.status(403).json({ message: "This email is not authorized for this university. Please use your official university email or contact your university admin." });
    }

    // Check if user already exists
    const { data: existingUser, error: existError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
      
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with that email" });
    }

    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert([{ name, email, password, role: 'student', universityId }])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    res.json({ message: "User registered successfully", user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// COMBINED LOGIN (ADMIN + USER)
router.post("/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // 1. Check for Hardcoded Super Admin Login
    if (usernameOrEmail === "FoundIt_Team" && password === "Found@123") {
      return res.json({
        message: "Super Admin Login Successful",
        role: "super_admin",
        name: "FoundIT Developer",
      });
    }

    // 2. Check for Normal User/University Admin Login
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, universities(name)')
      .or(`email.eq.${usernameOrEmail},name.eq.${usernameOrEmail}`)
      .maybeSingle();

    if (userError || !user) {
      return res.status(401).json({ message: "Invalid credentials. User not found." });
    }

    // Direct password comparison
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials. Incorrect password." });
    }

    res.json({
      message: "Login Successful",
      role: user.role,
      name: user.name,
      universityId: user.universityId,
      // Handle array or object based on foreign key relationship
      university: user.universities ? (Array.isArray(user.universities) ? user.universities[0]?.name : user.universities.name) : null
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;