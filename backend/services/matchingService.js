const { computeMatchScore } = require('./aiService');

const PAGE_SIZE = 250;
const MIN_MATCH_SCORE = 70;
const pairLocks = new Map();
const WORDS_TO_IGNORE = new Set([
  'a', 'an', 'and', 'at', 'found', 'i', 'in', 'is', 'item', 'lost',
  'my', 'near', 'of', 'on', 'the', 'to', 'with'
]);

function tokens(value) {
  return new Set(String(value || '').toLowerCase().match(/[a-z0-9]+/g)
    ?.filter(word => word.length > 1 && !WORDS_TO_IGNORE.has(word)) || []);
}

function wordSimilarity(left, right) {
  const leftWords = tokens(left);
  const rightWords = tokens(right);
  if (!leftWords.size || !rightWords.size) return 0;
  const overlap = [...leftWords].filter(word => rightWords.has(word)).length;
  return overlap / new Set([...leftWords, ...rightWords]).size;
}

function lexicalSimilarity(left, right) {
  const leftText = [left.title, left.description, left.brand, left.primary_color].join(' ');
  const rightText = [right.title, right.description, right.brand, right.primary_color].join(' ');
  return Math.max(wordSimilarity(left.title, right.title), wordSimilarity(leftText, rightText));
}

function categoryGroup(category) {
  const group = String(category || '').toLowerCase().split(/\s+-\s+|\s*\/\s*/)[0].trim();
  return ({ id: 'documents', document: 'documents', bag: 'bags', book: 'books', audio: 'electronics' })[group] || group;
}

async function withPairLock(key, action) {
  const previous = pairLocks.get(key) || Promise.resolve();
  let release;
  const held = new Promise(resolve => { release = resolve; });
  const tail = previous.then(() => held);
  pairLocks.set(key, tail);
  await previous;
  try {
    return await action();
  } finally {
    release();
    if (pairLocks.get(key) === tail) pairLocks.delete(key);
  }
}

function eligibleMatch(item, candidate, vectorScores = {}) {
  if (candidate.id === item.id || candidate.user_id === item.user_id) return null;
  const lexical = lexicalSimilarity(item, candidate);
  const textSimilarity = Number.isFinite(vectorScores.text) ? vectorScores.text : lexical;
  const imageSimilarity = Number.isFinite(vectorScores.image) ? vectorScores.image : null;
  const sameCategory = categoryGroup(item.category) && categoryGroup(item.category) === categoryGroup(candidate.category);

  // A shared category, date or location alone is not enough to alert users.
  if (!sameCategory && textSimilarity < 0.82 && (imageSimilarity ?? 0) < 0.86) return null;
  if (lexical < 0.25 && textSimilarity < 0.70 && (imageSimilarity ?? 0) < 0.78) return null;

  const lostItem = item.type === 'LOST' ? item : candidate;
  const foundItem = item.type === 'FOUND' ? item : candidate;
  const scores = computeMatchScore(
    { ...lostItem, category: categoryGroup(lostItem.category) },
    { ...foundItem, category: categoryGroup(foundItem.category) },
    textSimilarity,
    imageSimilarity
  );
  return scores.overall_score >= MIN_MATCH_SCORE ? scores : null;
}

async function vectorScoresForItem(supabase, item, { textEmbedding, imageEmbedding }) {
  const scores = new Map();
  const targetType = item.type === 'LOST' ? 'FOUND' : 'LOST';
  for (const [kind, embedding, functionName] of [
    ['text', textEmbedding, 'match_items_text'],
    ['image', imageEmbedding, 'match_items_image']
  ]) {
    if (!embedding) continue;
    try {
      const { data, error } = await supabase.rpc(functionName, {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 50,
        p_type: targetType,
        p_university_id: item.university_id
      });
      if (error) throw error;
      for (const result of data || []) {
        const id = result.id || result.item_id;
        const similarity = Number(result.similarity);
        if (!id || !Number.isFinite(similarity)) continue;
        scores.set(id, { ...scores.get(id), [kind]: similarity });
      }
    } catch (error) {
      console.warn(`${functionName} unavailable; using report details instead:`, error.message);
    }
  }
  return scores;
}

async function activeCandidates(supabase, item) {
  const candidates = [];
  const oppositeType = item.type === 'LOST' ? 'FOUND' : 'LOST';
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.from('items')
      .select('id,user_id,university_id,type,status,title,description,category,location,date,created_at,brand,primary_color')
      .eq('university_id', item.university_id)
      .eq('type', oppositeType)
      .eq('status', 'Active')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    candidates.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return candidates;
}

