/**
 * Netlify Function: pi-complete
 * POST /.netlify/functions/pi-complete
 * Body: { paymentId: string, txid: string }
 */
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const PI_KEY = process.env.PI_NETWORK_API_KEY;
  if (!PI_KEY) {
    console.error('[pi-complete] PI_NETWORK_API_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'PI_NETWORK_API_KEY not configured' }) };
  }

  let paymentId, txid;
  try {
    const body = JSON.parse(event.body || '{}');
    paymentId = body.paymentId;
    txid = body.txid;
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!paymentId || !txid) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'paymentId and txid required' }) };
  }

  console.log('[pi-complete] Completing payment:', paymentId, 'txid:', txid);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(
      `https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/complete`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Key ${PI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    const text = await res.text();
    console.log('[pi-complete] Pi API response:', res.status, text);

    if (!res.ok) {
      return { statusCode: res.status, headers, body: JSON.stringify({ error: text }) };
    }

    return { statusCode: 200, headers, body: text };

  } catch (err) {
    console.error('[pi-complete] Error:', err.message);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
