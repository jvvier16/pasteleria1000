
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken')
const cors = require('cors')
const { query, run, get, ready } = require('./db')
const app = express();
const port = process.env.PORT || 3000;

// If BACKEND_API_URL is set, forward data requests to the Java backend
const BACKEND_API = process.env.BACKEND_API_URL || ''
const useBackend = Boolean(BACKEND_API)

async function forwardToBackend(path, req) {
  const url = `${BACKEND_API}${path}`
  const options = { method: req.method, headers: {} }
  // copy headers except host
  Object.keys(req.headers || {}).forEach(h => { if (h !== 'host') options.headers[h] = req.headers[h] })
  if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
    options.body = JSON.stringify(req.body)
    options.headers['content-type'] = 'application/json'
  }
  const res = await fetch(url, options)
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    // If backend uses ApiResponse wrapper, extract .data
    if (json && Object.prototype.hasOwnProperty.call(json, 'data')) {
      return { status: json.status || res.status, body: json.data }
    }
    return { status: res.status, body: json }
  } catch (e) {
    // not JSON
    return { status: res.status, body: text }
  }
}

app.use(cors())
app.use(express.json());

const PAYPAL_CLIENT = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_SECRET = process.env.PAYPAL_SECRET || '';
const PAYPAL_BASE = (process.env.PAYPAL_ENV === 'live') ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

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

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }))

