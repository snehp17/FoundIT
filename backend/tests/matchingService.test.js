const test = require('node:test');
const assert = require('node:assert/strict');
const { matchReportedItem, eligibleMatch } = require('../services/matchingService');

function fakeDatabase(initial = {}) {
  const tables = {
    items: [...(initial.items || [])],
    matches: [...(initial.matches || [])],
    notifications: [...(initial.notifications || [])],
    profiles: [
      { id: 'owner', email: 'owner@campus.example' },
      { id: 'finder', email: 'finder@campus.example' },
      ...(initial.profiles || [])
    ]
  };
  const state = { failAdminAlert: false, rpcError: false };

  class Query {
    constructor(table) {
      this.table = table;
      this.filters = [];
      this.max = Infinity;
      this.start = 0;
      this.mode = 'select';
    }
    select() { return this; }
    eq(key, value) { this.filters.push(row => row[key] === value); return this; }
    in(key, values) { this.filters.push(row => values.includes(row[key])); return this; }
    contains(key, value) {
      this.filters.push(row => Object.entries(value).every(([name, expected]) => row[key]?.[name] === expected));
      return this;
    }
    order() { return this; }
    range(start, end) { this.start = start; this.max = end - start + 1; return this; }
    limit(max) { this.max = max; return this; }
    insert(records) { this.mode = 'insert'; this.records = records; return this; }
    update(values) { this.mode = 'update'; this.values = values; return this; }
    maybeSingle() {
      return Promise.resolve(this.run()).then(result => ({ ...result, data: result.data?.[0] || null }));
    }
    single() {
      return Promise.resolve(this.run()).then(result => ({ ...result, data: result.data?.[0] || null }));
    }
    then(resolve, reject) { return Promise.resolve(this.run()).then(resolve, reject); }
    run() {
      if (this.mode === 'update') {
        const rows = tables[this.table].filter(row => this.filters.every(filter => filter(row)));
        rows.forEach(row => Object.assign(row, this.values));
        return { data: rows, error: null };
      }
      if (this.mode === 'insert') {
        if (this.table === 'notifications' && state.failAdminAlert && this.records[0].user_id === 'admin') {
          return { data: null, error: { message: 'Temporary notification failure' } };
        }
        const inserted = this.records.map(record => ({
          id: `${this.table}-${tables[this.table].length + 1}`,
          ...(this.table === 'matches' ? { status: 'pending' } : {}),
          ...record
        }));
        tables[this.table].push(...inserted);
        return { data: inserted, error: null };
      }
      return {
        data: tables[this.table].filter(row => this.filters.every(filter => filter(row)))
          .slice(this.start, this.start + this.max),
        error: null
      };
    }
  }

  return {
    tables,
    state,
    from(table) { return new Query(table); },
    async rpc() {
      return state.rpcError
        ? { data: null, error: { message: 'Vector function unavailable' } }
        : { data: [{ id: 'found-1', similarity: 0.92 }], error: null };
    }
  };
}

const lost = {
  id: 'lost-1', user_id: 'owner', university_id: 'campus-a', type: 'LOST', status: 'Active',
  title: 'Black Samsung phone', description: 'Samsung Galaxy phone with black case',
  category: 'electronics', location: 'Main Library', date: '2026-10-09'
};
const found = {
  id: 'found-1', user_id: 'finder', university_id: 'campus-a', type: 'FOUND', status: 'Active',
  title: 'Samsung phone black', description: 'Black Samsung Galaxy phone',
  category: 'Electronics - Phones', location: 'Main Library', date: '2026-10-09'
};

