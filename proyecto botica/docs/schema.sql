-- ============================================================
-- BOTICA CENTRAL — Schema consolidado
-- ============================================================
-- Single Source of Truth de tu BD. Ejecuta este archivo COMPLETO
-- en una BD vacía y todo queda listo.
--
-- Roles del sistema:
--   'admin'  → administrador
--   'emp'    → empleado/personal/trabajador
--   'cust'   → cliente (NO se usa en users; vive en customer)
--
-- Estados de pedido (orders.order_state):
--   'pendiente' | 'en proceso' | 'entregado' | 'cancelado'
--
-- Buenas prácticas aplicadas:
--   1. Single Source of Truth (este archivo es la verdad)
--   2. Idempotencia (CREATE EXTENSION IF NOT EXISTS, etc.)
--   3. Backward compatibility (DEFAULT en columnas nuevas)
--   4. Constraints declarativos (UNIQUE en payment.order_id)
--   5. Índices para queries comunes
-- ============================================================
 
 
-- ============================================================
-- PASO 1: (Opcional) DESTRUIR TODO LO EXISTENTE
-- ------------------------------------------------------------
-- Descomenta solo si necesitas resetear desde cero.
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
 
-- Extensión para bcrypt (crypt + gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
 
 
-- ============================================================
-- PASO 2: TABLAS BASE (catálogo)
-- ============================================================
 
CREATE TABLE laboratory (
    laboratory_id      SERIAL PRIMARY KEY,
    laboratory_name    VARCHAR(255) NOT NULL,
    laboratory_country VARCHAR(255)
);
 
-- ------------------------------------------------------------
-- TABLA category — Ampliada con metadata visual y destacadas
-- ------------------------------------------------------------
-- Campos visuales (icon_name, color_hex) → controlan UI sin tocar código
-- is_featured → controla qué categorías aparecen en la barra superior
-- display_order → orden de aparición en navbar/dropdown
-- ------------------------------------------------------------
CREATE TABLE category (
    category_id          SERIAL PRIMARY KEY,
    category_name        VARCHAR(255) NOT NULL UNIQUE,
    category_description TEXT,
    icon_name            VARCHAR(50)  DEFAULT 'Package',
    color_hex            VARCHAR(7)   DEFAULT '#F26430',
    is_featured          BOOLEAN      DEFAULT false,
    display_order        INTEGER      DEFAULT 999
);
 
-- Índice para queries de destacadas (las que aparecen en navbar superior)
CREATE INDEX idx_category_featured_order 
  ON category(is_featured, display_order) 
  WHERE is_featured = true;
 
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
-- PASO 3: SEDES (locations)
-- ------------------------------------------------------------
-- IMPORTANTE: creada ANTES de users porque users.location_id
-- referencia esta tabla.
-- ============================================================
 
CREATE TABLE location (
    location_id      SERIAL PRIMARY KEY,
    location_name    VARCHAR(255) NOT NULL,
    location_address VARCHAR(255),
    district         VARCHAR(255),
    location_phone   CHAR(9),
    location_email   VARCHAR(255),         -- correo de contacto de la sede
    schedule         VARCHAR(255),         -- horario de atención (texto libre)
    maps_query       TEXT,                 -- texto de búsqueda para Google Maps
    latitude         NUMERIC(10,7),        -- opcional (futuro pin con Leaflet)
    longitude        NUMERIC(10,7),        -- opcional (futuro pin con Leaflet)
    is_active        BOOLEAN DEFAULT true
);
 
 
-- ============================================================
-- PASO 4: USERS (admin + personal de botica)
-- ------------------------------------------------------------
-- Los CUSTOMERS NO van aquí, van en la tabla customer.
-- Solo usuarios con rol 'admin' o 'emp'.
-- ============================================================
 
CREATE TABLE users (
    user_id       SERIAL PRIMARY KEY,
    user_code     VARCHAR(50)  NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL
                  CHECK (role IN ('admin', 'emp')),
    location_id   INTEGER,
    is_active     BOOLEAN DEFAULT true,
    FOREIGN KEY (location_id) REFERENCES location(location_id) ON DELETE SET NULL
);
 
 
-- ============================================================
-- PASO 5: CUSTOMER (clientes con login propio)
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
 
-- Email único case-insensitive para login
CREATE UNIQUE INDEX idx_customer_email_unique
  ON customer (LOWER(email))
  WHERE email IS NOT NULL;
 
-- Búsqueda por DNI en POS
CREATE INDEX idx_customer_dni ON customer(dni) WHERE dni IS NOT NULL;
 
 
-- ============================================================
-- PASO 6: ORDERS (pedidos)
-- ------------------------------------------------------------
-- order_date es TIMESTAMP (no DATE) para preservar la hora.
-- ============================================================
 
CREATE TABLE orders (
    order_id              SERIAL PRIMARY KEY,
    order_state           VARCHAR(50) NOT NULL DEFAULT 'pendiente'
                          CHECK (order_state IN ('pendiente', 'en proceso', 'entregado', 'cancelado')),
    delivery_type         VARCHAR(50)
                          CHECK (delivery_type IN ('delivery', 'pickup') OR delivery_type IS NULL),
    order_date            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_price           DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    -- Datos de entrega (NUEVOS): persistir lo que el cliente ingresó en checkout
    delivery_address      VARCHAR(255),
    delivery_phone        CHAR(9),
    delivery_notes        TEXT,
    -- Auditoría de cancelación (NUEVOS): trazabilidad de quién/cuándo/por qué
    cancelled_by_user_id  INTEGER,
    cancelled_at          TIMESTAMP,
    cancellation_reason   VARCHAR(255),
    refund_processed      BOOLEAN DEFAULT false,
    customer_id           INTEGER,
    user_id               INTEGER,
    location_id           INTEGER,
    FOREIGN KEY (customer_id)          REFERENCES customer(customer_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id)              REFERENCES users(user_id)        ON DELETE SET NULL,
    FOREIGN KEY (location_id)          REFERENCES location(location_id) ON DELETE SET NULL,
    FOREIGN KEY (cancelled_by_user_id) REFERENCES users(user_id)        ON DELETE SET NULL
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
 
 
-- ------------------------------------------------------------
-- PAYMENT — un pago por pedido (UNIQUE constraint declarativo)
-- ------------------------------------------------------------
-- Columnas mp_*: trazabilidad de pagos con MercadoPago.
--   mp_payment_id    → ID del pago en MP (para auditoría/reembolsos)
--   mp_status        → estado MP (approved, rejected, in_process, pending)
--   mp_status_detail → detalle del estado (cc_rejected_other_reason, etc.)
-- Estas columnas son NULL para pagos NO procesados por MP
-- (Yape/Plin/Efectivo/Transferencia validados manualmente).
-- ------------------------------------------------------------
CREATE TABLE payment (
    payment_id       SERIAL PRIMARY KEY,
    payment_method   VARCHAR(50)
                     CHECK (payment_method IN ('efectivo', 'yape', 'plin', 'tarjeta', 'transferencia')),
    total_price      DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    voucher_type     VARCHAR(50)
                     CHECK (voucher_type IN ('boleta', 'factura', 'ticket') OR voucher_type IS NULL),
    email_pay        VARCHAR(255),
    phone_pay        CHAR(9),
    mp_payment_id    VARCHAR(50),
    mp_status        VARCHAR(50),
    mp_status_detail VARCHAR(100),
    -- Datos fiscales del cliente cuando voucher_type = 'factura' (NULL en otros
    -- comprobantes). billing_ruc: RUC de 11 dígitos; billing_name: razón social.
    billing_ruc      VARCHAR(11),
    billing_name     VARCHAR(200),
    order_id         INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

 
CREATE INDEX idx_payment_order ON payment(order_id);

-- Índice para búsquedas por mp_payment_id (útil en webhooks futuros)
CREATE INDEX idx_payment_mp_id 
  ON payment(mp_payment_id) 
  WHERE mp_payment_id IS NOT NULL;
 
-- ============================================================
-- PASO 7: INVENTORY
-- ------------------------------------------------------------
-- UNIQUE(product_id, location_id): mismo producto puede estar
-- en varias sedes (no UNIQUE en product_id solo).
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
-- PASO 8: IMAGE
-- ------------------------------------------------------------
-- Type: 'main' (principal), 'gallery' (extras), 'thumbnail'.
-- Solo UNA imagen 'main' por producto (constraint UNIQUE parcial).
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
 
 
-- ============================================================
-- PASO 9: SEMILLAS — SEDES
-- ============================================================
 
-- RUC 20614687259 · Razón social BOTICAS CENTRAL MOREL S.A.C.
-- Tel/WhatsApp y email son compartidos por ambas sedes.
INSERT INTO location
  (location_name, location_address, district, location_phone, location_email, schedule, maps_query, is_active)
VALUES
  ('Botica Central Ate',
   'Av. Metropolitana N.° 517, Lote 23, Urb. Ceres Etapa 2, Mz. G1, Ate, Lima',
   'Ate',
   '998113090',
   'bmboticascentral@gmail.com',
   'Lun a Vie: 7:00 a.m. – 12:00 a.m. (medianoche)',
   'Av. Metropolitana 517, Ceres, Ate, Lima, Perú',
   true),
  ('Botica Central Santa Anita',
   'Av. Universitaria N.° 416, Urb. Universal 2da Etapa, Santa Anita, Lima',
   'Santa Anita',
   '998113090',
   'bmboticascentral@gmail.com',
   'Lun a Vie: 7:00 a.m. – 12:00 a.m. (medianoche)',
   'Av. Universitaria 416, Santa Anita, Lima, Perú',
   true);
 
 
-- ============================================================
-- PASO 10: SEMILLAS — USERS (admin + personal)
-- ------------------------------------------------------------
-- Roles 'admin' y 'emp' (no 'personal'/'staff') porque el backend
-- los usa así en verifyRole.
-- ============================================================
 
INSERT INTO users (user_code, user_password, full_name, role, location_id, is_active) VALUES
  ('ADMIN01', crypt('admin1234', gen_salt('bf', 10)), 'Jorge Pérez',   'admin', NULL, true),
  ('TRAB01',  crypt('trab1234',  gen_salt('bf', 10)), 'Carlos Quispe', 'emp',   1,    true),
  ('TRAB02',  crypt('trab1234',  gen_salt('bf', 10)), 'Ana Torres',    'emp',   2,    true);
 
 
-- ============================================================
-- PASO 11: SEMILLAS — CUSTOMERS
-- ============================================================
 
INSERT INTO customer (full_name, dni, address, phone, email, customer_password, is_active) VALUES
  ('Matteo Arteaga', '87654321', 'Av. Salaverry 123, Lima',
   '987654321', 'matteo@test.com',
   crypt('cust1234', gen_salt('bf', 10)), true),
 
  ('Ivanna Santos',  '12345678', 'Av. Javier Prado 456, San Isidro',
   '912345678', 'ivanna@test.com',
   crypt('cust4321', gen_salt('bf', 10)), true);
 
 
-- ============================================================
-- PASO 12: SEMILLAS — CATEGORÍAS (15 con icon + color + destacadas)
-- ------------------------------------------------------------
-- Single Source of Truth para el navbar y dropdown del frontend.
--   is_featured = true → aparece en la barra superior (SecondaryNav)
--   is_featured = false → solo en dropdown "Categorías"
--   display_order → controla el orden visual
--   icon_name → nombre del icono de lucide-react
--   color_hex → color del chip / icono
--
-- 6 destacadas, 9 no destacadas, total 15.
-- ============================================================
 
INSERT INTO category (category_name, category_description, icon_name, color_hex, is_featured, display_order) VALUES
  -- DESTACADAS (aparecen en barra superior)
  ('Medicamentos',     'Medicinas con o sin receta médica',                  'Pill',         '#1E4D8C', true,  10),
  ('Analgésicos',      'Medicamentos para aliviar el dolor',                 'Pill',         '#DC2626', true,  15),
  ('Mamá & Bebé',      'Productos para el cuidado de bebés y madres',        'Baby',         '#EC4899', true,  20),
  ('Vitaminas',        'Suplementos vitamínicos y nutricionales',            'Apple',        '#10B981', true,  30),
  ('Genéricos',        'Medicamentos genéricos a precios accesibles',        'Heart',        '#F59E0B', true,  40),
  ('Antigripales',     'Productos para resfriado, gripe y congestión',       'Thermometer',  '#3B82F6', true,  45),
 
  -- NO DESTACADAS (solo en dropdown)
  ('Antibióticos',     'Tratamiento de infecciones bacterianas',             'ShieldCheck',  '#0EA5E9', false, 25),
  ('Antialérgicos',    'Alivio de síntomas alérgicos y rinitis',             'Wind',         '#84CC16', false, 35),
  ('Cuidado Personal', 'Higiene y belleza personal',                         'Sparkles',     '#8B5CF6', false, 50),
  ('Dermatología',     'Cuidado de la piel y dermatosis',                    'Droplet',      '#F472B6', false, 55),
  ('Cuidado del Hogar','Productos de limpieza y desinfección',               'Home',         '#06B6D4', false, 60),
  ('Gastroenterología','Salud digestiva, antiácidos y protectores gástricos','Soup',         '#FACC15', false, 65),
  ('Cardiovascular',   'Salud del corazón y sistema circulatorio',           'HeartPulse',   '#EF4444', false, 75),
  ('Diabetes',         'Cuidado para personas con diabetes',                 'Activity',     '#06B6D4', false, 85),
  ('Respiratorio',     'Inhaladores y tratamientos respiratorios',           'Wind',         '#0891B2', false, 95);
 
 
-- ============================================================
-- PASO 13: SEMILLAS — LABORATORIOS
-- ============================================================
 
INSERT INTO laboratory (laboratory_name, laboratory_country) VALUES
  ('Bayer',             'Alemania'),
  ('Pfizer',            'Estados Unidos'),
  ('Sanofi',            'Francia'),
  ('Genfar',            'Colombia'),
  ('GSK',               'Reino Unido'),
  ('Roche',             'Suiza'),
  ('Genéricos Perú',    'Perú'),
  ('Procter & Gamble',  'Estados Unidos');
 
 
-- ============================================================
-- PASO 14: SEMILLAS — PRODUCTOS (12 productos peruanos)
-- ------------------------------------------------------------
-- Usamos subqueries para resolver FKs por nombre (más legible
-- que adivinar los IDs).
-- 4 productos en oferta (is_offer=true).
-- ============================================================
 
-- 1. Paracetamol 500mg (oferta)
INSERT INTO product (
  product_name, active_ingredient, product_composition, contraindications,
  adverse_effects, product_batch, expiration_date, health_record,
  is_generic, product_price, is_active, is_offer, laboratory_id, category_id
)
SELECT
  'Paracetamol 500mg x 100 tabletas',
  'Paracetamol 500mg',
  'Cada tableta contiene paracetamol 500mg, excipientes c.s.p.',
  'Hipersensibilidad al paracetamol. Insuficiencia hepática grave.',
  'Raros: erupción cutánea, náuseas. Sobredosis: daño hepático.',
  'PCM-2024-001',
  '2027-06-30',
  'EE-12345-2024',
  true, 8.50, true, true,
  (SELECT laboratory_id FROM laboratory WHERE laboratory_name = 'Genéricos Perú'),
  (SELECT category_id FROM category WHERE category_name = 'Analgésicos');
 
-- 2. Ibuprofeno 400mg
INSERT INTO product (
  product_name, active_ingredient, product_composition, contraindications,
  adverse_effects, product_batch, expiration_date, health_record,
  is_generic, product_price, is_active, is_offer, laboratory_id, category_id
)
SELECT
  'Ibuprofeno 400mg x 50 cápsulas',
  'Ibuprofeno 400mg',
  'Cada cápsula contiene ibuprofeno 400mg.',
  'Úlcera gástrica activa. Embarazo tercer trimestre. Alergia a AINEs.',
  'Dispepsia, dolor abdominal, diarrea. Riesgo cardiovascular en uso prolongado.',
  'IBU-2024-005',
  '2027-04-15',
  'EE-12346-2024',
  true, 12.90, true, false,
  (SELECT laboratory_id FROM laboratory WHERE laboratory_name = 'Genfar'),
  (SELECT category_id FROM category WHERE category_name = 'Analgésicos');
 
-- 3. Amoxicilina 500mg (oferta)
INSERT INTO product (
  product_name, active_ingredient, product_composition,
  contraindications, adverse_effects, expiration_date, health_record,
  is_generic, product_price, is_active, is_offer, laboratory_id, category_id
)
SELECT
  'Amoxicilina 500mg x 21 cápsulas',
  'Amoxicilina trihidrato 500mg',
  'Cada cápsula contiene amoxicilina trihidrato equivalente a 500mg.',
  'Alergia a penicilinas. Mononucleosis infecciosa.',
  'Diarrea, náuseas, erupción cutánea. Reacciones alérgicas graves (raras).',
  '2027-02-28',
  'EE-12347-2024',
  true, 15.50, true, true,
  (SELECT laboratory_id FROM laboratory WHERE laboratory_name = 'Genfar'),
  (SELECT category_id FROM category WHERE category_name = 'Antibióticos');
 
-- 4. Loratadina 10mg
INSERT INTO product (
  product_name, active_ingredient, product_composition,
  contraindications, adverse_effects, expiration_date, health_record,
  is_generic, product_price, is_active, is_offer, laboratory_id, category_id
)
SELECT
  'Loratadina 10mg x 10 tabletas',
  'Loratadina 10mg',
  'Cada tableta contiene loratadina 10mg.',
  'Hipersensibilidad a loratadina. Niños menores de 2 años.',
  'Somnolencia (raro), cefalea, sequedad de boca.',
  '2027-09-30',
  'EE-12348-2024',
  true, 9.80, true, false,
  (SELECT laboratory_id FROM laboratory WHERE laboratory_name = 'Genéricos Perú'),
  (SELECT category_id FROM category WHERE category_name = 'Antialérgicos');
 
-- 5. Vitamina C 1000mg
INSERT INTO product (
  product_name, active_ingredient, product_composition,
  contraindications, adverse_effects, expiration_date,
  is_generic, product_price, is_active, is_offer, laboratory_id, category_id
)
SELECT
  'Vitamina C 1000mg x 60 tabletas',
  'Ácido ascórbico 1000mg',
  'Cada tableta efervescente contiene ácido ascórbico 1000mg, edulcorantes.',
  'Cálculos renales. Hemocromatosis.',
  'Diarrea en dosis altas, malestar gástrico.',
  '2028-03-31',
  false, 29.90, true, false,
  (SELECT laboratory_id FROM laboratory WHERE laboratory_name = 'Bayer'),
  (SELECT category_id FROM category WHERE category_name = 'Vitaminas');
 
-- 6. Complejo B
INSERT INTO product (
  product_name, active_ingredient, product_composition,
  contraindications, adverse_effects, expiration_date,
  is_generic, product_price, is_active, is_offer, laboratory_id, category_id
)
SELECT
  'Complejo B x 30 tabletas',
  'Tiamina, Riboflavina, Niacina, B6, B12',
  'Cada tableta contiene B1, B2, B3, B6, B12 y ácido fólico.',
  'Hipersensibilidad a componentes.',
  'Coloración amarilla de la orina (B2). Reacciones alérgicas raras.',
  '2027-11-30',
  false, 24.50, true, false,
  (SELECT laboratory_id FROM laboratory WHERE laboratory_name = 'Bayer'),
  (SELECT category_id FROM category WHERE category_name = 'Vitaminas');
 
-- 7. Panadol Antigripal (oferta)
INSERT INTO product (
  product_name, active_ingredient, product_composition,
  contraindications, adverse_effects, expiration_date, health_record,
  is_generic, product_price, is_active, is_offer, laboratory_id, category_id
)
SELECT
  'Panadol Antigripal x 12 tabletas',
  'Paracetamol 500mg + Fenilefrina 10mg + Clorfenamina 4mg',
  'Cada tableta combina analgésico, descongestionante y antialérgico.',
  'Hipertensión, hipertiroidismo. Niños menores de 12 años.',
  'Somnolencia, sequedad de boca, taquicardia leve.',
  '2027-08-15',
  'EE-12351-2024',
  false, 18.90, true, true,
  (SELECT laboratory_id FROM laboratory WHERE laboratory_name = 'GSK'),
  (SELECT category_id FROM category WHERE category_name = 'Antigripales');
 
-- 8. Pañales Huggies
INSERT INTO product (
  product_name, product_composition, expiration_date,
  is_generic, product_price, is_active, is_offer, laboratory_id, category_id
)
SELECT
  'Pañales Huggies Natural Care talla G x 60 unidades',
  'Pañales desechables con extracto de aloe vera y vitamina E.',
  '2029-12-31',
  false, 65.90, true, false,
  (SELECT laboratory_id FROM laboratory WHERE laboratory_name = 'Procter & Gamble'),
  (SELECT category_id FROM category WHERE category_name = 'Mamá & Bebé');
 
-- 9. Shampoo Johnson's Baby
INSERT INTO product (
  product_name, product_composition, expiration_date,
  is_generic, product_price, is_active, is_offer, laboratory_id, category_id
)
SELECT
  'Shampoo Johnson''s Baby 200ml',
  'Fórmula no irritante para piel sensible de bebés.',
  '2028-06-30',
  false, 14.50, true, false,
  (SELECT laboratory_id FROM laboratory WHERE laboratory_name = 'Procter & Gamble'),
  (SELECT category_id FROM category WHERE category_name = 'Mamá & Bebé');
 
-- 10. Alcohol Medicinal 96°
INSERT INTO product (
  product_name, product_composition, expiration_date,
  is_generic, product_price, is_active, is_offer, laboratory_id, category_id
)
SELECT
  'Alcohol Medicinal 96° x 250ml',
  'Etanol 96° para uso externo (antiséptico).',
  '2029-01-31',
  false, 7.50, true, false,
  (SELECT laboratory_id FROM laboratory WHERE laboratory_name = 'Genéricos Perú'),
  (SELECT category_id FROM category WHERE category_name = 'Cuidado Personal');
 
-- 11. Curitas (oferta)
INSERT INTO product (
  product_name, product_composition, expiration_date,
  is_generic, product_price, is_active, is_offer, laboratory_id, category_id
)
SELECT
  'Curitas adhesivas surtidas x 100 unidades',
  'Vendajes adhesivos estériles de varios tamaños.',
  '2029-12-31',
  false, 11.90, true, true,
  (SELECT laboratory_id FROM laboratory WHERE laboratory_name = 'Genéricos Perú'),
  (SELECT category_id FROM category WHERE category_name = 'Cuidado Personal');
 
-- 12. Crema dental Colgate
INSERT INTO product (
  product_name, product_composition, expiration_date,
  is_generic, product_price, is_active, is_offer, laboratory_id, category_id
)
SELECT
  'Crema dental Colgate Total 12 x 75g',
  'Pasta dental con triclosán para protección 12 horas.',
  '2028-09-30',
  false, 6.90, true, false,
  (SELECT laboratory_id FROM laboratory WHERE laboratory_name = 'Procter & Gamble'),
  (SELECT category_id FROM category WHERE category_name = 'Cuidado Personal');
 
 
-- ============================================================
-- PASO 15: SEMILLAS — INVENTARIO POR SEDE
-- ------------------------------------------------------------
-- Stock variado: Ate (sede principal) tiene más; Santa Anita menos.
-- Genera 1 fila por (producto, sede) usando CROSS JOIN.
-- ============================================================
 
INSERT INTO inventory (current_stock, min_stock, product_id, location_id)
SELECT
  CASE 
    WHEN l.location_id = 1 THEN  -- Ate: 25-80 unidades
      CASE (p.product_id % 4)
        WHEN 0 THEN 80
        WHEN 1 THEN 50
        WHEN 2 THEN 35
        ELSE 25
      END
    ELSE  -- Santa Anita: 10-40 unidades
      CASE (p.product_id % 4)
        WHEN 0 THEN 40
        WHEN 1 THEN 25
        WHEN 2 THEN 15
        ELSE 10
      END
  END,
  10,
  p.product_id,
  l.location_id
FROM product p
CROSS JOIN location l;
 
 
-- ============================================================
-- PASO 16: SEMILLAS — IMÁGENES (placeholders por ahora)
-- ------------------------------------------------------------
-- Cuando tengas imágenes reales (Cloudinary en F3), las
-- reemplazas con UPDATE.
-- ============================================================
 
INSERT INTO image (url, type, product_id)
SELECT
  'https://placehold.co/400x400/FFF4EE/F26430?text=' ||
    REPLACE(REPLACE(REPLACE(REPLACE(
      product_name, 
      ' ', '+'),
      '/', ''),
      '°', ''),
      '''', ''),
  'main',
  product_id
FROM product;
 
 
-- ============================================================
-- PASO 17: VERIFICACIÓN FINAL
-- ============================================================
 
SELECT '=== USERS (admin + personal) ===' AS info;
SELECT user_id, user_code, full_name, role, location_id, is_active
FROM users ORDER BY user_id;
 
SELECT '=== CUSTOMERS ===' AS info;
SELECT customer_id, full_name, email, dni, is_active
FROM customer ORDER BY customer_id;
 
SELECT '=== LOCATIONS ===' AS info;
SELECT * FROM location;
 
SELECT '=== CATEGORÍAS (15) ===' AS info;
SELECT category_id, category_name, icon_name, color_hex, is_featured, display_order
FROM category ORDER BY display_order;
 
SELECT '=== CATEGORÍAS DESTACADAS (navbar superior) ===' AS info;
SELECT category_id, category_name, icon_name, color_hex
FROM category WHERE is_featured = true ORDER BY display_order;
 
SELECT '=== RESUMEN CATÁLOGO ===' AS info;
SELECT 
  'Categorías'           AS tabla, COUNT(*) AS total FROM category
UNION ALL SELECT 'Cat. destacadas', COUNT(*) FROM category WHERE is_featured = true
UNION ALL SELECT 'Laboratorios',    COUNT(*) FROM laboratory
UNION ALL SELECT 'Productos',       COUNT(*) FROM product
UNION ALL SELECT 'Productos oferta',COUNT(*) FROM product WHERE is_offer
UNION ALL SELECT 'Inventario',      COUNT(*) FROM inventory
UNION ALL SELECT 'Imágenes',        COUNT(*) FROM image;
 
SELECT '=== PRODUCTOS POR CATEGORÍA ===' AS info;
SELECT c.category_name, COUNT(p.product_id) AS productos
FROM category c
LEFT JOIN product p ON p.category_id = c.category_id
GROUP BY c.category_name
ORDER BY productos DESC, c.category_name;
 
SELECT '=== INVENTARIO POR SEDE ===' AS info;
SELECT l.location_name, 
       COUNT(*) AS productos_con_stock,
       SUM(i.current_stock) AS unidades_totales
FROM inventory i
JOIN location l ON l.location_id = i.location_id
GROUP BY l.location_name;
 
-- VERIFICACION DE PAGO CORRECTO Y PEDIDO
SELECT o.order_id, o.order_state, p.payment_method, p.mp_status, p.mp_payment_id 
FROM orders o JOIN payment p ON p.order_id = o.order_id 
ORDER BY o.order_id DESC;

-- ============================================================
-- NOTAS PARA EL FRONTEND
-- ------------------------------------------------------------
-- Iconos usados (todos de lucide-react):
--   Pill, Baby, Apple, Heart, Sparkles, Home, ShieldCheck,
--   Wind, Thermometer, Droplet, Soup, HeartPulse, Activity,
--   Package (fallback)
--
-- El frontend mapea icon_name → componente Lucide.
-- Si recibe un icon_name desconocido, usa Package por defecto.
-- ============================================================