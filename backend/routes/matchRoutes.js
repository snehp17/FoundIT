const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// Helper: enrich a match with item + profile data
async function enrichMatch(match) {
  const [
    { data: lostItem },
    { data: foundItem },
    { data: ownerProfile },
    { data: finderProfile },
    { data: recovery }
  ] = await Promise.all([
    supabase.from('items').select('id, title, category, location, date, images, description, status').eq('id', match.lost_item_id).single(),
    supabase.from('items').select('id, title, category, location, date, images, description, status').eq('id', match.found_item_id).single(),
    supabase.from('profiles').select('id, name').eq('id', match.owner_id).single(),
    supabase.from('profiles').select('id, name').eq('id', match.finder_id).single(),
    supabase.from('recovery_tracking').select('id, status').eq('match_id', match.id).maybeSingle()
  ]);

  return {
    ...match,
    lost_item: lostItem,
    found_item: foundItem,
    owner: ownerProfile,
    finder: finderProfile,
    recovery: recovery
  };
}

// GET /api/matches — list all matches for current user (as owner or finder)
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .or(`owner_id.eq.${userId},finder_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!matches || matches.length === 0) return res.json([]);

    // Enrich with item + profile data
    const enriched = await Promise.all(matches.map(enrichMatch));
    const finalMatches = enriched.map(m => ({
      ...m,
      userRole: m.owner_id === userId ? 'owner' : 'finder'
    }));
    res.json(finalMatches);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ message: 'Server error fetching matches' });
  }
});

// GET /api/matches/:id — get single match detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: match, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !match) return res.status(404).json({ message: 'Match not found' });

    if (match.owner_id !== userId && match.finder_id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const enriched = await enrichMatch(match);

    // Also check if a recovery already exists for this match
    const { data: recovery } = await supabase
      .from('recovery_tracking')
      .select('id, status, verification_status')
      .eq('match_id', id)
      .single();

    enriched.recovery = recovery || null;
    enriched.userRole = match.owner_id === userId ? 'owner' : 'finder';

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching match:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/matches/:id/accept — owner accepts match → creates recovery record
router.post('/:id/accept', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: match, error: matchErr } = await supabase
      .from('matches').select('*').eq('id', id).single();

    if (matchErr || !match) return res.status(404).json({ message: 'Match not found' });
    if (match.owner_id !== userId) return res.status(403).json({ message: 'Only the item owner can accept a match' });
    if (match.status !== 'pending') return res.status(400).json({ message: `Match is already ${match.status}` });

    // Check if recovery already exists
    const { data: existingRecovery } = await supabase
      .from('recovery_tracking').select('id').eq('match_id', id).single();

    if (existingRecovery) {
      return res.json({ message: 'Recovery already exists', recovery_id: existingRecovery.id });
    }

    // Update match status
    await supabase.from('matches')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', id);

    // Create recovery record
    const { data: recovery, error: recoveryErr } = await supabase
      .from('recovery_tracking')
      .insert([{
        match_id: id,
        lost_item_id: match.lost_item_id,
        found_item_id: match.found_item_id,
        owner_id: match.owner_id,
        finder_id: match.finder_id,
        status: 'VERIFICATION_IN_PROGRESS',
        verification_status: 'IN_PROGRESS'
      }])
      .select().single();

    if (recoveryErr) throw recoveryErr;

    // Create initial tracking events
    await supabase.from('tracking_events').insert([
      { recovery_id: recovery.id, event_type: 'MATCH_ACCEPTED', actor_id: userId, metadata: { match_id: id, score: match.overall_score } },
      { recovery_id: recovery.id, event_type: 'VERIFICATION_STARTED', actor_id: userId, metadata: {} }
    ]);

    // Notify finder
    await supabase.from('notifications').insert([{
      user_id: match.finder_id,
      type: 'recovery',
      title: 'Match Accepted!',
      message: 'The item owner has accepted your match. Open Secure Chat to start ownership verification.',
      meta_data: { recovery_id: recovery.id, match_id: id }
    }]);

    res.json({ message: 'Match accepted. Recovery started.', recovery_id: recovery.id });
  } catch (err) {
    console.error('Error accepting match:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/matches/:id/reject — reject a match
router.post('/:id/reject', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: match } = await supabase.from('matches').select('owner_id').eq('id', id).single();
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.owner_id !== userId) return res.status(403).json({ message: 'Access denied' });

    await supabase.from('matches')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', id);

    res.json({ message: 'Match rejected' });
  } catch (err) {
    console.error('Error rejecting match:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
