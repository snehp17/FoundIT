const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const aiService = require('../services/aiService');
const supabase = require('../config/supabase');

// POST /api/support/ai - Chat with AI Support Bot
router.post('/ai', authenticate, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    const reply = await aiService.supportChat(messages);
    res.json({ reply });
  } catch (error) {
    console.error('Error in AI support route:', error);
    res.status(500).json({ message: 'Failed to process AI chat' });
  }
});

// GET /api/support/escalate - Find University Admin to escalate to
router.get('/escalate', authenticate, async (req, res) => {
  try {
    const userUniId = req.user.university_id;

    if (!userUniId) {
      return res.status(400).json({ message: 'User has no university assigned' });
    }

    // Find the first university_admin for this university
    const { data: admin, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('university_id', userUniId)
      .eq('role', 'university_admin')
      .limit(1)
      .maybeSingle();

    if (error || !admin) {
      console.log('No university admin found for uni:', userUniId);
      // Fallback: Find a super_admin if no uni admin exists
      const { data: superAdmin, error: superError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'super_admin')
        .limit(1)
        .maybeSingle();
        
      if (superAdmin && !superError) {
         return res.json({ adminId: superAdmin.id, adminName: superAdmin.name });
      }
      return res.status(404).json({ message: 'No admin available for escalation' });
    }

    res.json({ adminId: admin.id, adminName: admin.name });
  } catch (error) {
    console.error('Error in support escalation route:', error);
    res.status(500).json({ message: 'Failed to escalate support request' });
  }
});

// GET /api/support/superadmin - Find Super Admin to chat with (for Uni Admins)
router.get('/superadmin', authenticate, async (req, res) => {
  try {
    const { data: superAdmin, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'super_admin')
      .limit(1)
      .maybeSingle();
      
    if (error || !superAdmin) {
      return res.status(404).json({ message: 'No super admin available' });
    }

    res.json({ adminId: superAdmin.id, adminName: superAdmin.name });
  } catch (error) {
    console.error('Error finding super admin:', error);
    res.status(500).json({ message: 'Failed to find super admin' });
  }
});

// GET /api/support/university-admin/:uniId - Find Uni Admin for a specific university (for Super Admin)
router.get('/university-admin/:uniId', authenticate, async (req, res) => {
  try {
    const { uniId } = req.params;
    const { data: admin, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('university_id', uniId)
      .eq('role', 'university_admin')
      .limit(1)
      .maybeSingle();
      
    if (error || !admin) {
      return res.status(404).json({ message: 'No university admin available for this university' });
    }

    res.json({ adminId: admin.id, adminName: admin.name });
  } catch (error) {
    console.error('Error finding uni admin:', error);
    res.status(500).json({ message: 'Failed to find university admin' });
  }
});

module.exports = router;
