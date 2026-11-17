import { useState } from 'react';
import Menu from './pages/Menu.jsx';
import MyOrders from './pages/MyOrders.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  const [tab, setTab] = useState('menu');

  return (
    <div>
      <header className="header">
        <h1>🍽️ SAU Canteen</h1>
        <nav>
          <button className={tab === 'menu' ? 'active' : ''} onClick={() => setTab('menu')}>Order Food</button>
          <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>My Orders</button>
          <button className={tab === 'admin' ? 'active' : ''} onClick={() => setTab('admin')}>Admin</button>
        </nav>
      </header>
      <main className="container">
        {tab === 'menu' && <Menu />}
        {tab === 'orders' && <MyOrders />}
        {tab === 'admin' && <Admin />}
      </main>
    </div>
  );
}
