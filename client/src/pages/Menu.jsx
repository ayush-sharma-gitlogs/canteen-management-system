import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Menu() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({}); // { itemId: qty }
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(localStorage.getItem('phone') || '');
  const [method, setMethod] = useState('cash');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMenu().then(setMenu).catch((e) => setError(e.message));
  }, []);

  const change = (id, delta) =>
    setCart((c) => {
      const qty = Math.max(0, (c[id] || 0) + delta);
      const next = { ...c, [id]: qty };
      if (qty === 0) delete next[id];
      return next;
    });

  const cartItems = menu.filter((m) => cart[m.id]);
  const total = cartItems.reduce((sum, m) => sum + Number(m.price) * cart[m.id], 0);
  const categories = [...new Set(menu.map((m) => m.category))];

  const submit = async () => {
    setError('');
    setMessage('');
    if (!name.trim() || !phone.trim()) return setError('Please enter your name and phone number');
    if (cartItems.length === 0) return setError('Your cart is empty');
    try {
      const items = cartItems.map((m) => ({ id: m.id, qty: cart[m.id] }));
      const res = await api.placeOrder({ customer_name: name, phone, payment_method: method, items });
      localStorage.setItem('phone', phone);
      setMessage(
        `Order #${res.id} placed! Total ₹${res.total}. ` +
          (res.payment_status === 'paid' ? 'Payment successful.' : 'Please pay cash at the counter.')
      );
      setCart({});
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="grid">
      <section>
        <h2>Menu</h2>
        {categories.map((cat) => (
          <div key={cat}>
            <h3 className="cat">{cat}</h3>
            {menu.filter((m) => m.category === cat).map((m) => (
              <div className="card row" key={m.id}>
                <div>
                  <strong>{m.name}</strong>
                  <div className="muted">₹{m.price}</div>
                </div>
                <div className="qty">
                  <button onClick={() => change(m.id, -1)}>−</button>
                  <span>{cart[m.id] || 0}</span>
                  <button onClick={() => change(m.id, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>

      <aside className="card cart">
        <h2>Your Order</h2>
        {cartItems.length === 0 && <p className="muted">No items added yet.</p>}
        {cartItems.map((m) => (
          <div className="row" key={m.id}>
            <span>{m.name} × {cart[m.id]}</span>
            <span>₹{(Number(m.price) * cart[m.id]).toFixed(2)}</span>
          </div>
        ))}
        <hr />
        <div className="row"><strong>Total</strong><strong>₹{total.toFixed(2)}</strong></div>

        <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="cash">Cash (pay at counter)</option>
          <option value="upi">UPI (demo payment)</option>
          <option value="card">Card (demo payment)</option>
        </select>

        <button className="primary" onClick={submit}>
          {method === 'cash' ? 'Place Order' : `Pay ₹${total.toFixed(2)} & Place Order`}
        </button>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
      </aside>
    </div>
  );
}
