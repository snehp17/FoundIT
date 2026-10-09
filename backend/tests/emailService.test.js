const test = require('node:test');
const assert = require('node:assert/strict');
const { sendMatchEmail } = require('../services/emailService');

test('sends a private match link through the configured SMTP server', async () => {
  const settings = {
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: '465',
    SMTP_USER: 'foundit@example.com',
    SMTP_PASSWORD: 'test-only-password',
    SMTP_FROM: 'FoundIT <foundit@example.com>',
    FRONTEND_URL: 'https://example.com/'
  };
  const original = Object.fromEntries(Object.keys(settings).map(key => [key, process.env[key]]));
  Object.assign(process.env, settings);
  let transportOptions;
  let message;
  try {
    const messageId = await sendMatchEmail(
      { to: 'owner@example.com', matchId: 'match-1' },
      options => {
        transportOptions = options;
        return { sendMail: async mail => {
          message = mail;
          return { accepted: ['owner@example.com'], messageId: 'smtp-message-1' };
        } };
      }
    );
    assert.equal(messageId, 'smtp-message-1');
    assert.equal(transportOptions.host, 'smtp.gmail.com');
    assert.equal(transportOptions.port, 465);
    assert.equal(transportOptions.secure, true);
    assert.equal(message.to, 'owner@example.com');
    assert.match(message.text, /https:\/\/example\.com\/matches\?matchId=match-1/);
    assert.equal(message.html, undefined);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
