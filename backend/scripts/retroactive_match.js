const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const supabase = require('../config/supabase');
const { matchReportedItem } = require('../services/matchingService');

async function run() {
  let offset = 0;
  let processed = 0;
  let matchesCreated = 0;
  let notificationsCreated = 0;
  let incomplete = 0;

  // This is an explicit maintenance command. It does not run during server startup.
  while (true) {
    const { data: items, error } = await supabase.from('items').select('*')
      .eq('status', 'Active')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + 99);
    if (error) throw error;

    for (const item of items || []) {
      const { data: embeddings, error: embeddingError } = await supabase.from('item_embeddings')
        .select('text_embedding,image_embedding').eq('item_id', item.id).maybeSingle();
      if (embeddingError) console.warn(`Embeddings unavailable for ${item.id}:`, embeddingError.message);
      const result = await matchReportedItem(supabase, item, {
        textEmbedding: embeddings?.text_embedding,
        imageEmbedding: embeddings?.image_embedding
      });
      processed++;
      matchesCreated += result.matchesCreated;
      notificationsCreated += result.notificationsCreated;
      if (result.status !== 'complete') {
        incomplete++;
        console.error(`Matching incomplete for ${item.id}:`, result.errors);
      }
    }

    if (!items || items.length < 100) break;
    offset += 100;
  }

  console.log(JSON.stringify({ processed, matchesCreated, notificationsCreated, incomplete }));
  if (incomplete) process.exitCode = 1;
}

run().catch(error => {
  console.error('Retroactive matching failed:', error);
  process.exitCode = 1;
});
