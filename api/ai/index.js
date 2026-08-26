const { corsHeaders, checkAuth, preflight, deny } = require('../_shared/util');

module.exports = async function (context, req) {
  if (preflight(context, req)) return;
  if (!checkAuth(req)) return deny(context, req);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { context.res = { status: 400, headers: corsHeaders(req), body: JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY not set on the backend' } }) }; return; }
  try {
    const b = req.body || {};
    const payload = {
      model: process.env.AI_MODEL || 'claude-sonnet-4-6',
      max_tokens: Math.min(b.max_tokens || 800, 4000),
      messages: b.messages || [],
    };
    if (b.system) payload.system = b.system;
    if (b.tools) payload.tools = b.tools;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(payload),
    });
    const text = await r.text();
    context.res = { status: r.status, headers: corsHeaders(req), body: text };
  } catch (e) {
    context.res = { status: 502, headers: corsHeaders(req), body: JSON.stringify({ error: { message: 'AI upstream error: ' + e.message } }) };
  }
};
