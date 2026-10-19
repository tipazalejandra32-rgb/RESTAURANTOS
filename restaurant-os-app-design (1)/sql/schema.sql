-- =============================================================================
-- RestaurantOS — esquema MySQL alineado con la app Next.js (API /api/restaurant)
-- Base: restaurante-facturacion-si
-- Aplicar: npm run db:init   (lee .env.local o variables MYSQL_*)
--
-- MySQL Workbench: abre este archivo, pulsa Ctrl+A (seleccionar todo) y luego
-- el rayo ⚡ "Execute" para ejecutar TODO el script. Si solo ejecutas una línea,
-- las tablas no se crean y SHOW TABLES quedará vacío.
-- =============================================================================
-- Tablas y uso en la aplicación:
--   menu_items         → Módulo Admin (menú) + ítems en pedidos y facturas
--   restaurant_tables  → Mesero (mesas) + Admin (activar/desactivar) + Caja
--   users              → Admin (usuarios); mesero por defecto en sesión (cliente)
--   orders             → Mesero (nuevos pedidos), Cocina (estados), Caja
--   order_items        → Líneas de cada pedido (cantidad, observaciones)
--   invoices           → Caja (cerrar cuenta / IVA / total)
--   invoice_items      → Líneas facturadas (copia de líneas del pedido)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `restaurante-facturacion-si`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `restaurante-facturacion-si`;

DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS restaurant_tables;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS menu_items;

CREATE TABLE menu_items (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price INT NOT NULL,
  category ENUM('entradas', 'principales', 'bebidas', 'postres') NOT NULL,
  image VARCHAR(512) NULL,
  available TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE restaurant_tables (
  number INT NOT NULL PRIMARY KEY,
  status ENUM('disponible', 'ocupada') NOT NULL DEFAULT 'disponible',
  current_order_id VARCHAR(64) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE users (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role ENUM('mesero', 'cocinero', 'cajero', 'administrador') NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE orders (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  table_number INT NOT NULL,
  status ENUM('pendiente', 'en-cocina', 'listo', 'entregado', 'pagado') NOT NULL,
  created_at DATETIME(3) NOT NULL,
  waiter_name VARCHAR(255) NOT NULL,
  total INT NOT NULL,
  INDEX idx_orders_table (table_number),
  INDEX idx_orders_status (status)
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  menu_item_id VARCHAR(32) NOT NULL,
  quantity INT NOT NULL,
  observations VARCHAR(512) NULL,
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB;

CREATE TABLE invoices (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  table_number INT NOT NULL,
  subtotal INT NOT NULL,
  iva INT NOT NULL,
  total INT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  restaurant_name VARCHAR(255) NOT NULL,
  INDEX idx_invoices_order (order_id)
) ENGINE=InnoDB;

CREATE TABLE invoice_items (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  invoice_id VARCHAR(32) NOT NULL,
  menu_item_id VARCHAR(32) NOT NULL,
  quantity INT NOT NULL,
  observations VARCHAR(512) NULL,
  INDEX idx_invoice_items_invoice (invoice_id)
) ENGINE=InnoDB;

-- Menú inicial (mismo catálogo que el prototipo)
INSERT INTO menu_items (id, name, description, price, category, available) VALUES
('1', 'Empanadas de Carne', 'Crujientes empanadas rellenas de carne molida sazonada', 8000, 'entradas', 1),
('2', 'Patacones con Hogao', 'Plátano verde frito con salsa criolla casera', 12000, 'entradas', 1),
('3', 'Arepas con Queso', 'Arepas de maíz asadas con queso fundido', 7000, 'entradas', 1),
('4', 'Ceviche de Camarón', 'Camarones frescos marinados en limón con cilantro', 22000, 'entradas', 1),
('5', 'Bandeja Paisa', 'Arroz, frijoles, chicharrón, carne molida, chorizo, huevo, aguacate y arepa', 35000, 'principales', 1),
('6', 'Sancocho de Gallina', 'Tradicional sopa con gallina, papa, yuca y mazorca', 28000, 'principales', 1),
('7', 'Ajiaco Santafereño', 'Sopa bogotana con pollo, papa criolla, guascas y crema', 26000, 'principales', 1),
('8', 'Lomo de Res al Grill', 'Jugoso lomo de res a la parrilla con chimichurri', 42000, 'principales', 1),
('9', 'Mojarra Frita', 'Mojarra fresca frita con patacones y arroz con coco', 32000, 'principales', 1),
('10', 'Arroz con Pollo', 'Tradicional arroz con pollo desmechado y verduras', 24000, 'principales', 1),
('11', 'Limonada de Coco', 'Refrescante limonada con leche de coco', 8000, 'bebidas', 1),
('12', 'Jugo de Lulo', 'Jugo natural de lulo fresco', 6000, 'bebidas', 1),
('13', 'Aguapanela con Limón', 'Bebida tradicional de panela con limón', 5000, 'bebidas', 1),
('14', 'Cerveza Artesanal', 'Cerveza artesanal colombiana bien fría', 12000, 'bebidas', 1),
('15', 'Café Colombiano', 'Café de origen 100% colombiano', 4000, 'bebidas', 1),
('16', 'Tres Leches', 'Esponjoso bizcocho bañado en tres tipos de leche', 14000, 'postres', 1),
('17', 'Arroz con Leche', 'Cremoso arroz con leche, canela y pasas', 8000, 'postres', 1),
('18', 'Natilla con Buñuelos', 'Natilla tradicional acompañada de buñuelos', 10000, 'postres', 1),
('19', 'Obleas con Arequipe', 'Obleas crujientes con arequipe y coco rallado', 7000, 'postres', 1),
('20', 'Helado de Maracuyá', 'Helado cremoso de maracuyá natural', 9000, 'postres', 1);

-- Mesas (1-3 ocupadas con pedidos demo)
INSERT INTO restaurant_tables (number, status, current_order_id, active) VALUES
(1, 'ocupada', 'order-1', 1),
(2, 'ocupada', 'order-2', 1),
(3, 'ocupada', 'order-3', 1),
(4, 'disponible', NULL, 1),
(5, 'disponible', NULL, 1),
(6, 'disponible', NULL, 1),
(7, 'disponible', NULL, 1),
(8, 'disponible', NULL, 1),
(9, 'disponible', NULL, 1),
(10, 'disponible', NULL, 1);

INSERT INTO users (id, name, role, active) VALUES
('1', 'Carlos Rodríguez', 'mesero', 1),
('2', 'María González', 'mesero', 1),
('3', 'Juan Pérez', 'cocinero', 1),
('4', 'Ana Martínez', 'cajero', 1),
('5', 'Luis Sánchez', 'administrador', 1);

INSERT INTO orders (id, table_number, status, created_at, waiter_name, total) VALUES
('order-1', 1, 'en-cocina', DATE_SUB(NOW(), INTERVAL 15 MINUTE), 'Carlos Rodríguez', 86000),
('order-2', 2, 'pendiente', DATE_SUB(NOW(), INTERVAL 3 MINUTE), 'María González', 48000),
('order-3', 3, 'listo', DATE_SUB(NOW(), INTERVAL 25 MINUTE), 'Carlos Rodríguez', 66000);

INSERT INTO order_items (order_id, menu_item_id, quantity, observations) VALUES
('order-1', '5', 2, 'Sin aguacate'),
('order-1', '11', 2, NULL),
('order-2', '6', 1, NULL),
('order-2', '12', 1, NULL),
('order-2', '17', 1, NULL),
('order-3', '8', 1, 'Término medio'),
('order-3', '14', 2, NULL);
