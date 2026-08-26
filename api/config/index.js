const { corsHeaders, checkAuth, preflight, deny } = require('../_shared/util');

module.exports = async function (context, req) {
  if (preflight(context, req)) return;
  if (!checkAuth(req)) return deny(context, req);
  context.res = {
    status: 200,
    headers: corsHeaders(req),
    body: JSON.stringify({
      ok: true,
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      hasAI: !!process.env.ANTHROPIC_API_KEY,
      hasMonday: !!process.env.MONDAY_TOKEN,
      hasState: !!process.env.AZURE_STORAGE_CONNECTION_STRING,
    }),
  };
};
