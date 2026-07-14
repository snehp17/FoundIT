const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// Get messages for the current user
router.get('/', authenticate, async (req, res) => {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`*, sender:profiles!sender_id(name), receiver:profiles!receiver_id(name), item:items(title, status)`)
      .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(messages || []);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a new message
router.post('/', authenticate, async (req, res) => {
  try {
    const { receiver_id, item_id, text } = req.body;

    if (!receiver_id || !item_id || !text) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert([{
        sender_id: req.user.id,
        receiver_id,
        item_id,
        text
      }])
      .select(`*, sender:profiles!sender_id(name)`)
      .single();

    if (error) throw error;

    res.json({ message: 'Message sent successfully', data: message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
