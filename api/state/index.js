const { corsHeaders, checkAuth, preflight, deny } = require('../_shared/util');

module.exports = async function (context, req) {
  if (preflight(context, req)) return;
  if (!checkAuth(req)) return deny(context, req);
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const headers = corsHeaders(req);
  if (!conn) {
    context.res = { status: 200, headers, body: JSON.stringify(req.method === 'GET' ? { state: null, storage: false } : { ok: false, storage: false }) };
    return;
  }
  try {
    const { BlobServiceClient } = require('@azure/storage-blob');
    const svc = BlobServiceClient.fromConnectionString(conn);
    const container = svc.getContainerClient('lccommand');
    await container.createIfNotExists();
    const blob = container.getBlockBlobClient('state.json');

    if (req.method === 'GET') {
      let state = null;
      try {
        const dl = await blob.download();
        const chunks = [];
        for await (const c of dl.readableStreamBody) chunks.push(c);
        state = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch (e) { /* not created yet */ }
      context.res = { status: 200, headers, body: JSON.stringify({ state, storage: true }) };
    } else {
      const body = JSON.stringify({ ...(req.body || {}), updatedAt: new Date().toISOString() });
      await blob.upload(body, Buffer.byteLength(body), { blobHTTPHeaders: { blobContentType: 'application/json' } });
      context.res = { status: 200, headers, body: JSON.stringify({ ok: true, storage: true }) };
    }
  } catch (e) {
    context.res = { status: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