async function findOrCreateMatch(supabase, lostItem, foundItem, universityId, scores) {
  const query = () => supabase.from('matches').select('id,status')
    .eq('lost_item_id', lostItem.id).eq('found_item_id', foundItem.id).maybeSingle();
  const { data: existing, error: lookupError } = await query();
  if (lookupError) throw lookupError;
  if (existing) return { match: existing, created: false };

  const { data: match, error } = await supabase.from('matches').insert([{
    lost_item_id: lostItem.id,
    found_item_id: foundItem.id,
    owner_id: lostItem.user_id,
    finder_id: foundItem.user_id,
    university_id: universityId,
    ...scores
  }]).select('id,status').single();
  if (error?.code === '23505') {
    const { data: racedMatch, error: raceError } = await query();
    if (raceError) throw raceError;
    if (racedMatch) return { match: racedMatch, created: false };
  }
  if (error) throw error;
  return { match, created: true };
}

async function ensureNotification(supabase, recipient, match, lostItem, foundItem, score) {
  const pair = { lost_item_id: lostItem.id, found_item_id: foundItem.id };
  const { data: existing, error: lookupError } = await supabase.from('notifications')
    .select('id').eq('user_id', recipient.id).eq('type', 'match')
    .contains('meta_data', pair).limit(1);
  if (lookupError) throw lookupError;
  if (existing?.length) return false;

  const isAdmin = recipient.role === 'university_admin';
  const message = isAdmin
    ? `A lost report "${lostItem.title}" may match a found report "${foundItem.title}" (${score}% match score). Review Smart Matches.`
    : `Your report may match "${recipient.id === lostItem.user_id ? foundItem.title : lostItem.title}" (${score}% match score). Open Smart Matches to review.`;
  const { error } = await supabase.from('notifications').insert([{
    user_id: recipient.id,
    type: 'match',
    title: 'Potential Match Found!',
    message,
    meta_data: { ...pair, match_id: match.id }
  }]);
  if (error?.code === '23505') return false;
  if (error) throw error;
  return true;
}

async function matchReportedItem(supabase, item, embeddings = {}) {
  if (!['LOST', 'FOUND'].includes(item.type) || !item.university_id) {
    throw new Error('The report needs a valid type and university before matching.');
  }

  const [vectorScores, candidates] = await Promise.all([
    vectorScoresForItem(supabase, item, embeddings),
    activeCandidates(supabase, item)
  ]);
  const { data: admins, error: adminError } = await supabase.from('profiles')
    .select('id').eq('university_id', item.university_id).eq('role', 'university_admin');

  let matchesCreated = 0;
  let notificationsCreated = 0;
  const errors = adminError ? [`Could not find university admins: ${adminError.message}`] : [];
  for (const candidate of candidates) {
    const scores = eligibleMatch(item, candidate, vectorScores.get(candidate.id));
    if (!scores) continue;
    const lostItem = item.type === 'LOST' ? item : candidate;
    const foundItem = item.type === 'FOUND' ? item : candidate;
    try {
      await withPairLock(`${lostItem.id}:${foundItem.id}`, async () => {
        const { match, created } = await findOrCreateMatch(supabase, lostItem, foundItem, item.university_id, scores);
        if (created) matchesCreated++;
        if (match.status !== 'pending') return;
        const recipients = new Map([
          [lostItem.user_id, { id: lostItem.user_id, role: 'owner' }],
          [foundItem.user_id, { id: foundItem.user_id, role: 'finder' }],
          ...(admins || []).map(admin => [admin.id, { id: admin.id, role: 'university_admin' }])
        ]);
        for (const recipient of recipients.values()) {
          try {
            if (await ensureNotification(supabase, recipient, match, lostItem, foundItem, scores.overall_score)) {
              notificationsCreated++;
            }
          } catch (error) {
            errors.push(`Notification for ${recipient.role}: ${error.message}`);
          }
        }
      });
    } catch (error) {
      errors.push(`Match for ${candidate.id}: ${error.message}`);
    }
  }

  return {
    status: errors.length ? 'partial' : 'complete',
    matchesCreated,
    notificationsCreated,
    errors
  };
}

module.exports = { matchReportedItem, eligibleMatch, lexicalSimilarity, categoryGroup };
