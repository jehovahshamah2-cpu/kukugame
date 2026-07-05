/**
 * Netlify Function: pi-approve
 * POST /.netlify/functions/pi-approve
 * Body: { paymentId: string }
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
    console.error('[pi-approve] PI_NETWORK_API_KEY is not set');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'PI_NETWORK_API_KEY not configured' }) };
  }

  let paymentId;
  try {
    const body = JSON.parse(event.body || '{}');
    paymentId = body.paymentId;
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!paymentId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'paymentId required' }) };
  }

  console.log('[pi-approve] Approving payment:', paymentId);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

    const res = await fetch(
      `https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/approve`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Key ${PI_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    const text = await res.text();
    console.log('[pi-approve] Pi API response:', res.status, text);

    if (!res.ok) {
      return { statusCode: res.status, headers, body: JSON.stringify({ error: text }) };
    }

    return { statusCode: 200, headers, body: text };

  } catch (err) {
    console.error('[pi-approve] Error:', err.message);
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
