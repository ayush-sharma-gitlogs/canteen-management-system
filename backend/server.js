require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// ---------- helpers ----------
async function attachItems(orders) {
  if (orders.length === 0) return orders;
  const ids = orders.map((o) => o.id);
  const [items] = await pool.query('SELECT * FROM order_items WHERE order_id IN (?)', [ids]);
  return orders.map((o) => ({ ...o, items: items.filter((i) => i.order_id === o.id) }));
}

function adminOnly(req, res, next) {
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ---------- customer routes ----------
app.get('/api/menu', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE available = 1 ORDER BY category, name');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// place order (payment is simulated - no gateway)
app.post('/api/orders', async (req, res) => {
  const { customer_name, phone, payment_method, items } = req.body;
  if (!customer_name || !phone || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Name, phone and at least one item are required' });
  }
  const method = ['cash', 'upi', 'card'].includes(payment_method) ? payment_method : 'cash';
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const ids = items.map((i) => i.id);
    const [menu] = await conn.query('SELECT * FROM menu_items WHERE id IN (?) AND available = 1', [ids]);

    let total = 0;
    const lines = [];
    for (const it of items) {
      const m = menu.find((x) => x.id === it.id);
      const qty = parseInt(it.qty, 10);
      if (!m || !qty || qty < 1) continue;
      total += Number(m.price) * qty;
      lines.push([m.name, m.price, qty]);
    }
    if (lines.length === 0) throw new Error('No valid items');

    // cash = pay at counter (pending), upi/card = simulated online payment (paid)
    const payment_status = method === 'cash' ? 'pending' : 'paid';
    const [result] = await conn.query(
      'INSERT INTO orders (customer_name, phone, total, payment_method, payment_status) VALUES (?,?,?,?,?)',
      [customer_name, phone, total, method, payment_status]
    );
    await conn.query('INSERT INTO order_items (order_id, item_name, price, quantity) VALUES ?', [
      lines.map((l) => [result.insertId, ...l]),
    ]);

    await conn.commit();
    res.status(201).json({ id: result.insertId, total, payment_status });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

// track orders by phone number
app.get('/api/orders/track', async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE phone = ? ORDER BY id DESC', [req.query.phone || '']);
    res.json(await attachItems(orders));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- admin routes ----------
app.post('/api/admin/login', (req, res) => {
  if (req.body.password === process.env.ADMIN_PASSWORD) return res.json({ ok: true });
  res.status(401).json({ error: 'Wrong password' });
});

app.get('/api/admin/orders', adminOnly, async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders ORDER BY id DESC');
    res.json(await attachItems(orders));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/admin/orders/:id/status', adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'preparing', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    // completing an order also marks cash payment as received
    if (status === 'completed') {
      await pool.query("UPDATE orders SET status = ?, payment_status = 'paid' WHERE id = ?", [status, req.params.id]);
    } else {
      await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/menu', adminOnly, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM menu_items ORDER BY category, name');
  res.json(rows);
});

app.post('/api/admin/menu', adminOnly, async (req, res) => {
  const { name, category, price } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
  await pool.query('INSERT INTO menu_items (name, category, price) VALUES (?,?,?)', [name, category || 'Snacks', price]);
  res.status(201).json({ ok: true });
});

app.patch('/api/admin/menu/:id/toggle', adminOnly, async (req, res) => {
  await pool.query('UPDATE menu_items SET available = NOT available WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

app.delete('/api/admin/menu/:id', adminOnly, async (req, res) => {
  await pool.query('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SAU Canteen API running on http://localhost:${PORT}`));
