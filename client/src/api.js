const BASE = '/api';

async function request(path, options = {}, adminPassword) {
  const headers = { 'Content-Type': 'application/json' };
  if (adminPassword) headers['x-admin-password'] = adminPassword;
  const res = await fetch(BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const api = {
  getMenu: () => request('/menu'),
  placeOrder: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  trackOrders: (phone) => request('/orders/track?phone=' + encodeURIComponent(phone)),

  adminLogin: (password) => request('/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),
  adminOrders: (pw) => request('/admin/orders', {}, pw),
  setStatus: (id, status, pw) =>
    request(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, pw),
  adminMenu: (pw) => request('/admin/menu', {}, pw),
  addMenu: (item, pw) => request('/admin/menu', { method: 'POST', body: JSON.stringify(item) }, pw),
  toggleMenu: (id, pw) => request(`/admin/menu/${id}/toggle`, { method: 'PATCH' }, pw),
  deleteMenu: (id, pw) => request(`/admin/menu/${id}`, { method: 'DELETE' }, pw),
};
