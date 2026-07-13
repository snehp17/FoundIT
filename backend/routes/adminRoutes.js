const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// ==========================================
// SUPER ADMIN ROUTES
// ==========================================

// Create a University
router.post('/universities', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { name, code, allowed_domain, allow_personal_emails } = req.body;
    
    const { data: university, error } = await supabase
      .from('universities')
      .insert([{ name, code, allowed_domain, allow_personal_emails }])
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'University created successfully', university });
  } catch (error) {
    console.error('Error creating university:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all universities
router.get('/universities', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { data: universities, error } = await supabase
      .from('universities')
      .select('*')
      .order('name');
      
    if (error) throw error;
    res.json(universities || []);
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a university
router.delete('/universities/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Deleting the university will cascade to profiles, items, etc. due to `on delete cascade` in schema
    const { error } = await supabase
      .from('universities')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    res.json({ message: 'University deleted successfully' });
  } catch (error) {
    console.error('Error deleting university:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a university
router.put('/universities/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, allowed_domain, allow_personal_emails } = req.body;
    
    const { data: university, error } = await supabase
      .from('universities')
      .update({ name, code, allowed_domain, allow_personal_emails })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    res.json({ message: 'University updated successfully', university });
  } catch (error) {
    console.error('Error updating university:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create University Admin
router.post('/university-admin', authenticate, authorize('super_admin'), async (req, res) => {
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

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { name, role: 'university_admin', university_id: universityId }
    });

    if (authError) {
      return res.status(400).json({ message: authError.message });
    }

    // Create profile
    const { data: admin, error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        name,
        email,
        role: 'university_admin',
        university_id: universityId
      }])
      .select()
      .single();

    if (profileError) throw profileError;

    res.json({ message: 'University Admin created successfully', admin });
  } catch (error) {
    console.error('Error creating university admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Partner Requests
router.get('/requests', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { data: requests, error } = await supabase
      .from('university_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(requests || []);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Partner Request Status
router.put('/requests/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const { data: request, error } = await supabase
      .from('university_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Request updated', request });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Advanced Accept Request Workflow
router.post('/accept-request/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { code, allowed_domain, allow_personal_emails, admin_password } = req.body;

    // 1. Fetch the request
    const { data: request, error: reqError } = await supabase
      .from('university_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (reqError || !request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // 2. Create the university
    const { data: university, error: uniError } = await supabase
      .from('universities')
      .insert([{
        name: request.university_name,
        code,
        allowed_domain,
        allow_personal_emails
      }])
      .select()
      .single();

    if (uniError) {
      return res.status(400).json({ message: 'Failed to create university: ' + uniError.message });
    }

    // 3. Create university_admin in Auth
    const email = request.official_email;
    const name = request.contact_person;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: admin_password,
      email_confirm: true,
      user_metadata: { name, role: 'university_admin', university_id: university.id }
    });

    if (authError) {
      return res.status(400).json({ message: 'Failed to create admin user: ' + authError.message });
    }

    // 4. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        name,
        email,
        role: 'university_admin',
        university_id: university.id
      }]);

    if (profileError) {
      return res.status(400).json({ message: 'Failed to create admin profile: ' + profileError.message });
    }

    // 5. Update request status to approved
    await supabase
      .from('university_requests')
      .update({ status: 'approved' })
      .eq('id', id);

    res.json({ message: 'University and admin created successfully', university });
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==========================================
// UNIVERSITY ADMIN ROUTES
// ==========================================

// Get all students for the university
router.get('/students', authenticate, authorize(['university_admin', 'super_admin']), async (req, res) => {
  try {
    // If super admin, they might pass universityId in query. If uni admin, use from token.
    const universityId = req.user.role === 'university_admin' ? req.user.university_id : req.query.universityId;

    if (!universityId) {
      return res.status(400).json({ message: 'universityId is required' });
    }

    const { data: students, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('university_id', universityId)
      .eq('role', 'student')
      .order('name');

    if (error) throw error;

    res.json(students || []);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
