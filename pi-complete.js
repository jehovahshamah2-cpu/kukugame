/**
 * Vercel Serverless Function: pi-complete
 * POST /api/pi-complete
 * Body: { paymentId: string, txid: string }
 *
 * Requires env var: PI_NETWORK_API_KEY
 * Set in Vercel: Project Settings → Environment Variables
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method Not Allowed' });

  const PI_KEY = process.env.PI_NETWORK_API_KEY;
  if (!PI_KEY) {
    console.error('[pi-complete] PI_NETWORK_API_KEY not set');
    return res.status(500).json({ error: 'PI_NETWORK_API_KEY not configured' });
  }

  const { paymentId, txid } = req.body || {};
  if (!paymentId || !txid) return res.status(400).json({ error: 'paymentId and txid required' });

  console.log('[pi-complete] Completing:', paymentId, 'txid:', txid);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const piRes = await fetch(
        `https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/complete`,
        {
          method:  'POST',
          headers: {
            'Authorization': `Key ${PI_KEY}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({ txid }),
        }
      );
      const text = await piRes.text();
      console.log(`[pi-complete] attempt ${attempt} → ${piRes.status}:`, text);
      if (piRes.ok) return res.status(200).send(text);
      if (attempt < 3) await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.warn(`[pi-complete] attempt ${attempt} error:`, err.message);
      if (attempt < 3) await new Promise(r => setTimeout(r, 2000));
    }
  }

  return res.status(502).json({ error: 'Completion failed after 3 attempts' });
}
