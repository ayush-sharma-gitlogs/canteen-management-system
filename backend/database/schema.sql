-- SAU Canteen Management System - MySQL schema
CREATE DATABASE IF NOT EXISTS sau_canteen;
USE sau_canteen;

CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'Snacks',
  price DECIMAL(8,2) NOT NULL,
  available TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash','upi','card') NOT NULL DEFAULT 'cash',
  payment_status ENUM('pending','paid') NOT NULL DEFAULT 'pending',
  status ENUM('pending','preparing','completed','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  quantity INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

INSERT INTO menu_items (name, category, price) VALUES
('Samosa', 'Snacks', 15.00),
('Veg Sandwich', 'Snacks', 40.00),
('Paneer Roll', 'Snacks', 60.00),
('Chole Bhature', 'Meals', 70.00),
('Veg Thali', 'Meals', 90.00),
('Fried Rice', 'Meals', 80.00),
('Tea', 'Drinks', 10.00),
('Cold Coffee', 'Drinks', 40.00),
('Lassi', 'Drinks', 30.00);
