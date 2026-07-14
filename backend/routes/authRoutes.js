const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

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

    // Verify Email Domain
    // Allow if it matches allowed_domain OR if the university allows personal emails
    const emailDomain = "@" + email.split("@")[1];
    if (!university.allow_personal_emails) {
      if (emailDomain.toLowerCase() !== university.allowed_domain.toLowerCase()) {
        return res.status(403).json({ message: `Please use your official university email (${university.allowed_domain})` });
      }
    }

    // Check if email is already in use in public.profiles
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ message: "User already exists with that email" });
    }

    // Create user in Supabase Auth (Using Admin API to bypass email confirmation for now)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { name, role: 'student', university_id: universityId }
    });

    if (authError) {
      console.error("Auth creation error:", authError);
      return res.status(400).json({ message: authError.message });
    }

    const userId = authData.user.id;

    // Create profile in public.profiles
    console.log("Using supabase key:", supabase.supabaseKey.substring(0, 15) + "...");
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        name: name,
        email: email,
        role: 'student',
        university_id: universityId
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Clean up auth user if profile fails
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({ message: "Server error during profile creation" });
    }

    res.json({ message: "User registered successfully", user: { id: userId, name, role: 'student' } });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// COMBINED LOGIN (ADMIN + USER)
router.post("/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Supabase signInWithPassword
    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameOrEmail,
      password: password,
    });

    if (error || !data.user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = data.session.access_token;

    // Fetch user profile from public.profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, universities(name)')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ message: "User profile not found." });
    }

    res.json({
      message: "Login Successful",
      token: token,
      id: data.user.id,
      role: profile.role,
      name: profile.name,
      universityId: profile.university_id,
      university: profile.universities ? (Array.isArray(profile.universities) ? profile.universities[0]?.name : profile.universities.name) : null
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// UNIVERSITY PARTNERSHIP REQUEST
router.post("/university-request", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('university_requests')
      .insert([req.body])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(400).json({ message: "Failed to submit request: " + error.message });
    }

    // Find super_admin
    const { data: admin } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'super_admin')
      .limit(1)
      .single();

    if (admin) {
      // Create notification
      await supabase.from('notifications').insert([{
        user_id: admin.id,
        title: 'New Partnership Request',
        message: `University request from ${req.body.university_name}`,
        type: 'system',
        is_read: false
      }]);
    }

    res.json({ message: "Request submitted successfully", data });
  } catch (error) {
    console.error("Request error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET PUBLIC UNIVERSITIES
router.get("/universities", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('universities')
      .select('id, name, code, allowed_domain, allow_personal_emails')
      .eq('status', 'Active')
      .order('name');

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Universities fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;