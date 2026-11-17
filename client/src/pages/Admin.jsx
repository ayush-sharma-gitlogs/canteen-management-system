import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

export default function Admin() {
  const [pw, setPw] = useState(sessionStorage.getItem('adminPw') || '');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState('orders');

  const login = async () => {
    try {
      await api.adminLogin(input);
      sessionStorage.setItem('adminPw', input);
      setPw(input);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('adminPw');
    setPw('');
  };

  if (!pw) {
    return (
      <div className="card login">
        <h2>Admin Login</h2>
        <input type="password" placeholder="Password" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="primary" onClick={login}>Login</button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="row">
        <div className="inline">
          <button className={view === 'orders' ? 'active-tab' : ''} onClick={() => setView('orders')}>Orders</button>
          <button className={view === 'menu' ? 'active-tab' : ''} onClick={() => setView('menu')}>Manage Menu</button>
        </div>
        <button onClick={logout}>Logout</button>
      </div>
      {view === 'orders' ? <Orders pw={pw} onAuthFail={logout} /> : <MenuManager pw={pw} />}
    </div>
  );
}

function Orders({ pw, onAuthFail }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');

  const load = useCallback(() => {
    api.adminOrders(pw).then(setOrders).catch(onAuthFail);
  }, [pw, onAuthFail]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000); // auto refresh every 10s
    return () => clearInterval(t);
  }, [load]);

  const update = async (id, status) => {
    await api.setStatus(id, status, pw);
    load();
  };

  const shown = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <h2>Orders</h2>
      <div className="inline">
        {['all', 'pending', 'preparing', 'completed', 'cancelled'].map((f) => (
          <button key={f} className={filter === f ? 'active-tab' : ''} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      {shown.length === 0 && <p className="muted">No orders.</p>}
      {shown.map((o) => (
        <div className="card" key={o.id}>
          <div className="row">
            <strong>#{o.id} — {o.customer_name} ({o.phone})</strong>
            <span className={`badge ${o.status}`}>{o.status}</span>
          </div>
          <ul>
            {o.items.map((i) => <li key={i.id}>{i.item_name} × {i.quantity}</li>)}
          </ul>
          <div className="row">
            <span>₹{o.total} — {o.payment_method} ({o.payment_status})</span>
            <span className="muted">{new Date(o.created_at).toLocaleString()}</span>
          </div>
          {(o.status === 'pending' || o.status === 'preparing') && (
            <div className="inline actions">
              {o.status === 'pending' && <button onClick={() => update(o.id, 'preparing')}>Preparing</button>}
              <button className="primary" onClick={() => update(o.id, 'completed')}>Complete</button>
              <button className="danger" onClick={() => update(o.id, 'cancelled')}>Cancel</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MenuManager({ pw }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', category: 'Snacks', price: '' });

  const load = () => api.adminMenu(pw).then(setItems);
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.name || !form.price) return;
    await api.addMenu(form, pw);
    setForm({ name: '', category: 'Snacks', price: '' });
    load();
  };

  return (
    <div>
      <h2>Manage Menu</h2>
      <div className="inline">
        <input placeholder="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option>Snacks</option><option>Meals</option><option>Drinks</option>
        </select>
        <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <button className="primary" onClick={add}>Add</button>
      </div>
      {items.map((m) => (
        <div className="card row" key={m.id}>
          <span>{m.name} — ₹{m.price} <span className="muted">({m.category})</span></span>
          <div className="inline">
            <button onClick={() => api.toggleMenu(m.id, pw).then(load)}>{m.available ? 'Available' : 'Unavailable'}</button>
            <button className="danger" onClick={() => api.deleteMenu(m.id, pw).then(load)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
