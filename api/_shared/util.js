const crypto = require('crypto');

// Origins allowed to call this API (GitHub Pages + the SWA's own origin)
const EXTRA_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://nasirkhamlichi1-hub.github.io').split(',');

function corsHeaders(req) {
  const origin = req.headers?.origin || '';
  const allowed = EXTRA_ORIGINS.includes(origin) || /\.azurestaticapps\.net$/.test(new URL(origin || 'http://x').hostname || '');
  return {
    'Content-Type': 'application/json',
    ...(allowed ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'content-type,x-lc-auth',
      'Vary': 'Origin',
    } : {}),
  };
}

// Auth: the client sends the access code; we compare its SHA-256 to ACCESS_CODE_HASH
function checkAuth(req) {
  const code = req.headers?.['x-lc-auth'] || '';
  const want = (process.env.ACCESS_CODE_HASH || '').toLowerCase();
  if (!want) return false; // backend not configured — deny
  const got = crypto.createHash('sha256').update(code).digest('hex');
  return got === want;
}

function preflight(context, req) {
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: corsHeaders(req) };
    return true;
  }
  return false;
}

function deny(context, req) {
  context.res = { status: 401, headers: corsHeaders(req), body: JSON.stringify({ error: 'unauthorised' }) };
}

module.exports = { corsHeaders, checkAuth, preflight, deny };
