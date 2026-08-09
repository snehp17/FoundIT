// Quick script to check and fix recovery + item statuses
require('dotenv').config();
const supabase = require('../config/supabase');

async function fixStatuses() {
  // Get all recoveries
  const { data: recoveries, error } = await supabase
    .from('recovery_tracking')
    .select('id, status, lost_item_id, found_item_id, match_id');

  if (error) {
    console.error('Error fetching recoveries:', error);
    return;
  }

  console.log('Recoveries found:', recoveries?.length || 0);
  
  for (const r of (recoveries || [])) {
    console.log(`Recovery ${r.id}: status=${r.status}`);
    
    // If recovery is in any completed state, make sure items are Closed
    if (['HANDOVER_CONFIRMED', 'RECOVERED', 'CLOSED', 'QR_SCANNED'].includes(r.status)) {
      console.log(`  -> Closing items for recovery ${r.id}`);
      
      const now = new Date().toISOString();
      
      // Close the recovery
      await supabase.from('recovery_tracking')
        .update({ status: 'CLOSED', recovered_at: now, closed_at: now, updated_at: now })
        .eq('id', r.id);
      
      // Close both items
      if (r.lost_item_id) {
        await supabase.from('items').update({ status: 'Closed' }).eq('id', r.lost_item_id);
        console.log(`  -> Closed lost item ${r.lost_item_id}`);
      }
      if (r.found_item_id) {
        await supabase.from('items').update({ status: 'Closed' }).eq('id', r.found_item_id);
        console.log(`  -> Closed found item ${r.found_item_id}`);
      }
      
      // Close match
      if (r.match_id) {
        await supabase.from('matches').update({ status: 'accepted', updated_at: now }).eq('id', r.match_id);
        console.log(`  -> Closed match ${r.match_id}`);
      }
    }
  }
  
  console.log('\nDone! All completed recoveries have been properly closed.');
}

fixStatuses().catch(console.error);
