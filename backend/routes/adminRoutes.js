const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');

// SUPER ADMIN: Create a University
router.post('/universities', async (req, res) => {
  try {
    const { name, location } = req.body;
    
    const { data: university, error } = await supabase
      .from('universities')
      .insert([{ name, location }])
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'University created successfully', university });
  } catch (error) {
    console.error('Error creating university:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// SUPER ADMIN: Create University Admin
router.post('/university-admin', async (req, res) => {
  try {
    const { name, email, password, universityId } = req.body;
    
    // Check if university exists
    const { data: university, error: uniError } = await supabase
      .from('universities')
      .select('*')
      .eq('id', universityId)
      .maybeSingle();

    if (uniError || !university) {
      return res.status(404).json({ message: 'University not found' });
    }

    // Check if user already exists
    const { data: existingUser, error: existError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const { data: admin, error: insertError } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        password, // In production, we should hash this
        role: 'university_admin',
        universityId
      }])
      .select()
      .single();

    if (insertError) throw insertError;

    res.json({ message: 'University Admin created successfully', admin });
  } catch (error) {
    console.error('Error creating university admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// UNIVERSITY ADMIN: Add student email to whitelist
router.post('/students/whitelist', async (req, res) => {
  try {
    const { email, universityId } = req.body;
    // We should ideally check if the requesting user is a university_admin and their universityId matches.
    // For this prototype, we'll assume the client sends the correct universityId.
    
    const { data: existing, error: existError } = await supabase
      .from('whitelisted_emails')
      .select('*')
      .eq('email', email)
      .eq('universityId', universityId)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ message: 'Email is already whitelisted' });
    }

    const { data: whitelisted, error: insertError } = await supabase
      .from('whitelisted_emails')
      .insert([{ email, universityId }])
      .select()
      .single();

    if (insertError) throw insertError;

    res.json({ message: 'Email whitelisted successfully', whitelisted });
  } catch (error) {
    console.error('Error whitelisting email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// UNIVERSITY ADMIN: Remove student email from whitelist
router.delete('/students/whitelist/:email', async (req, res) => {
  try {
    const { email } = req.params;
    // Assuming universityId is sent in body or query for prototype simplicity
    const universityId = req.body.universityId || req.query.universityId;

    const { data, error } = await supabase
      .from('whitelisted_emails')
      .delete()
      .eq('email', email)
      .eq('universityId', universityId)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Email not found in whitelist' });
    }

    res.json({ message: 'Email removed from whitelist successfully' });
  } catch (error) {
    console.error('Error removing email from whitelist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// UNIVERSITY ADMIN: View all whitelisted and registered students
router.get('/students', async (req, res) => {
  try {
    const universityId = req.query.universityId;
    if (!universityId) {
      return res.status(400).json({ message: 'universityId is required' });
    }

    const { data: whitelisted, error: whiteError } = await supabase
      .from('whitelisted_emails')
      .select('email')
      .eq('universityId', universityId);

    if (whiteError) throw whiteError;

    const { data: registered, error: regError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('universityId', universityId)
      .eq('role', 'student');

    if (regError) throw regError;

    res.json({
      whitelisted: (whitelisted || []).map(w => w.email),
      registered: registered || []
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
