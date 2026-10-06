const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const { supabaseAuth } = require("../config/supabase"); // anon key — for email auth flows

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

    // First check the user actually exists in our system
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (!profile) {
      // Don't reveal if email exists or not (security best practice)
      return res.json({ message: "If that email is registered, a reset link has been sent." });
    }

    // Use supabaseAuth (anon key) — resetPasswordForEmail does NOT work with the service role key
    const frontendUrl = process.env.FRONTEND_URL || 'https://black-forest-0c46fe800.azurestaticapps.net';
    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${frontendUrl}/`,
    });

    if (error) {
      console.error("Supabase resetPasswordForEmail error:", error);
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: "If that email is registered, a reset link has been sent." });
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
  try {
    const rawReferer = req.headers.referer || req.headers.origin || '';
    let frontendUrl = process.env.FRONTEND_URL || 'https://black-forest-0c46fe800.azurestaticapps.net';
    if (rawReferer) {
      try {
        const parsed = new URL(rawReferer);
        frontendUrl = parsed.origin;
      } catch (e) {}
    }

    const clientToUse = supabaseAuth || supabase;
    const { data, error } = await clientToUse.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${frontendUrl}/google-callback`,
      },
    });

    if (error) {
      console.error("Google OAuth init error:", error);
      return res.status(500).json({ message: error.message });
    }

    if (data && data.url) {
      return res.redirect(data.url);
    } else {
      return res.status(500).json({ message: "Could not initialize Google OAuth" });
    }
  } catch (err) {
    console.error("Google OAuth endpoint exception:", err);
    return res.status(500).json({ message: "Internal server error during Google OAuth initialization" });
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
    const email = userData.user.email;
    const emailDomain = "@" + email.split("@")[1];

    // Check if profile already exists (returning user)
    let { data: profile } = await supabase
      .from('profiles')
      .select('*, universities(name, allowed_domain, allow_personal_emails)')
      .eq('id', userId)
      .maybeSingle();

    if (profile && profile.universities) {
      const uni = Array.isArray(profile.universities) ? profile.universities[0] : profile.universities;
      if (uni && !uni.allow_personal_emails && uni.allowed_domain) {
        if (uni.allowed_domain.toLowerCase() !== emailDomain.toLowerCase()) {
          return res.status(403).json({
            message: `Access denied. Your Google email (${email}) does not match your university's domain (${uni.allowed_domain}). Please use your official university email.`
          });
        }
      }
    }

    if (!profile) {
      // New Google user — validate their email domain against all active universities
      const { data: universities, error: uniError } = await supabase
        .from('universities')
        .select('id, name, allowed_domain, allow_personal_emails')
        .eq('status', 'Active');

      if (uniError) {
        return res.status(500).json({ message: "Could not fetch university list" });
      }

      // Find a university whose allowed_domain matches OR that allows personal emails
      const matchedUni = universities.find(uni => {
        if (uni.allow_personal_emails) return true; // any domain accepted
        return uni.allowed_domain &&
          uni.allowed_domain.toLowerCase() === emailDomain.toLowerCase();
      });

      if (!matchedUni) {
        // Build a helpful list of accepted domains
        const domainList = universities
          .filter(u => !u.allow_personal_emails && u.allowed_domain)
          .map(u => u.allowed_domain)
          .join(', ');
        return res.status(403).json({
          message: `Your Google account email (${email}) is not from a registered university domain. Accepted domains: ${domainList || 'none configured'}. Please use your official university email to sign in with Google.`
        });
      }

      // Create new profile, assigning the matched university
      const name = userData.user.user_metadata?.full_name || email.split('@')[0];

      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: name,
          email: email,
          role: 'student',
          university_id: matchedUni.id
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
      phone: profile.phone,
      department: profile.department,
      roll_number: profile.roll_number,
      batch: profile.batch,
      universityId: profile.university_id,
      university: profile.universities
        ? (Array.isArray(profile.universities) ? profile.universities[0]?.name : profile.universities.name)
        : null
    });

  } catch (error) {
    console.error("Google callback error", error);
    res.status(500).json({ message: "Server error" });
  }
});

const { authenticate } = require('../middleware/auth');

// GET CURRENT USER PROFILE
router.get("/profile", authenticate, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, universities(name)')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error || !profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      phone: profile.phone || '',
      department: profile.department || '',
      roll_number: profile.roll_number || '',
      batch: profile.batch || '',
      universityId: profile.university_id,
      university: profile.universities
        ? (Array.isArray(profile.universities) ? profile.universities[0]?.name : profile.universities.name)
        : null
    });
  } catch (error) {
    console.error("Fetch profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE USER PROFILE DETAILS
router.put("/profile", authenticate, async (req, res) => {
  try {
    const { name, phone, department, roll_number, batch } = req.body;

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(department !== undefined && { department }),
        ...(roll_number !== undefined && { roll_number }),
        ...(batch !== undefined && { batch }),
      })
      .eq('id', req.user.id)
      .select('*, universities(name)')
      .single();

    if (error) {
      return res.status(400).json({ message: "Failed to update profile: " + error.message });
    }

    res.json({ message: "Profile updated successfully", profile: updated });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// CHANGE PASSWORD FROM ACCOUNT SETTINGS
router.post("/change-password", authenticate, async (req, res) => {
  try {
    const { newPassword } = req.body;

    const strongPasswordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!newPassword || !strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({ message: "Password must be at least 8 characters and include a special character." });
    }

    const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
      password: newPassword
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;