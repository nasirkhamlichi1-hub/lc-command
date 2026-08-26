const { corsHeaders, checkAuth, preflight, deny } = require('../_shared/util');

module.exports = async function (context, req) {
  if (preflight(context, req)) return;
  if (!checkAuth(req)) return deny(context, req);
  const token = process.env.MONDAY_TOKEN;
  if (!token) { context.res = { status: 400, headers: corsHeaders(req), body: JSON.stringify({ errors: [{ message: 'MONDAY_TOKEN not set on the backend' }] }) }; return; }
  try {
    const b = req.body || {};
    const r = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token, 'API-Version': '2024-10' },
      body: JSON.stringify({ query: b.query, variables: b.variables || {} }),
    });
    const text = await r.text();
    context.res = { status: r.status, headers: corsHeaders(req), body: text };
  } catch (e) {
    context.res = { status: 502, headers: corsHeaders(req), body: JSON.stringify({ errors: [{ message: 'Monday upstream error: ' + e.message }] }) };
  }
};