// ---------- Usuarios CRUD & auth ----------
app.get('/api/usuarios', async (req, res) => {
  try {
    if (useBackend) {
      const r = await forwardToBackend('/api/v2/usuarios', req)
      return res.status(r.status).json(r.body)
    }
    const rows = await query('SELECT id, nombre, apellido, correo, role, fechaNacimiento, direccion, imagen, createdAt, updatedAt FROM usuarios')
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (useBackend) {
      const r = await forwardToBackend(`/api/v2/usuarios/${id}`, req)
      return res.status(r.status).json(r.body)
    }
    const row = await get('SELECT id, nombre, apellido, correo, role, fechaNacimiento, direccion, imagen, createdAt, updatedAt FROM usuarios WHERE id = ?', [id])
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json(row)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/usuarios', async (req, res) => {
  try {
    if (useBackend) {
      const r = await forwardToBackend('/api/v2/usuarios', req)
      return res.status(r.status).json(r.body)
    }
    const { nombre, apellido, correo, contrasena, role = 'user', fechaNacimiento = null, direccion = null, imagen = null } = req.body || {}
    if (!correo || !contrasena || !nombre) return res.status(400).json({ error: 'nombre, correo y contrasena son requeridos' })
    const result = await run('INSERT INTO usuarios (nombre, apellido, correo, contrasena, role, fechaNacimiento, direccion, imagen) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [nombre, apellido || null, correo, contrasena, role, fechaNacimiento, direccion, imagen])
    const created = await get('SELECT id, nombre, apellido, correo, role, fechaNacimiento, direccion, imagen, createdAt, updatedAt FROM usuarios WHERE id = ?', [result.id])
    res.status(201).json(created)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const changes = req.body || {}
    // build dynamic update
    const keys = Object.keys(changes).filter(k => ['nombre','apellido','correo','contrasena','role','fechaNacimiento','direccion','imagen'].includes(k))
    if (!keys.length) return res.status(400).json({ error: 'No valid fields to update' })
    if (useBackend) {
      const r = await forwardToBackend(`/api/v2/usuarios/${id}`, req)
      return res.status(r.status).json(r.body)
    }
    const sets = keys.map(k => `${k} = ?`).join(', ')
    const vals = keys.map(k => changes[k])
    vals.push(id)
    await run(`UPDATE usuarios SET ${sets}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, vals)
    const updated = await get('SELECT id, nombre, apellido, correo, role, fechaNacimiento, direccion, imagen, createdAt, updatedAt FROM usuarios WHERE id = ?', [id])
    res.json(updated)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (useBackend) {
      const r = await forwardToBackend(`/api/v2/usuarios/${id}`, req)
      return res.status(r.status).json(r.body)
    }
    await run('DELETE FROM usuarios WHERE id = ?', [id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Simple login endpoint (plaintext password check for example only)
app.post('/api/usuarios/login', async (req, res) => {
  try {
    if (useBackend) {
      // backend expects { correo, contrasena }
      const payload = { correo: req.body.userOrEmail || req.body.correo, contrasena: req.body.password || req.body.contrasena }
      // build a fake req object for forwardToBackend
      const fakeReq = { method: 'POST', headers: req.headers, body: payload }
      const r = await forwardToBackend('/api/v2/auth/login', fakeReq)
      return res.status(r.status).json(r.body)
    }
    const { userOrEmail, password } = req.body || {}
    if (!userOrEmail || !password) return res.status(400).json({ error: 'userOrEmail and password required' })
    const rows = await query('SELECT id, nombre, apellido, correo, contrasena, role, imagen FROM usuarios WHERE correo = ? OR id = ?', [userOrEmail, isNaN(Number(userOrEmail)) ? -1 : Number(userOrEmail)])
    const user = rows && rows.length ? rows[0] : null
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    if (user.contrasena !== password) return res.status(401).json({ error: 'Invalid credentials' })
    // remove password before returning
    const safeUser = { id: user.id, nombre: user.nombre, apellido: user.apellido, correo: user.correo, role: user.role, imagen: user.imagen }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: safeUser })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ---------- Auth middleware ----------
function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ error: 'No token' })
    const parts = auth.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid token format' })
    const token = parts[1]
    // If using backend, decode token without verifying signature (backend issued it)
    // Otherwise, verify with local JWT_SECRET
    if (useBackend) {
      // Decode without verification for backend-issued tokens
      const payload = jwt.decode(token)
      if (!payload) return res.status(401).json({ error: 'Invalid token' })
      req.user = payload
    } else {
      // Verify signature for locally-issued tokens
      const payload = jwt.verify(token, JWT_SECRET)
      req.user = payload
    }
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// ---------- Cart endpoints (per-user) ----------
app.get('/api/cart', authenticate, async (req, res) => {
  try {
    const userId = Number(req.user.id)
    if (useBackend) {
      const r = await forwardToBackend(`/api/v2/carritos/user/${userId}`, req)
      return res.status(r.status).json(r.body)
    }
    const row = await get('SELECT items FROM carritos WHERE userId = ?', [userId])
    if (!row) return res.json({ items: [] })
    const items = JSON.parse(row.items || '[]')
    res.json({ items })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/cart', authenticate, async (req, res) => {
  try {
    const userId = Number(req.user.id)
    const { items = [] } = req.body || {}
    if (useBackend) {
      const r = await forwardToBackend('/api/v2/carritos', req)
      return res.status(r.status).json(r.body)
    }
    const existing = await get('SELECT id FROM carritos WHERE userId = ?', [userId])
    if (existing) {
      await run('UPDATE carritos SET items = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?', [JSON.stringify(items), userId])
    } else {
      await run('INSERT INTO carritos (userId, items) VALUES (?, ?)', [userId, JSON.stringify(items)])
    }
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/cart', authenticate, async (req, res) => {
  try {
    const userId = Number(req.user.id)
    if (useBackend) {
      const r = await forwardToBackend(`/api/v2/carritos/user/${userId}`, req)
      return res.status(r.status).json(r.body)
    }
    await run('DELETE FROM carritos WHERE userId = ?', [userId])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ---------- Pasteles CRUD ----------
app.get('/api/pasteles', async (req, res) => {
  try {
    if (useBackend) {
      const r = await forwardToBackend('/api/v2/productos', req)
      return res.status(r.status).json(r.body)
    }
    const rows = await query('SELECT id, nombre, descripcion, precio, stock, stockCritico, categoria, imagen, createdAt, updatedAt FROM pasteles')
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/pasteles/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (useBackend) {
      const r = await forwardToBackend(`/api/v2/productos/${id}`, req)
      return res.status(r.status).json(r.body)
    }
    const row = await get('SELECT id, nombre, descripcion, precio, stock, stockCritico, categoria, imagen, createdAt, updatedAt FROM pasteles WHERE id = ?', [id])
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json(row)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/pasteles', async (req, res) => {
  try {
    if (useBackend) {
      const r = await forwardToBackend('/api/v2/productos', req)
      return res.status(r.status).json(r.body)
    }
    const { nombre, descripcion = null, precio = 0, stock = 0, stockCritico = 5, categoria = null, imagen = null } = req.body || {}
    if (!nombre) return res.status(400).json({ error: 'nombre is required' })
    const result = await run('INSERT INTO pasteles (nombre, descripcion, precio, stock, stockCritico, categoria, imagen) VALUES (?, ?, ?, ?, ?, ?, ?)', [nombre, descripcion, precio, stock, stockCritico, categoria, imagen])
    const created = await get('SELECT id, nombre, descripcion, precio, stock, stockCritico, categoria, imagen, createdAt, updatedAt FROM pasteles WHERE id = ?', [result.id])
    res.status(201).json(created)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.put('/api/pasteles/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const changes = req.body || {}
    const keys = Object.keys(changes).filter(k => ['nombre','descripcion','precio','stock','stockCritico','categoria','imagen'].includes(k))
    if (!keys.length) return res.status(400).json({ error: 'No valid fields to update' })
    const sets = keys.map(k => `${k} = ?`).join(', ')
    const vals = keys.map(k => changes[k])
    vals.push(id)
    if (useBackend) {
      const r = await forwardToBackend(`/api/v2/productos/${id}`, req)
      return res.status(r.status).json(r.body)
    }
    await run(`UPDATE pasteles SET ${sets}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, vals)
    const updated = await get('SELECT id, nombre, descripcion, precio, stock, stockCritico, categoria, imagen, createdAt, updatedAt FROM pasteles WHERE id = ?', [id])
    res.json(updated)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.delete('/api/pasteles/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (useBackend) {
      const r = await forwardToBackend(`/api/v2/productos/${id}`, req)
      return res.status(r.status).json(r.body)
    }
    await run('DELETE FROM pasteles WHERE id = ?', [id])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ---------- Pedidos ----------
app.get('/api/pedidos', async (req, res) => {
  try {
    if (useBackend) {
      const r = await forwardToBackend('/api/v2/pedidos', req)
      return res.status(r.status).json(r.body)
    }
    const rows = await query('SELECT * FROM pedidos')
    // parse items
    const mapped = rows.map(r => ({ ...r, items: JSON.parse(r.items || '[]') }))
    res.json(mapped)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/pedidos/user/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId)
    if (useBackend) {
      const r = await forwardToBackend(`/api/v2/pedidos/user/${userId}`, req)
      return res.status(r.status).json(r.body)
    }
    const rows = await query('SELECT * FROM pedidos WHERE userId = ?', [userId])
    const mapped = rows.map(r => ({ ...r, items: JSON.parse(r.items || '[]') }))
    res.json(mapped)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/pedidos', async (req, res) => {
  try {
    if (useBackend) {
      const r = await forwardToBackend('/api/v2/pedidos', req)
      return res.status(r.status).json(r.body)
    }
    const { userId, items = [], total = 0, status = 'pendiente', paymentMethod = null, paypalOrderId = null } = req.body || {}
    if (!userId) return res.status(400).json({ error: 'userId required' })
    const itemsStr = JSON.stringify(items)
    const result = await run('INSERT INTO pedidos (userId, items, total, status, paymentMethod, paypalOrderId) VALUES (?, ?, ?, ?, ?, ?)', [userId, itemsStr, total, status, paymentMethod, paypalOrderId])
    const created = await get('SELECT * FROM pedidos WHERE id = ?', [result.id])
    const out = { ...created, items: JSON.parse(created.items || '[]') }
    res.status(201).json(out)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

;(async () => {
  try {
    await ready
    app.listen(port, () => console.log(`Server listening on http://localhost:${port}`))
  } catch (err) {
    console.error('La base de datos no está lista:', err)
    process.exit(1)
  }
})()
