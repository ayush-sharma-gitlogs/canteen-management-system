# SAU Canteen Management System

Stack: React (Vite) + Node.js + Express + MySQL

```
sau-canteen/
  backend/   -> Express API + MySQL (database/schema.sql)
  client/    -> React frontend
```

## Features
- Customer: view menu, add to cart, place order, pay (demo - no payment gateway), track orders by phone number
- Admin: login, view all orders, mark Preparing / Complete / Cancel, add / hide / delete menu items

## Setup on Windows

### 1. Install
Node.js (LTS) and MySQL Server (with MySQL Workbench or the MySQL command line).

### 2. Create the database
Option A - MySQL Workbench: File > Open SQL Script > select `backend/database/schema.sql` > click the lightning bolt.

Option B - Command Prompt (from the project folder):
```
mysql -u root -p < backend\database\schema.sql
```

### 3. Start the backend
Open `backend\.env` and set `DB_PASSWORD` to your MySQL root password.
```
cd backend
npm install
npm start
```
API runs at http://localhost:5000

### 4. Start the frontend (new terminal)
```
cd client
npm install
npm run dev
```
Open http://localhost:5173

## Admin login
Click the **Admin** tab. Default password: `admin123` (change it in `backend/.env`).

## Notes
- Payment is simulated: UPI/Card orders are marked "paid" instantly, Cash orders stay "pending" until the admin clicks Complete.
- If you change the backend port, update the proxy in `client/vite.config.js`.