test('matches reports and alerts both reporters and university admins once', async () => {
  const db = fakeDatabase({ items: [lost, found], profiles: [{ id: 'admin', email: 'admin@campus.example', role: 'university_admin', university_id: 'campus-a' }] });
  const sent = [];
  const sendEmail = async email => { sent.push(email); return `email-${sent.length}`; };
  const first = await matchReportedItem(db, lost, { textEmbedding: [0.1] }, sendEmail);
  assert.equal(first.status, 'complete');
  assert.equal(first.matchesCreated, 1);
  assert.deepEqual(db.tables.notifications.map(row => row.user_id).sort(), ['admin', 'finder', 'owner']);
  assert.ok(db.tables.notifications.every(row => row.meta_data.match_id === db.tables.matches[0].id));
  assert.deepEqual(sent.map(email => email.to).sort(), [
    'admin@campus.example', 'finder@campus.example', 'owner@campus.example'
  ]);
  assert.ok(db.tables.notifications.every(row => row.meta_data.email_sent_at));

  const retry = await matchReportedItem(db, lost, { textEmbedding: [0.1] }, sendEmail);
  assert.equal(retry.status, 'complete');
  assert.equal(retry.matchesCreated, 0);
  assert.equal(retry.notificationsCreated, 0);
  assert.equal(db.tables.matches.length, 1);
  assert.equal(db.tables.notifications.length, 3);
  assert.equal(sent.length, 3);
});

test('retries a failed admin alert without duplicating the match or reporter alerts', async () => {
  const db = fakeDatabase({ items: [lost, found], profiles: [{ id: 'admin', email: 'admin@campus.example', role: 'university_admin', university_id: 'campus-a' }] });
  db.state.failAdminAlert = true;
  const sent = [];
  const sendEmail = async email => { sent.push(email); return `email-${sent.length}`; };
  const first = await matchReportedItem(db, found, {}, sendEmail);
  assert.equal(first.status, 'partial');
  assert.equal(db.tables.matches.length, 1);
  assert.equal(db.tables.notifications.length, 2);

  db.state.failAdminAlert = false;
  const retry = await matchReportedItem(db, found, {}, sendEmail);
  assert.equal(retry.status, 'complete');
  assert.equal(retry.matchesCreated, 0);
  assert.equal(retry.notificationsCreated, 1);
  assert.deepEqual(db.tables.notifications.map(row => row.user_id).sort(), ['admin', 'finder', 'owner']);
  assert.equal(sent.length, 3);
});

test('simultaneous lost and found submissions create one match and one alert per recipient', async () => {
  const db = fakeDatabase({ items: [lost, found], profiles: [{ id: 'admin', email: 'admin@campus.example', role: 'university_admin', university_id: 'campus-a' }] });
  const sent = [];
  const sendEmail = async email => { sent.push(email); return 'email-id'; };
  await Promise.all([matchReportedItem(db, lost, {}, sendEmail), matchReportedItem(db, found, {}, sendEmail)]);
  assert.equal(db.tables.matches.length, 1);
  assert.equal(db.tables.notifications.length, 3);
  assert.equal(sent.length, 3);
});

test('falls back to report text when vector search is unavailable', async () => {
  const db = fakeDatabase({ items: [lost, found] });
  db.state.rpcError = true;
  const result = await matchReportedItem(db, lost, { textEmbedding: [0.1] }, async () => 'email-id');
  assert.equal(result.status, 'complete');
  assert.equal(result.matchesCreated, 1);
});

test('does not match unrelated reports sharing only category, location and date', () => {
  const unrelated = { ...found, id: 'found-2', title: 'Silver laptop', description: 'Macbook Air' };
  assert.equal(eligibleMatch(lost, unrelated), null);
});

test('keeps the in-app alert and retries email when SMTP fails', async () => {
  const db = fakeDatabase({ items: [lost, found] });
  const first = await matchReportedItem(db, lost, {}, async () => { throw new Error('SMTP unavailable'); });
  assert.equal(first.status, 'partial');
  assert.equal(db.tables.notifications.length, 2);
  assert.ok(db.tables.notifications.every(row => !row.meta_data.email_sent_at));

  const retry = await matchReportedItem(db, lost, {}, async () => 'email-id');
  assert.equal(retry.status, 'complete');
  assert.equal(retry.emailsSent, 2);
  assert.equal(db.tables.notifications.length, 2);
  assert.ok(db.tables.notifications.every(row => row.meta_data.email_sent_at));
});

test('does not match a different university or an inactive report', async () => {
  const db = fakeDatabase({ items: [lost, { ...found, university_id: 'campus-b' }, { ...found, id: 'found-2', status: 'Closed' }] });
  const result = await matchReportedItem(db, lost);
  assert.equal(result.matchesCreated, 0);
  assert.equal(db.tables.notifications.length, 0);
});
