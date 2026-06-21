const express = require('express');
const router = express.Router();
const { User, University, WhitelistedEmail } = require('../models');

// SUPER ADMIN: Create a University
router.post('/universities', async (req, res) => {
  try {
    const { name, location } = req.body;
    const university = await University.create({ name, location });
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
    const university = await University.findByPk(universityId);
    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const admin = await User.create({
      name,
      email,
      password, // In production, we should hash this
      role: 'university_admin',
      universityId
    });

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
    
    const existing = await WhitelistedEmail.findOne({ where: { email, universityId } });
    if (existing) {
      return res.status(400).json({ message: 'Email is already whitelisted' });
    }

    const whitelisted = await WhitelistedEmail.create({ email, universityId });
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

    const result = await WhitelistedEmail.destroy({ where: { email, universityId } });
    if (result === 0) {
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

    const whitelisted = await WhitelistedEmail.findAll({ where: { universityId } });
    const registered = await User.findAll({ where: { universityId, role: 'student' } });

    res.json({
      whitelisted: whitelisted.map(w => w.email),
      registered: registered.map(r => ({ id: r.id, name: r.name, email: r.email }))
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
