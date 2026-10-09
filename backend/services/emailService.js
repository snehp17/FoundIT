const nodemailer = require('nodemailer');

async function sendMatchEmail({ to, matchId }, createTransport = nodemailer.createTransport) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, FRONTEND_URL } = process.env;
  const port = Number(SMTP_PORT);
  if (!SMTP_HOST || !Number.isInteger(port) || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM || !FRONTEND_URL) {
    throw new Error('SMTP match alerts are not configured');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to || '')) {
    throw new Error('Recipient has no valid email address');
  }

  const transporter = createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
  const url = `${FRONTEND_URL.replace(/\/$/, '')}/matches?matchId=${encodeURIComponent(matchId)}`;
  const result = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: 'FoundIT: possible match for a reported item',
    text: `A possible match has been found for a lost and found report at your university.\n\nSign in to FoundIT to review it: ${url}\n\nThis is a potential match, so please review the report details before taking action.`
  });
  if (!result.accepted?.includes(to)) {
    throw new Error('SMTP server did not accept the recipient');
  }
  return result.messageId;
}

async function sendChatMessageEmail({ to, senderName, peerId }, createTransport = nodemailer.createTransport) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, FRONTEND_URL } = process.env;
  const port = Number(SMTP_PORT);
  if (!SMTP_HOST || !Number.isInteger(port) || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM || !FRONTEND_URL) {
    throw new Error('SMTP match alerts are not configured');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to || '')) {
    throw new Error('Recipient has no valid email address');
  }

  const transporter = createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
  const url = `${FRONTEND_URL.replace(/\/$/, '')}/chat?peerId=${encodeURIComponent(peerId)}&peerName=${encodeURIComponent(senderName)}`;
  const result = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: `FoundIT: New Secure Message from ${senderName}`,
    text: `You have received a new secure message from ${senderName} on FoundIT.\n\nSign in to FoundIT to reply: ${url}`
  });
  if (!result.accepted?.includes(to)) {
    throw new Error('SMTP server did not accept the recipient');
  }
  return result.messageId;
}

module.exports = { sendMatchEmail, sendChatMessageEmail };
