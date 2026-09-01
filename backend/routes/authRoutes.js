const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");

// USER REGISTRATION
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, universityId } = req.body;

    const strongPasswordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ message: "Weak password" });
    }

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
      .upsert({
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
      return res.status(500).json({ message: "Server error during profile creation: " + profileError.message });
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
      refresh_token: data.session.refresh_token,
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

// TOKEN REFRESH
router.post("/refresh", async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ message: "refresh_token is required" });
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error || !data.session) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    res.json({
      token: data.session.access_token,
      refresh_token: data.session.refresh_token
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ message: "Server error during token refresh" });
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

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://black-forest-0c46fe800.azurestaticapps.net/reset-password",
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { token, type, password } = req.body;
    
    const strongPasswordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ message: "Weak password" });
    }

    let userId;
    
    if (type === 'code') {
      const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(token);
      if (sessionError || !sessionData?.session?.user) {
         return res.status(401).json({ message: "Invalid or expired reset code" });
      }
      userId = sessionData.session.user.id;
    } else {
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
      userId = userData.user.id;
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: password
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GOOGLE OAUTH INIT
router.get("/google", async (req, res) => {
  const frontendUrl = req.headers.origin || req.headers.referer?.slice(0, -1) || 'http://localhost:5173';
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${frontendUrl}/google-callback`, 
    },
  });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  if (data.url) {
    res.redirect(data.url);
  } else {
    res.status(500).json({ message: "Could not initialize Google OAuth" });
  }
});

// GOOGLE OAUTH CALLBACK
router.post("/google-callback", async (req, res) => {
  try {
    const { access_token } = req.body;
    const { data: userData, error: userError } = await supabase.auth.getUser(access_token);
    
    if (userError || !userData.user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const userId = userData.user.id;
    
    // Check if profile exists
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, universities(name)')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      // Create new profile for google user
      const name = userData.user.user_metadata?.full_name || userData.user.email.split('@')[0];
      const email = userData.user.email;
      
      const { data: uniList } = await supabase.from('universities').select('id, name').limit(1);
      const defaultUniId = uniList && uniList.length > 0 ? uniList[0].id : null;
      
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: name,
          email: email,
          role: 'student',
          university_id: defaultUniId
        })
        .select('*, universities(name)')
        .single();
        
      if (insertError) {
         return res.status(500).json({ message: "Error creating profile: " + insertError.message });
      }
      profile = newProfile;
    }

    res.json({
      message: "Login Successful",
      token: access_token,
      id: userId,
      role: profile.role,
      name: profile.name,
      universityId: profile.university_id,
      university: profile.universities ? (Array.isArray(profile.universities) ? profile.universities[0]?.name : profile.universities.name) : null
    });

  } catch (error) {
     console.error("Google callback error", error);
     res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;