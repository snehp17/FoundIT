const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// ─── BLOG POSTS (Public) ──────────────────────────────────────────────────────

router.get('/blog', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, tag, tag_color, title, description, author, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Blog list error:', err);
    res.status(500).json({ message: 'Failed to fetch blog posts' });
  }
});

router.get('/blog/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', req.params.id)
      .eq('published', true)
      .single();
    if (error || !data) return res.status(404).json({ message: 'Post not found' });
    res.json(data);
  } catch (err) {
    console.error('Blog post error:', err);
    res.status(500).json({ message: 'Failed to fetch blog post' });
  }
});

// ─── JOB LISTINGS (Public) ────────────────────────────────────────────────────

router.get('/jobs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('job_listings')
      .select('id, role, type, location, description, requirements, apply_deadline')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Jobs list error:', err);
    res.status(500).json({ message: 'Failed to fetch job listings' });
  }
});

router.get('/jobs/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('job_listings')
      .select('*')
      .eq('id', req.params.id)
      .eq('active', true)
      .single();
    if (error || !data) return res.status(404).json({ message: 'Job not found' });
    res.json(data);
  } catch (err) {
    console.error('Job detail error:', err);
    res.status(500).json({ message: 'Failed to fetch job' });
  }
});

// POST /api/content/jobs/:id/apply — submit application
router.post('/jobs/:id/apply', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, cover_letter } = req.body;

    if (!name || !email || !cover_letter) {
      return res.status(400).json({ message: 'Name, email and cover letter are required.' });
    }

    // Check job exists
    const { data: job, error: jobErr } = await supabase
      .from('job_listings')
      .select('id, role')
      .eq('id', id)
      .eq('active', true)
      .single();

    if (jobErr || !job) return res.status(404).json({ message: 'Job listing not found or closed.' });

    // Check no duplicate application
    const { data: existing } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', id)
      .eq('email', email)
      .single();

    if (existing) return res.status(409).json({ message: 'You have already applied for this position.' });

    const { error } = await supabase
      .from('job_applications')
      .insert([{ job_id: id, name, email, phone: phone || null, cover_letter }]);

    if (error) throw error;
    res.json({ message: `Application submitted for "${job.role}". We will review it and get back to you!` });
  } catch (err) {
    console.error('Application error:', err);
    res.status(500).json({ message: 'Failed to submit application.' });
  }
});

// ─── PRESS ARTICLES (Public) ──────────────────────────────────────────────────

router.get('/press', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('press_articles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch press articles' });
  }
});

// ─── CONTACT FORM (Public) ────────────────────────────────────────────────────

router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required.' });
    }
    const { error } = await supabase
      .from('contact_messages')
      .insert([{ name, email, subject: subject || 'General Inquiry', message }]);
    if (error) throw error;
    res.json({ message: 'Message received! We will get back to you within 24 hours.' });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ message: 'Failed to send message. Please try again.' });
  }
});

// ─── ADMIN: BLOG CRUD ─────────────────────────────────────────────────────────

router.get('/admin/blog', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch blog posts' });
  }
});

router.post('/admin/blog', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { tag, tag_color, title, description, content, author, published, published_at } = req.body;
    if (!title || !description || !content) {
      return res.status(400).json({ message: 'Title, description, and content are required.' });
    }
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{ tag, tag_color, title, description, content, author, published: published ?? true, published_at: published_at || new Date().toISOString().split('T')[0] }])
      .select().single();
    if (error) throw error;
    res.json({ message: 'Blog post created', post: data });
  } catch (err) {
    console.error('Create blog error:', err);
    res.status(500).json({ message: 'Failed to create blog post' });
  }
});

router.put('/admin/blog/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json({ message: 'Blog post updated', post: data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update blog post' });
  }
});

router.delete('/admin/blog/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { error } = await supabase.from('blog_posts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Blog post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete blog post' });
  }
});

// ─── ADMIN: JOB LISTINGS CRUD ────────────────────────────────────────────────

router.get('/admin/jobs', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('job_listings')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

router.post('/admin/jobs', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { role, type, location, description, requirements, apply_deadline } = req.body;
    if (!role || !description) return res.status(400).json({ message: 'Role and description are required.' });
    const { data, error } = await supabase
      .from('job_listings')
      .insert([{ role, type, location, description, requirements: requirements || [], apply_deadline: apply_deadline || null }])
      .select().single();
    if (error) throw error;
    res.json({ message: 'Job listing created', job: data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create job listing' });
  }
});

router.put('/admin/jobs/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('job_listings')
      .update(req.body)
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json({ message: 'Job updated', job: data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update job listing' });
  }
});

router.delete('/admin/jobs/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { error } = await supabase.from('job_listings').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete job' });
  }
});

// ─── ADMIN: JOB APPLICATIONS ──────────────────────────────────────────────────

router.get('/admin/applications', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { job_id } = req.query;
    let query = supabase
      .from('job_applications')
      .select('*, job_listings(role, type, location)')
      .order('applied_at', { ascending: false });

    if (job_id) query = query.eq('job_id', job_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

router.put('/admin/applications/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const { data, error } = await supabase
      .from('job_applications')
      .update({ status, admin_notes })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json({ message: 'Application updated', application: data });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update application' });
  }
});

// ─── ADMIN: CONTACT MESSAGES ──────────────────────────────────────────────────

router.get('/admin/contacts', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch contact messages' });
  }
});

module.exports = router;
