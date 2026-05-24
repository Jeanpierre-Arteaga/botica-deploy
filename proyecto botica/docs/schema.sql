-- ============================================================
-- BOTICA CENTRAL — Schema SQL
-- ============================================================
-- Estado actual de la base de datos.
--
-- Roles del sistema (validados por CHECK):
--   'admin'  → administrador
--   'emp'    → empleado/trabajador de botica
--   'cust'   → cliente (vive en tabla customer, no en users)
--
-- Estados de pedido (orders.order_state, validados por CHECK):
--   'pendiente' | 'en proceso' | 'entregado' | 'cancelado'
--
-- Ejecutar este archivo COMPLETO en una BD limpia. Si la BD ya
-- tiene tablas, descomenta el bloque DROP del inicio.
-- ============================================================


-- ============================================================
-- (Opcional) Resetear BD existente
-- ============================================================
/*
DROP TABLE IF EXISTS image          CASCADE;
DROP TABLE IF EXISTS inventory      CASCADE;
DROP TABLE IF EXISTS payment        CASCADE;
DROP TABLE IF EXISTS order_detail   CASCADE;
DROP TABLE IF EXISTS orders         CASCADE;
DROP TABLE IF EXISTS users          CASCADE;
DROP TABLE IF EXISTS location       CASCADE;
DROP TABLE IF EXISTS customer       CASCADE;
DROP TABLE IF EXISTS product        CASCADE;
DROP TABLE IF EXISTS category       CASCADE;
DROP TABLE IF EXISTS laboratory     CASCADE;
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- CATÁLOGO
-- ============================================================

CREATE TABLE laboratory (
    laboratory_id      SERIAL PRIMARY KEY,
    laboratory_name    VARCHAR(255) NOT NULL,
    laboratory_country VARCHAR(255)
);

CREATE TABLE category (
    category_id          SERIAL PRIMARY KEY,
    category_name        VARCHAR(255) NOT NULL UNIQUE,
    category_description TEXT
);

CREATE TABLE product (
    product_id          SERIAL PRIMARY KEY,
    product_name        VARCHAR(255) NOT NULL,
    active_ingredient   VARCHAR(255),
    product_composition TEXT,
    contraindications   TEXT,
    adverse_effects     TEXT,
    product_batch       VARCHAR(255),
    expiration_date     DATE,
    health_record       VARCHAR(255),
    is_generic          BOOLEAN DEFAULT false,
    product_price       DECIMAL(10,2) NOT NULL CHECK (product_price >= 0),
    is_active           BOOLEAN DEFAULT true,
    is_offer            BOOLEAN DEFAULT false,
    laboratory_id       INTEGER,
    category_id         INTEGER,
    FOREIGN KEY (laboratory_id) REFERENCES laboratory(laboratory_id) ON DELETE SET NULL,
    FOREIGN KEY (category_id)   REFERENCES category(category_id)     ON DELETE SET NULL
);


-- ============================================================
-- SEDES
-- ============================================================

CREATE TABLE location (
    location_id      SERIAL PRIMARY KEY,
    location_name    VARCHAR(255) NOT NULL,
    location_address VARCHAR(255),
    district         VARCHAR(255),
    location_phone   CHAR(9),
    is_active        BOOLEAN DEFAULT true
);


-- ============================================================
-- USUARIOS (admin + personal). Clientes en tabla customer.
-- ============================================================

CREATE TABLE users (
    user_id       SERIAL PRIMARY KEY,
    user_code     VARCHAR(50)  NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'emp')),
    location_id   INTEGER,
    is_active     BOOLEAN DEFAULT true,
    FOREIGN KEY (location_id) REFERENCES location(location_id) ON DELETE SET NULL
);


-- ============================================================
-- CLIENTES (con login propio)
-- ============================================================

CREATE TABLE customer (
    customer_id       SERIAL PRIMARY KEY,
    full_name         VARCHAR(255) NOT NULL,
    dni               CHAR(8),
    address           VARCHAR(255),
    phone             CHAR(9),
    email             VARCHAR(255),
    customer_password VARCHAR(255),
    is_active         BOOLEAN DEFAULT true,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_customer_email_unique
  ON customer (LOWER(email)) WHERE email IS NOT NULL;

CREATE INDEX idx_customer_dni ON customer(dni) WHERE dni IS NOT NULL;


-- ============================================================
-- PEDIDOS
-- ============================================================

CREATE TABLE orders (
    order_id      SERIAL PRIMARY KEY,
    order_state   VARCHAR(50) NOT NULL DEFAULT 'pendiente'
                  CHECK (order_state IN ('pendiente', 'en proceso', 'entregado', 'cancelado')),
    delivery_type VARCHAR(50)
                  CHECK (delivery_type IN ('delivery', 'pickup') OR delivery_type IS NULL),
    order_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_price   DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    customer_id   INTEGER,
    user_id       INTEGER,
    location_id   INTEGER,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id)     REFERENCES users(user_id)        ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES location(location_id) ON DELETE SET NULL
);

CREATE INDEX idx_orders_date     ON orders(order_date DESC);
CREATE INDEX idx_orders_state    ON orders(order_state);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_location ON orders(location_id);


CREATE TABLE order_detail (
    detail_id       SERIAL PRIMARY KEY,
    amount          INTEGER       NOT NULL CHECK (amount > 0),
    unit_price      DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    sub_total_price DECIMAL(10,2) NOT NULL CHECK (sub_total_price >= 0),
    product_id      INTEGER,
    order_id        INTEGER NOT NULL,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE SET NULL,
    FOREIGN KEY (order_id)   REFERENCES orders(order_id)    ON DELETE CASCADE
);

CREATE INDEX idx_order_detail_order   ON order_detail(order_id);
CREATE INDEX idx_order_detail_product ON order_detail(product_id);


-- ============================================================
-- PAGOS
-- ============================================================
-- UNIQUE (order_id): un pago por orden. Si en el futuro necesitas
-- pagos parciales/cuotas, modela una tabla payment_installment aparte.
-- ============================================================

CREATE TABLE payment (
    payment_id     SERIAL PRIMARY KEY,
    payment_method VARCHAR(50)
                   CHECK (payment_method IN ('efectivo', 'yape', 'plin', 'tarjeta', 'transferencia')),
    total_price    DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    voucher_type   VARCHAR(50)
                   CHECK (voucher_type IN ('boleta', 'factura', 'ticket') OR voucher_type IS NULL),
    email_pay      VARCHAR(255),
    phone_pay      CHAR(9),
    order_id       INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE INDEX idx_payment_order ON payment(order_id);


-- ============================================================
-- INVENTARIO
-- ============================================================
-- UNIQUE (product_id, location_id): el mismo producto vive en
-- múltiples sedes con stock independiente. La transferencia entre
-- sedes está soportada por inventoryModel.transfer().
-- ============================================================

CREATE TABLE inventory (
    inventory_id  SERIAL PRIMARY KEY,
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    min_stock     INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    product_id    INTEGER NOT NULL,
    location_id   INTEGER NOT NULL,
    UNIQUE (product_id, location_id),
    FOREIGN KEY (product_id)  REFERENCES product(product_id)   ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES location(location_id) ON DELETE CASCADE
);

CREATE INDEX idx_inventory_location ON inventory(location_id);
CREATE INDEX idx_inventory_product  ON inventory(product_id);


-- ============================================================
-- IMÁGENES DE PRODUCTO
-- ============================================================
-- type='main' es la imagen principal mostrada en el catálogo.
-- Solo UNA 'main' por producto.
-- ============================================================

CREATE TABLE image (
    image_id   SERIAL PRIMARY KEY,
    url        VARCHAR(500) NOT NULL,
    type       VARCHAR(50)  DEFAULT 'main'
               CHECK (type IN ('main', 'gallery', 'thumbnail')),
    product_id INTEGER NOT NULL,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
);

CREATE INDEX idx_image_product ON image(product_id);

CREATE UNIQUE INDEX idx_image_main_unique
  ON image(product_id) WHERE type = 'main';