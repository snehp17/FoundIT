const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, userCache } = require('../middleware/auth');

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || 'https://fnspjghibqohshfulnah.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || 'sb_publishable_nFgYIjMr4IZIhtUODt8vVw_Lwtx1yoj';

// Get messages for the current user
router.get('/', authenticate, async (req, res) => {
  try {
    const authedSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.authorization } }
    });

    let messagesQuery = authedSupabase.from('messages').select('*').order('created_at', { ascending: true });

    messagesQuery = messagesQuery.or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`);

    const { data: messages, error } = await messagesQuery;

    if (error) throw error;

    if (!messages || messages.length === 0) {
      return res.json([]);
    }

    const userIds = [...new Set(messages.flatMap(m => [m.sender_id, m.receiver_id]))];
    const itemIds = [...new Set(messages.map(m => m.item_id))];

    const [{ data: profiles }, { data: itemsWithProfiles }] = await Promise.all([
      supabase.from('profiles').select('id, name, email').in('id', userIds),
      supabase.from('items').select('id, title, status, user_id, profiles(id, name, email)').in('user_id', userIds)
    ]);

    const profileMap = new Map();
    (profiles || []).forEach(p => {
      if (p && p.id && p.name) profileMap.set(p.id, p);
    });
    (itemsWithProfiles || []).forEach(item => {
      if (item.profiles && item.profiles.id && item.profiles.name) {
        profileMap.set(item.profiles.id, item.profiles);
      }
    });

    const itemMap = new Map((itemsWithProfiles || []).map(i => [i.id, i]));

    const enrichedMessages = messages.map(m => {
      const senderObj = profileMap.get(m.sender_id) || userCache.get(m.sender_id) || { id: m.sender_id, name: req.user.id === m.sender_id ? req.user.name : 'User' };
      const receiverObj = profileMap.get(m.receiver_id) || userCache.get(m.receiver_id) || { id: m.receiver_id, name: req.user.id === m.receiver_id ? req.user.name : 'User' };

      return {
        ...m,
        sender: senderObj,
        receiver: receiverObj,
        item: itemMap.get(m.item_id) || { id: m.item_id, title: 'Item' }
      };
    });

    res.json(enrichedMessages);
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

    const authedSupabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.authorization } }
    });

    const { data: message, error } = await authedSupabase
      .from('messages')
      .insert([{
        sender_id: req.user.id,
        receiver_id,
        item_id,
        text
      }])
      .select('*')
      .single();

    if (error) throw error;

    const { data: receiverProfile } = await authedSupabase
      .from('profiles')
      .select('id, name')
      .eq('id', receiver_id)
      .single();

    const enrichedMessage = {
      ...message,
      sender: { id: req.user.id, name: req.user.name },
      receiver: receiverProfile || { id: receiver_id, name: 'User' }
    };

    // Create a notification for the receiver
    const { error: notifError } = await supabase
      .from('notifications')
      .insert([{
        user_id: receiver_id,
        title: 'New Secure Message',
        message: `You have a new message from ${req.user.name || 'someone'}.`
      }]);
    
    if (notifError) console.error("Error creating message notification:", notifError);

    res.json({ message: 'Message sent successfully', data: enrichedMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload an attachment
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const uniqueName = `${Date.now()}-${req.file.originalname}`;
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(uniqueName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(uniqueName);
    if (publicUrlData && publicUrlData.publicUrl) {
      res.json({ url: publicUrlData.publicUrl });
    } else {
      throw new Error("Could not get public URL");
    }
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

module.exports = router;
