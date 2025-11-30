require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

const PAYPAL_CLIENT = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || '';
const PAYPAL_BASE = (process.env.PAYPAL_ENV === 'live') ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

if (!PAYPAL_CLIENT || !PAYPAL_SECRET) {
  console.warn('Warning: PAYPAL_CLIENT_ID or PAYPAL_SECRET not set. Server endpoints will fail without them. See server/.env.example');
}

// Obtener access token
async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT}:${PAYPAL_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('Failed to get access token: ' + text);
  }
  const data = await res.json();
  return data.access_token;
}

// Crear orden (server-side)
app.post('/api/create-order', async (req, res) => {
  try {
    const { total, currency = 'USD', items = [] } = req.body || {};
    if (!total) return res.status(400).json({ error: 'total is required in body' });

    const token = await getAccessToken();

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: String(Number(total).toFixed(2))
          },
          items: (items || []).map(it => ({
            name: it.name || it.nombre || 'item',
            unit_amount: { currency_code: currency, value: String(Number((it.unit_amount || it.precio || it.price || 0)).toFixed(2)) },
            quantity: String(it.quantity || it.cantidad || 1)
          }))
        }
      ]
    };

    const createRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderPayload)
    });

    const createJson = await createRes.json();
    if (!createRes.ok) return res.status(createRes.status).json(createJson);
    return res.json(createJson);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Capturar orden (server-side)
app.post('/api/capture-order', async (req, res) => {
  try {
    const { orderID } = req.body || {};
    if (!orderID) return res.status(400).json({ error: 'orderID is required' });

    const token = await getAccessToken();

    const capRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const capJson = await capRes.json();
    if (!capRes.ok) return res.status(capRes.status).json(capJson);
    return res.json(capJson);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Pasteleria1000 PayPal example server running.'));

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
