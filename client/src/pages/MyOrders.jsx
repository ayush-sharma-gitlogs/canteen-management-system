import { useState } from 'react';
import { api } from '../api.js';

export default function MyOrders() {
  const [phone, setPhone] = useState(localStorage.getItem('phone') || '');
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  const search = async () => {
    setError('');
    try {
      setOrders(await api.trackOrders(phone));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h2>Track My Orders</h2>
      <div className="inline">
        <input placeholder="Enter your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button className="primary" onClick={search}>Search</button>
      </div>
      {error && <p className="error">{error}</p>}
      {orders && orders.length === 0 && <p className="muted">No orders found.</p>}
      {orders && orders.map((o) => (
        <div className="card" key={o.id}>
          <div className="row">
            <strong>Order #{o.id}</strong>
            <span className={`badge ${o.status}`}>{o.status}</span>
          </div>
          <ul>
            {o.items.map((i) => <li key={i.id}>{i.item_name} × {i.quantity}</li>)}
          </ul>
          <div className="row">
            <span>₹{o.total} ({o.payment_method}, {o.payment_status})</span>
            <span className="muted">{new Date(o.created_at).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
