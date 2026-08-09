const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const userCache = new Map([
  ['a011ad53-924e-4f7a-b37a-896f3498565b', { id: 'a011ad53-924e-4f7a-b37a-896f3498565b', name: 'Manu', email: 'manu@paruluniversity.ac.in' }],
  ['2fba72c8-2302-4d16-aaab-bce55c92b19c', { id: '2fba72c8-2302-4d16-aaab-bce55c92b19c', name: 'Jimit', email: 'jimit@paruluniversity.ac.in' }],
  ['04738b5e-be19-4440-b26d-faf838d99a92', { id: '04738b5e-be19-4440-b26d-faf838d99a92', name: 'Parul Admin', email: 'admin@paruluniversity.ac.in' }],
  ['df919690-b99a-4f6a-811c-8bf785a2cbbf', { id: 'df919690-b99a-4f6a-811c-8bf785a2cbbf', name: 'Test User', email: 'test_node_api_4@paruluniversity.ac.in' }]
]);

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;

    let decoded;

    if (jwtSecret) {
      // LOCAL verification — no network call, tolerates ±120s clock skew
      try {
        decoded = jwt.verify(token, Buffer.from(jwtSecret, 'base64'), {
          algorithms: ['HS256'],
          clockTolerance: 120 // allow 2 minutes of clock drift
        });
      } catch (jwtErr) {
        // Fallback to Supabase remote verification silently (or if SUPABASE_JWT_SECRET is wrong)
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          return res.status(401).json({ error: 'Invalid or expired token' });
        }
        decoded = { sub: user.id, email: user.email, user_metadata: user.user_metadata };
      }
    } else {
      // No JWT secret configured — use Supabase remote verification
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      decoded = { sub: user.id, email: user.email, user_metadata: user.user_metadata };
    }

    // Attach user info to request
    const meta = decoded.user_metadata || {};
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: meta.role || 'student',
      university_id: meta.university_id,
      name: meta.name || (decoded.email ? decoded.email.split('@')[0] : 'User')
    };

    if (req.user.id && req.user.name && req.user.name !== 'User') {
      userCache.set(req.user.id, { id: req.user.id, name: req.user.name, email: req.user.email });
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

// RBAC Middleware
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  userCache
};
