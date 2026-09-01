const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const crypto = require('crypto');
const QRCode = require('qrcode');

// Helper: verify user is part of a recovery
async function getRecovery(id, userId) {
  const { data, error } = await supabase
    .from('recovery_tracking')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  if (data.owner_id !== userId && data.finder_id !== userId) return null;
  return data;
}

// GET /api/recovery — list all recoveries for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: recoveries, error } = await supabase
      .from('recovery_tracking')
      .select('*')
      .or(`owner_id.eq.${userId},finder_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!recoveries || recoveries.length === 0) return res.json([]);

    // Enrich with item titles
    const enriched = await Promise.all(recoveries.map(async (r) => {
      const [{ data: lostItem }, { data: match }] = await Promise.all([
        supabase.from('items').select('id, title, category, images').eq('id', r.lost_item_id).single(),
        supabase.from('matches').select('overall_score').eq('id', r.match_id).single()
      ]);
      return { ...r, lost_item: lostItem, match_score: match?.overall_score, userRole: r.owner_id === userId ? 'owner' : 'finder' };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching recoveries:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/recovery/:id — get full recovery detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: recovery, error } = await supabase
      .from('recovery_tracking')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !recovery) return res.status(404).json({ message: 'Recovery not found' });
    if (recovery.owner_id !== userId && recovery.finder_id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Enrich with related data
    let [
      { data: lostItem },
      { data: foundItem },
      { data: ownerProfile },
      { data: finderProfile },
      { data: match }
    ] = await Promise.all([
      supabase.from('items').select('id, title, category, location, date, images, description, status').eq('id', recovery.lost_item_id).single(),
      supabase.from('items').select('id, title, category, location, date, images, description, status').eq('id', recovery.found_item_id).single(),
      supabase.from('profiles').select('id, name, email').eq('id', recovery.owner_id).single(),
      supabase.from('profiles').select('id, name, email').eq('id', recovery.finder_id).single(),
      supabase.from('matches').select('overall_score, text_score, image_score, category_match, location_score, date_score').eq('id', recovery.match_id).single()
    ]);

    // Fallback to auth.users if profiles are missing
    if (!ownerProfile || !ownerProfile.name) {
      const { data: authOwner } = await supabase.auth.admin.getUserById(recovery.owner_id);
      if (authOwner && authOwner.user) {
        ownerProfile = {
          id: recovery.owner_id,
          name: authOwner.user.user_metadata?.name || authOwner.user.email?.split('@')[0],
          email: authOwner.user.email
        };
      }
    }
    if (!finderProfile || !finderProfile.name) {
      const { data: authFinder } = await supabase.auth.admin.getUserById(recovery.finder_id);
      if (authFinder && authFinder.user) {
        finderProfile = {
          id: recovery.finder_id,
          name: authFinder.user.user_metadata?.name || authFinder.user.email?.split('@')[0],
          email: authFinder.user.email
        };
      }
    }

    res.json({
      ...recovery,
      lost_item: lostItem,
      found_item: foundItem,
      owner: ownerProfile,
      finder: finderProfile,
      match_scores: match,
      userRole: recovery.owner_id === userId ? 'owner' : 'finder'
    });
  } catch (err) {
    console.error('Error fetching recovery:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/recovery/:id/events — tracking timeline events
router.get('/:id/events', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: recovery } = await supabase
      .from('recovery_tracking').select('owner_id, finder_id').eq('id', id).single();

    if (!recovery || (recovery.owner_id !== userId && recovery.finder_id !== userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { data: events, error } = await supabase
      .from('tracking_events')
      .select('*')
      .eq('recovery_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(events || []);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/recovery/:id/verify — update verification status
router.post('/:id/verify', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'VERIFIED' or 'REJECTED'
    const userId = req.user.id;

    const recovery = await getRecovery(id, userId);
    if (!recovery) return res.status(404).json({ message: 'Recovery not found or access denied' });

    const newStatus = status === 'VERIFIED' ? 'VERIFIED_FOR_HANDOVER' : 'VERIFICATION_REJECTED';

    await supabase.from('recovery_tracking')
      .update({ status: newStatus, verification_status: status, updated_at: new Date().toISOString() })
      .eq('id', id);

    await supabase.from('tracking_events').insert([{
      recovery_id: id,
      event_type: status === 'VERIFIED' ? 'VERIFIED_FOR_HANDOVER' : 'VERIFICATION_REJECTED',
      actor_id: userId,
      metadata: {}
    }]);

    const notifyId = recovery.owner_id === userId ? recovery.finder_id : recovery.owner_id;
    await supabase.from('notifications').insert([{
      user_id: notifyId,
      type: 'recovery',
      title: status === 'VERIFIED' ? 'Ownership Verified! ✅' : 'Verification Unsuccessful',
      message: status === 'VERIFIED'
        ? 'Ownership verified. The owner can now generate a handover QR code from the Tracking page.'
        : 'Ownership verification was unsuccessful. Please check the chat for more information.',
      meta_data: { recovery_id: id }
    }]);

    res.json({ message: `Verification updated to ${status}` });
  } catch (err) {
    console.error('Error updating verification:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/recovery/:id/qr — generate handover QR (owner only)
router.post('/:id/qr', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: recovery } = await supabase
      .from('recovery_tracking').select('*').eq('id', id).single();

    if (!recovery) return res.status(404).json({ message: 'Recovery not found' });
    if (recovery.owner_id !== userId) return res.status(403).json({ message: 'Only the owner can generate a handover QR' });
    if (!['VERIFICATION_IN_PROGRESS', 'VERIFIED_FOR_HANDOVER', 'HANDOVER_READY'].includes(recovery.status)) {
      return res.status(400).json({ message: 'Ownership must be verified before generating a handover QR' });
    }

    // Invalidate any previous unused tokens
    await supabase.from('handover_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('recovery_id', id)
      .is('used_at', null);

    // Generate a shorter token for a scannable QR (12 bytes = 24 hex chars)
    const rawToken = crypto.randomBytes(12).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const { error: tokenErr } = await supabase.from('handover_tokens').insert([{
      recovery_id: id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      created_by: userId
    }]);
    if (tokenErr) throw tokenErr;

    // Update recovery status
    await supabase.from('recovery_tracking')
      .update({ status: 'HANDOVER_READY', qr_generated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id);

    await supabase.from('tracking_events').insert([{
      recovery_id: id,
      event_type: 'QR_GENERATED',
      actor_id: userId,
      metadata: { expires_at: expiresAt.toISOString() }
    }]);

    // Short QR payload: FI:<token>:<short-id>
    const shortId = id.replace(/-/g, '').substring(0, 12);
    const qrPayload = `FI:${rawToken}:${shortId}`;
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 400,
      margin: 3,
      errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#ffffff' }
    });

    // Notify finder
    await supabase.from('notifications').insert([{
      user_id: recovery.finder_id,
      type: 'recovery',
      title: 'Handover QR Ready',
      message: 'The owner has generated a handover QR code. Go to Tracking → Scan QR to complete the handover.',
      meta_data: { recovery_id: id }
    }]);

    res.json({
      message: 'QR generated successfully',
      qr_data_url: qrDataUrl,
      raw_token: qrPayload,
      expires_at: expiresAt.toISOString()
    });
  } catch (err) {
    console.error('Error generating QR:', err);
    res.status(500).json({ message: 'Server error generating QR code' });
  }
});

// POST /api/recovery/scan-qr — validate QR (finder only)
router.post('/scan-qr', authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    if (!token) return res.status(400).json({ message: 'QR token is required' });

    // Parse both formats:
    //   Old: FOUNDIT:<rawToken>:<recoveryId>
    //   New: FI:<rawToken>:<shortId>
    let rawToken, recoveryIdHint;
    if (token.startsWith('FI:')) {
      const parts = token.split(':');
      if (parts.length !== 3) return res.status(400).json({ message: 'Invalid QR format' });
      rawToken = parts[1];
      recoveryIdHint = parts[2]; // short id (12 hex chars, no dashes)
    } else if (token.startsWith('FOUNDIT:')) {
      const parts = token.split(':');
      if (parts.length !== 3) return res.status(400).json({ message: 'Invalid QR format' });
      rawToken = parts[1];
      recoveryIdHint = parts[2]; // full UUID
    } else {
      return res.status(400).json({ message: 'Invalid QR code. This was not generated by FoundIT.' });
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Look up the token by hash only (works for both short and full id)
    const { data: tokenRecord, error: tokenErr } = await supabase
      .from('handover_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .is('used_at', null)
      .single();

    if (tokenErr || !tokenRecord) return res.status(400).json({ verified: false, message: '❌ Invalid QR code. This code is not recognized.' });
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(400).json({ verified: false, message: '❌ QR code has expired. Please ask the owner to generate a new one.' });
    }

    const recoveryId = tokenRecord.recovery_id;

    // Get recovery and verify finder
    const { data: recovery } = await supabase
      .from('recovery_tracking').select('*').eq('id', recoveryId).single();

    if (!recovery) return res.status(404).json({ verified: false, message: '❌ Recovery record not found' });
    if (recovery.finder_id !== userId) return res.status(403).json({ verified: false, message: '❌ You are not the authorized finder for this recovery.' });
    if (!['VERIFICATION_IN_PROGRESS', 'HANDOVER_READY', 'VERIFIED_FOR_HANDOVER'].includes(recovery.status)) {
      return res.status(400).json({ verified: false, message: `Recovery is in '${recovery.status}' state and is not ready for handover.` });
    }

    // Mark token used, update recovery
    await supabase.from('handover_tokens')
      .update({ used_at: new Date().toISOString() }).eq('id', tokenRecord.id);

    await supabase.from('recovery_tracking')
      .update({ status: 'QR_SCANNED', qr_scanned_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', recoveryId);

    await supabase.from('tracking_events').insert([{
      recovery_id: recoveryId,
      event_type: 'QR_SCANNED',
      actor_id: userId,
      metadata: {}
    }]);

    // Notify owner
    await supabase.from('notifications').insert([{
      user_id: recovery.owner_id,
      type: 'recovery',
      title: 'QR Scanned!',
      message: 'The finder has scanned the handover QR. Please confirm item receipt to complete recovery.',
      meta_data: { recovery_id: recoveryId }
    }]);

    // Fetch owner details (revealed after QR scan for verification)
    const [{ data: owner }, { data: lostItem }] = await Promise.all([
      supabase.from('profiles').select('id, name, email').eq('id', recovery.owner_id).single(),
      supabase.from('items').select('id, title, category, description, location, date').eq('id', recovery.lost_item_id).single()
    ]);

    // Fallback to auth.users if profile is missing or incomplete
    let ownerName = owner?.name;
    let ownerEmail = owner?.email;
    if (!ownerName || !ownerEmail) {
      const { data: authUser } = await supabase.auth.admin.getUserById(recovery.owner_id);
      if (authUser && authUser.user) {
        ownerName = ownerName || authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0];
        ownerEmail = ownerEmail || authUser.user.email;
      }
    }

    res.json({
      verified: true,
      message: '✅ QR Verified! This person is the rightful owner.',
      recovery_id: recoveryId,
      owner: { name: ownerName, email: ownerEmail },
      item: { title: lostItem?.title, category: lostItem?.category, description: lostItem?.description, location: lostItem?.location, date: lostItem?.date }
    });
  } catch (err) {
    console.error('Error scanning QR:', err);
    res.status(500).json({ verified: false, message: 'Server error validating QR code' });
  }
});

// POST /api/recovery/:id/handover-confirm — finder confirms handover → auto-close recovery
router.post('/:id/handover-confirm', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: recovery } = await supabase
      .from('recovery_tracking').select('*').eq('id', id).single();

    if (!recovery) return res.status(404).json({ message: 'Recovery not found' });
    if (recovery.finder_id !== userId) return res.status(403).json({ message: 'Only the finder can confirm handover' });

    const now = new Date().toISOString();

    // Close the recovery entirely
    await supabase.from('recovery_tracking')
      .update({ 
        status: 'CLOSED', 
        handover_confirmed_at: now, 
        recovered_at: now, 
        closed_at: now, 
        updated_at: now 
      })
      .eq('id', id);

    // Mark both items as Closed so they disappear from dashboard
    await Promise.all([
      supabase.from('items').update({ status: 'Closed' }).eq('id', recovery.lost_item_id),
      supabase.from('items').update({ status: 'Closed' }).eq('id', recovery.found_item_id)
    ]);

    // Close the match record
    if (recovery.match_id) {
      await supabase.from('matches')
        .update({ status: 'accepted', updated_at: now }).eq('id', recovery.match_id);
    }

    // Log events
    await supabase.from('tracking_events').insert([
      { recovery_id: id, event_type: 'HANDOVER_CONFIRMED', actor_id: userId, metadata: {} },
      { recovery_id: id, event_type: 'RECOVERED', actor_id: userId, metadata: { recovered_at: now } },
      { recovery_id: id, event_type: 'CLOSED', actor_id: userId, metadata: { closed_at: now } }
    ]);

    // Notify owner
    await supabase.from('notifications').insert([{
      user_id: recovery.owner_id,
      type: 'recovery',
      title: 'Recovery Complete! 🎉',
      message: 'The finder has confirmed the handover. Your item has been successfully returned!',
      meta_data: { recovery_id: id }
    }]);

    // Notify finder
    await supabase.from('notifications').insert([{
      user_id: recovery.finder_id,
      type: 'recovery',
      title: 'Thank You! 🎉',
      message: 'Handover confirmed. Thank you for being a Good Samaritan and returning the item!',
      meta_data: { recovery_id: id }
    }]);

    res.json({ message: 'Handover complete! Recovery closed. Both items archived.' });
  } catch (err) {
    console.error('Error confirming handover:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/recovery/:id/close — owner confirms receipt + closes report
router.post('/:id/close', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: recovery } = await supabase
      .from('recovery_tracking').select('*').eq('id', id).single();

    if (!recovery) return res.status(404).json({ message: 'Recovery not found' });
    if (recovery.owner_id !== userId) return res.status(403).json({ message: 'Only the owner can close the recovery' });

    const now = new Date().toISOString();

    await supabase.from('recovery_tracking')
      .update({ status: 'CLOSED', recovered_at: now, closed_at: now, updated_at: now })
      .eq('id', id);

    // Archive both items
    await Promise.all([
      supabase.from('items').update({ status: 'Closed' }).eq('id', recovery.lost_item_id),
      supabase.from('items').update({ status: 'Closed' }).eq('id', recovery.found_item_id)
    ]);

    // Close the match
    await supabase.from('matches')
      .update({ status: 'accepted', updated_at: now }).eq('id', recovery.match_id);

    await supabase.from('tracking_events').insert([
      { recovery_id: id, event_type: 'RECOVERED', actor_id: userId, metadata: { recovered_at: now } },
      { recovery_id: id, event_type: 'CLOSED', actor_id: userId, metadata: { closed_at: now } }
    ]);

    await supabase.from('notifications').insert([{
      user_id: recovery.finder_id,
      type: 'recovery',
      title: 'Recovery Complete! 🎉',
      message: 'The item has been returned to its owner. Thank you for being a Good Samaritan!',
      meta_data: { recovery_id: id }
    }]);

    res.json({ message: 'Recovery closed. Item successfully recovered!' });
  } catch (err) {
    console.error('Error closing recovery:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
