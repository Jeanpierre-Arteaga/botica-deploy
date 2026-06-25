-- ============================================================
-- BOTICA CENTRAL — SEED de 210 PRODUCTOS (catálogo completo)
-- ============================================================
-- Requiere que el schema ya exista, con category, laboratory y
-- location (sedes) ya sembrados (PASOS 9, 12 y 13 del schema base).
-- Distribución: 6 categorías x 20 + 9 categorías x 10 = 210.
-- Las FKs se resuelven por NOMBRE (igual que el seed original).
-- El inventario y las imágenes se generan para TODOS los productos.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- LIMPIEZA (entorno de desarrollo): deja el catálogo en exactamente 210.
-- Si tienes pedidos reales que NO quieres perder, comenta la línea de order_detail.
-- ------------------------------------------------------------
DELETE FROM image;
DELETE FROM inventory;
DELETE FROM order_detail;   -- comenta esta línea si quieres conservar pedidos
DELETE FROM product;
ALTER SEQUENCE product_product_id_seq RESTART WITH 1;

-- ------------------------------------------------------------
-- 210 PRODUCTOS  (un solo INSERT; FKs resueltas por nombre)
-- columnas: product_name, active_ingredient, product_price,
--          is_generic, is_offer, expiration_date, laboratory, category
-- ------------------------------------------------------------
INSERT INTO product
  (product_name, active_ingredient, product_price, is_generic, is_offer,
   expiration_date, is_active, laboratory_id, category_id)
SELECT v.name, v.ai, v.price, v.gen, v.offer, v.exp, true,
       (SELECT laboratory_id FROM laboratory WHERE laboratory_name = v.lab),
       (SELECT category_id   FROM category   WHERE category_name   = v.cat)
FROM (VALUES
  -- ===== Medicamentos =====
  ('Levotiroxina 100mcg x 30 tabletas', 'Levotiroxina sódica 100mcg', 13.90, false, false, DATE '2027-03-31', 'Sanofi', 'Medicamentos'),
  ('Sertralina 50mg x 30 tabletas', 'Sertralina 50mg', 24.90, true, false, DATE '2027-06-30', 'Genfar', 'Medicamentos'),
  ('Fluoxetina 20mg x 30 cápsulas', 'Fluoxetina 20mg', 19.90, true, false, DATE '2027-09-30', 'Genéricos Perú', 'Medicamentos'),
  ('Aciclovir 200mg x 25 tabletas', 'Aciclovir 200mg', 16.90, true, false, DATE '2027-12-31', 'Genfar', 'Medicamentos'),
  ('Prednisona 20mg x 20 tabletas', 'Prednisona 20mg', 10.90, true, false, DATE '2028-03-31', 'Genéricos Perú', 'Medicamentos'),
  ('Dexametasona 4mg x 10 tabletas', 'Dexametasona 4mg', 7.90, true, false, DATE '2028-06-30', 'Genéricos Perú', 'Medicamentos'),
  ('Carbamazepina 200mg x 20 tabletas', 'Carbamazepina 200mg', 14.50, true, false, DATE '2028-12-31', 'Genfar', 'Medicamentos'),
  ('Clonazepam 2mg x 30 tabletas', 'Clonazepam 2mg', 18.90, false, false, DATE '2029-06-30', 'Roche', 'Medicamentos'),
  ('Gabapentina 300mg x 30 cápsulas', 'Gabapentina 300mg', 28.90, false, false, DATE '2029-12-31', 'Pfizer', 'Medicamentos'),
  ('Albendazol 400mg x 2 tabletas', 'Albendazol 400mg', 6.90, true, true, DATE '2027-03-31', 'Genfar', 'Medicamentos'),
  ('Metronidazol 500mg x 30 tabletas', 'Metronidazol 500mg', 12.50, true, false, DATE '2027-06-30', 'Genéricos Perú', 'Medicamentos'),
  ('Fluconazol 150mg x 1 cápsula', 'Fluconazol 150mg', 15.90, false, false, DATE '2027-09-30', 'Pfizer', 'Medicamentos'),
  ('Furosemida 40mg x 20 tabletas', 'Furosemida 40mg', 8.50, true, false, DATE '2027-12-31', 'Genéricos Perú', 'Medicamentos'),
  ('Espironolactona 25mg x 20 tabletas', 'Espironolactona 25mg', 13.90, true, false, DATE '2028-03-31', 'Genfar', 'Medicamentos'),
  ('Hioscina 10mg x 10 tabletas', 'Butilbromuro de hioscina 10mg', 9.90, true, false, DATE '2028-06-30', 'Genéricos Perú', 'Medicamentos'),
  ('Ondansetrón 8mg x 10 tabletas', 'Ondansetrón 8mg', 16.90, true, false, DATE '2028-12-31', 'Genéricos Perú', 'Medicamentos'),
  ('Diazepam 10mg x 30 tabletas', 'Diazepam 10mg', 14.90, false, false, DATE '2029-06-30', 'Roche', 'Medicamentos'),
  ('Sales de Rehidratación Oral x 5 sobres', 'Electrolitos orales', 8.90, true, true, DATE '2029-12-31', 'Genéricos Perú', 'Medicamentos'),
  ('Suero Fisiológico 0.9% x 250ml', 'Cloruro de sodio 0.9%', 6.50, true, false, DATE '2027-03-31', 'Genéricos Perú', 'Medicamentos'),
  ('Loperamida 2mg x 12 tabletas', 'Loperamida 2mg', 7.50, true, false, DATE '2027-06-30', 'Genfar', 'Medicamentos'),
  -- ===== Analgésicos =====
  ('Paracetamol 500mg x 100 tabletas', 'Paracetamol 500mg', 8.50, true, true, DATE '2027-09-30', 'Genéricos Perú', 'Analgésicos'),
  ('Ibuprofeno 400mg x 50 cápsulas', 'Ibuprofeno 400mg', 12.90, true, false, DATE '2027-12-31', 'Genfar', 'Analgésicos'),
  ('Naproxeno 550mg x 20 tabletas', 'Naproxeno sódico 550mg', 14.50, true, false, DATE '2028-03-31', 'Genfar', 'Analgésicos'),
  ('Diclofenaco 50mg x 30 tabletas', 'Diclofenaco sódico 50mg', 9.90, true, false, DATE '2028-06-30', 'Genéricos Perú', 'Analgésicos'),
  ('Apronax 550mg x 10 tabletas', 'Naproxeno sódico 550mg', 16.90, false, true, DATE '2028-12-31', 'Bayer', 'Analgésicos'),
  ('Antalgina 500mg x 100 tabletas', 'Metamizol sódico 500mg', 10.50, true, false, DATE '2029-06-30', 'Genéricos Perú', 'Analgésicos'),
  ('Aspirina 500mg x 20 tabletas', 'Ácido acetilsalicílico 500mg', 11.90, false, false, DATE '2029-12-31', 'Bayer', 'Analgésicos'),
  ('Ketorolaco 10mg x 10 tabletas', 'Ketorolaco trometamina 10mg', 8.90, true, false, DATE '2027-03-31', 'Genfar', 'Analgésicos'),
  ('Dolocordralan Extra Forte x 50 tabletas', 'Diclofenaco + Complejo B', 19.90, false, false, DATE '2027-06-30', 'GSK', 'Analgésicos'),
  ('Doloflam 100mg x 10 cápsulas', 'Aceclofenaco 100mg', 13.50, false, false, DATE '2027-09-30', 'Genfar', 'Analgésicos'),
  ('Paracetamol 1g x 16 tabletas', 'Paracetamol 1g', 9.50, true, false, DATE '2027-12-31', 'Genéricos Perú', 'Analgésicos'),
  ('Ibuprofeno 600mg x 30 tabletas', 'Ibuprofeno 600mg', 15.90, true, false, DATE '2028-03-31', 'Genfar', 'Analgésicos'),
  ('Celecoxib 200mg x 10 cápsulas', 'Celecoxib 200mg', 24.90, false, false, DATE '2028-06-30', 'Pfizer', 'Analgésicos'),
  ('Etoricoxib 90mg x 7 tabletas', 'Etoricoxib 90mg', 21.50, false, false, DATE '2028-12-31', 'Genfar', 'Analgésicos'),
  ('Ketoprofeno 100mg x 20 tabletas', 'Ketoprofeno 100mg', 17.90, false, false, DATE '2029-06-30', 'Sanofi', 'Analgésicos'),
  ('Tramadol 50mg x 10 cápsulas', 'Tramadol clorhidrato 50mg', 22.90, true, false, DATE '2029-12-31', 'Genfar', 'Analgésicos'),
  ('Buscapina 10mg x 20 grageas', 'Butilbromuro de hioscina 10mg', 18.50, false, false, DATE '2027-03-31', 'Sanofi', 'Analgésicos'),
  ('Migragesic x 10 tabletas', 'Ergotamina + Cafeína', 14.90, false, false, DATE '2027-06-30', 'Genéricos Perú', 'Analgésicos'),
  ('Panadol 500mg x 24 tabletas', 'Paracetamol 500mg', 13.90, false, false, DATE '2027-09-30', 'GSK', 'Analgésicos'),
  ('Flexiver Compuesto x 10 tabletas', 'Meloxicam + Complejo B', 18.90, false, false, DATE '2027-12-31', 'Genfar', 'Analgésicos'),
  -- ===== Mamá & Bebé =====
  ('Pañales Huggies Natural Care talla G x 60 unidades', NULL, 65.90, false, false, DATE '2028-03-31', 'Procter & Gamble', 'Mamá & Bebé'),
  ('Pañales Pampers Premium Care talla M x 64 unidades', NULL, 69.90, false, true, DATE '2028-06-30', 'Procter & Gamble', 'Mamá & Bebé'),
  ('Pañales Babysec Ultra talla XG x 56 unidades', NULL, 49.90, false, false, DATE '2028-12-31', 'Genéricos Perú', 'Mamá & Bebé'),
  ('Shampoo Johnson''s Baby 200ml', NULL, 14.50, false, false, DATE '2029-06-30', 'Procter & Gamble', 'Mamá & Bebé'),
  ('Jabón Johnson''s Baby x 125g', NULL, 6.90, false, false, DATE '2029-12-31', 'Procter & Gamble', 'Mamá & Bebé'),
  ('Colonia Johnson''s Baby 200ml', NULL, 19.90, false, false, DATE '2027-03-31', 'Procter & Gamble', 'Mamá & Bebé'),
  ('Toallitas húmedas Huggies x 48 unidades', NULL, 9.90, false, true, DATE '2027-06-30', 'Procter & Gamble', 'Mamá & Bebé'),
  ('Crema antipañalitis Hipoglós x 45g', 'Óxido de zinc', 22.90, false, false, DATE '2027-09-30', 'Procter & Gamble', 'Mamá & Bebé'),
  ('Leche Enfamil Premium 1 x 400g', 'Fórmula infantil', 54.90, false, false, DATE '2027-12-31', 'Genéricos Perú', 'Mamá & Bebé'),
  ('Leche NAN Optipro 1 x 400g', 'Fórmula infantil', 58.90, false, false, DATE '2028-03-31', 'Genéricos Perú', 'Mamá & Bebé'),
  ('Biberón Avent Natural 260ml', NULL, 34.90, false, false, DATE '2028-06-30', 'Procter & Gamble', 'Mamá & Bebé'),
  ('Chupón Avent ortodóntico x 2 unidades', NULL, 24.90, false, false, DATE '2028-12-31', 'Procter & Gamble', 'Mamá & Bebé'),
  ('Mamadera anticólicos Dr. Brown''s 240ml', NULL, 39.90, false, false, DATE '2029-06-30', 'Genéricos Perú', 'Mamá & Bebé'),
  ('Termómetro digital infantil', NULL, 18.90, false, false, DATE '2029-12-31', 'Genéricos Perú', 'Mamá & Bebé'),
  ('Aspirador nasal para bebé', NULL, 12.90, false, false, DATE '2027-03-31', 'Genéricos Perú', 'Mamá & Bebé'),
  ('Vitamina D3 gotas pediátricas 10ml', 'Colecalciferol', 26.90, false, false, DATE '2027-06-30', 'Bayer', 'Mamá & Bebé'),
  ('Hierro pediátrico en gotas 30ml', 'Sulfato ferroso', 17.90, false, false, DATE '2027-09-30', 'Genéricos Perú', 'Mamá & Bebé'),
  ('Paracetamol gotas pediátricas 15ml', 'Paracetamol 100mg/ml', 9.50, true, false, DATE '2027-12-31', 'Genéricos Perú', 'Mamá & Bebé'),
  ('Pañalera multifuncional', NULL, 79.90, false, false, DATE '2028-03-31', 'Genéricos Perú', 'Mamá & Bebé'),
  ('Protector solar bebé FPS50 100ml', NULL, 38.90, false, false, DATE '2028-06-30', 'Bayer', 'Mamá & Bebé'),
  -- ===== Vitaminas =====
  ('Vitamina C 1000mg x 60 tabletas', 'Ácido ascórbico 1000mg', 29.90, false, false, DATE '2028-12-31', 'Bayer', 'Vitaminas'),
  ('Complejo B x 30 tabletas', 'Tiamina, Riboflavina, Niacina, B6, B12', 24.50, false, false, DATE '2029-06-30', 'Bayer', 'Vitaminas'),
  ('Vitamina C 500mg x 30 tabletas efervescentes', 'Ácido ascórbico 500mg', 15.90, true, false, DATE '2029-12-31', 'Genéricos Perú', 'Vitaminas'),
  ('Redoxon Triple Acción x 30 tabletas', 'Vitamina C + Zinc + Vitamina D', 32.90, false, true, DATE '2027-03-31', 'Bayer', 'Vitaminas'),
  ('Supradyn Energy x 30 tabletas', 'Multivitamínico + minerales', 39.90, false, false, DATE '2027-06-30', 'Bayer', 'Vitaminas'),
  ('Centrum Adultos x 60 tabletas', 'Multivitamínico + minerales', 64.90, false, false, DATE '2027-09-30', 'Pfizer', 'Vitaminas'),
  ('Centrum Silver 50+ x 60 tabletas', 'Multivitamínico adulto mayor', 69.90, false, false, DATE '2027-12-31', 'Pfizer', 'Vitaminas'),
  ('Vitamina D3 2000 UI x 60 cápsulas', 'Colecalciferol 2000 UI', 28.90, true, false, DATE '2028-03-31', 'Genéricos Perú', 'Vitaminas'),
  ('Omega 3 1000mg x 60 cápsulas', 'Aceite de pescado (EPA/DHA)', 34.90, false, false, DATE '2028-06-30', 'Genéricos Perú', 'Vitaminas'),
  ('Calcio + Vitamina D x 60 tabletas', 'Carbonato de calcio + D3', 22.90, true, false, DATE '2028-12-31', 'Genéricos Perú', 'Vitaminas'),
  ('Hierro + Ácido fólico x 30 tabletas', 'Sulfato ferroso + ácido fólico', 16.90, true, false, DATE '2029-06-30', 'Genéricos Perú', 'Vitaminas'),
  ('Magnesio + Zinc x 60 tabletas', 'Óxido de magnesio + zinc', 25.90, false, false, DATE '2029-12-31', 'Genéricos Perú', 'Vitaminas'),
  ('Vitamina E 400 UI x 30 cápsulas', 'Tocoferol 400 UI', 27.90, false, false, DATE '2027-03-31', 'Bayer', 'Vitaminas'),
  ('Ácido fólico 5mg x 30 tabletas', 'Ácido fólico 5mg', 7.90, true, true, DATE '2027-06-30', 'Genéricos Perú', 'Vitaminas'),
  ('Colágeno hidrolizado + Vitamina C 300g', 'Colágeno hidrolizado', 49.90, false, false, DATE '2027-09-30', 'Genéricos Perú', 'Vitaminas'),
  ('Biotina 10000mcg x 60 cápsulas', 'Biotina 10000mcg', 31.90, false, false, DATE '2027-12-31', 'Genéricos Perú', 'Vitaminas'),
  ('Zinc 50mg x 60 tabletas', 'Sulfato de zinc 50mg', 19.90, true, false, DATE '2028-03-31', 'Genéricos Perú', 'Vitaminas'),
  ('Vitamina B12 1000mcg x 30 tabletas', 'Cianocobalamina 1000mcg', 18.90, true, false, DATE '2028-06-30', 'Genéricos Perú', 'Vitaminas'),
  ('Multivitamínico infantil masticable x 30', 'Multivitamínico infantil', 29.90, false, false, DATE '2028-12-31', 'Bayer', 'Vitaminas'),
  ('Ginkgo Biloba 120mg x 60 cápsulas', 'Ginkgo biloba 120mg', 33.90, false, false, DATE '2029-06-30', 'Genéricos Perú', 'Vitaminas'),
  -- ===== Genéricos =====
  ('Paracetamol Genérico 500mg x 100 tabletas', 'Paracetamol 500mg', 5.90, true, true, DATE '2029-12-31', 'Genéricos Perú', 'Genéricos'),
  ('Ibuprofeno Genérico 400mg x 100 cápsulas', 'Ibuprofeno 400mg', 7.90, true, false, DATE '2027-03-31', 'Genéricos Perú', 'Genéricos'),
  ('Amoxicilina Genérica 500mg x 100 cápsulas', 'Amoxicilina 500mg', 12.90, true, false, DATE '2027-06-30', 'Genéricos Perú', 'Genéricos'),
  ('Omeprazol Genérico 20mg x 30 cápsulas', 'Omeprazol 20mg', 8.90, true, false, DATE '2027-09-30', 'Genéricos Perú', 'Genéricos'),
  ('Metformina Genérica 850mg x 30 tabletas', 'Metformina 850mg', 7.50, true, false, DATE '2027-12-31', 'Genéricos Perú', 'Genéricos'),
  ('Losartán Genérico 50mg x 30 tabletas', 'Losartán 50mg', 9.90, true, false, DATE '2028-03-31', 'Genéricos Perú', 'Genéricos'),
  ('Atorvastatina Genérica 20mg x 30 tabletas', 'Atorvastatina 20mg', 13.90, true, false, DATE '2028-06-30', 'Genéricos Perú', 'Genéricos'),
  ('Enalapril Genérico 10mg x 30 tabletas', 'Enalapril 10mg', 6.90, true, false, DATE '2028-12-31', 'Genéricos Perú', 'Genéricos'),
  ('Naproxeno Genérico 550mg x 30 tabletas', 'Naproxeno 550mg', 9.50, true, true, DATE '2029-06-30', 'Genéricos Perú', 'Genéricos'),
  ('Diclofenaco Genérico 50mg x 30 tabletas', 'Diclofenaco 50mg', 6.50, true, false, DATE '2029-12-31', 'Genéricos Perú', 'Genéricos'),
  ('Loratadina Genérica 10mg x 30 tabletas', 'Loratadina 10mg', 7.90, true, false, DATE '2027-03-31', 'Genéricos Perú', 'Genéricos'),
  ('Cetirizina Genérica 10mg x 30 tabletas', 'Cetirizina 10mg', 8.50, true, false, DATE '2027-06-30', 'Genéricos Perú', 'Genéricos'),
  ('Azitromicina Genérica 500mg x 3 tabletas', 'Azitromicina 500mg', 11.90, true, false, DATE '2027-09-30', 'Genéricos Perú', 'Genéricos'),
  ('Ciprofloxacino Genérico 500mg x 10 tabletas', 'Ciprofloxacino 500mg', 9.90, true, false, DATE '2027-12-31', 'Genéricos Perú', 'Genéricos'),
  ('Metronidazol Genérico 500mg x 30 tabletas', 'Metronidazol 500mg', 10.50, true, false, DATE '2028-03-31', 'Genéricos Perú', 'Genéricos'),
  ('Ranitidina Genérica 300mg x 20 tabletas', 'Ranitidina 300mg', 8.50, true, false, DATE '2028-06-30', 'Genéricos Perú', 'Genéricos'),
  ('Aciclovir Genérico 200mg x 25 tabletas', 'Aciclovir 200mg', 12.90, true, false, DATE '2028-12-31', 'Genéricos Perú', 'Genéricos'),
  ('Prednisona Genérica 20mg x 20 tabletas', 'Prednisona 20mg', 9.50, true, false, DATE '2029-06-30', 'Genéricos Perú', 'Genéricos'),
  ('Salbutamol Genérico inhalador 100mcg', 'Salbutamol 100mcg', 13.90, true, true, DATE '2029-12-31', 'Genéricos Perú', 'Genéricos'),
  ('Dexametasona Genérica 4mg x 10 tabletas', 'Dexametasona 4mg', 6.90, true, false, DATE '2027-03-31', 'Genéricos Perú', 'Genéricos'),
  -- ===== Antigripales =====
  ('Panadol Antigripal x 12 tabletas', 'Paracetamol + Fenilefrina + Clorfenamina', 18.90, false, true, DATE '2027-06-30', 'GSK', 'Antigripales'),
  ('Panadol Antigripal NF x 24 tabletas', 'Paracetamol + Fenilefrina', 24.90, false, false, DATE '2027-09-30', 'GSK', 'Antigripales'),
  ('Bisolvon Antigripal x 12 tabletas', 'Paracetamol + Fenilefrina', 17.90, false, false, DATE '2027-12-31', 'Sanofi', 'Antigripales'),
  ('Desenfriol-D x 12 tabletas', 'Paracetamol + Clorfenamina + Fenilefrina', 12.90, false, false, DATE '2028-03-31', 'Genéricos Perú', 'Antigripales'),
  ('Tapsin Día y Noche x 12 tabletas', 'Paracetamol + descongestionante', 15.90, false, false, DATE '2028-06-30', 'Genéricos Perú', 'Antigripales'),
  ('Antigripal Genérico x 100 tabletas', 'Paracetamol + Clorfenamina', 14.90, true, true, DATE '2028-12-31', 'Genéricos Perú', 'Antigripales'),
  ('Refrianex Forte x 12 cápsulas', 'Paracetamol + Cafeína + Fenilefrina', 16.90, false, false, DATE '2029-06-30', 'Genfar', 'Antigripales'),
  ('Multigrip x 12 tabletas', 'Paracetamol + Fenilefrina', 13.90, false, false, DATE '2029-12-31', 'Genfar', 'Antigripales'),
  ('Nastizol Compositum x 12 tabletas', 'Clorfenamina + Fenilefrina', 11.90, false, false, DATE '2027-03-31', 'Genéricos Perú', 'Antigripales'),
  ('Vick VapoRub 50g', 'Mentol + Alcanfor + Eucalipto', 16.90, false, false, DATE '2027-06-30', 'Procter & Gamble', 'Antigripales'),
  ('Vick VapoRub 100g', 'Mentol + Alcanfor + Eucalipto', 24.90, false, true, DATE '2027-09-30', 'Procter & Gamble', 'Antigripales'),
  ('Vitapyrena Forte x 10 sobres', 'Paracetamol + Vitamina C', 18.90, false, false, DATE '2027-12-31', 'Genfar', 'Antigripales'),
  ('Frenadol Complex x 10 sobres', 'Paracetamol + Cafeína', 22.90, false, false, DATE '2028-03-31', 'GSK', 'Antigripales'),
  ('Bisolvon Tos jarabe 120ml', 'Bromhexina', 19.90, false, false, DATE '2028-06-30', 'Sanofi', 'Antigripales'),
  ('Notil jarabe antigripal 120ml', 'Paracetamol + antihistamínico', 14.90, false, false, DATE '2028-12-31', 'Genéricos Perú', 'Antigripales'),
  ('Strepsils pastillas para la garganta x 24', 'Amilmetacresol', 12.90, false, false, DATE '2029-06-30', 'GSK', 'Antigripales'),
  ('Mentho-Lyptus caramelos x 20', 'Mentol + eucalipto', 4.90, false, true, DATE '2029-12-31', 'Genéricos Perú', 'Antigripales'),
  ('Afrin descongestionante nasal 15ml', 'Oximetazolina', 17.90, false, false, DATE '2027-03-31', 'Bayer', 'Antigripales'),
  ('Antigripal Día y Noche x 16 cápsulas', 'Paracetamol + pseudoefedrina', 19.90, false, false, DATE '2027-06-30', 'Genéricos Perú', 'Antigripales'),
  ('Paracetamol + Cafeína 500mg x 16 tabletas', 'Paracetamol + Cafeína', 11.90, true, false, DATE '2027-09-30', 'Genéricos Perú', 'Antigripales'),
  -- ===== Antibióticos =====
  ('Amoxicilina 500mg x 21 cápsulas', 'Amoxicilina trihidrato 500mg', 15.50, true, true, DATE '2027-12-31', 'Genfar', 'Antibióticos'),
  ('Azitromicina 500mg x 3 tabletas', 'Azitromicina 500mg', 19.90, false, false, DATE '2028-03-31', 'Pfizer', 'Antibióticos'),
  ('Ciprofloxacino 500mg x 10 tabletas', 'Ciprofloxacino 500mg', 16.90, true, false, DATE '2028-06-30', 'Genfar', 'Antibióticos'),
  ('Cefalexina 500mg x 20 cápsulas', 'Cefalexina 500mg', 18.90, true, false, DATE '2028-12-31', 'Genéricos Perú', 'Antibióticos'),
  ('Amoxicilina + Ácido Clavulánico 1g x 14 tabletas', 'Amoxicilina + clavulánico', 34.90, false, false, DATE '2029-06-30', 'GSK', 'Antibióticos'),
  ('Claritromicina 500mg x 10 tabletas', 'Claritromicina 500mg', 28.90, false, false, DATE '2029-12-31', 'Genfar', 'Antibióticos'),
  ('Doxiciclina 100mg x 10 cápsulas', 'Doxiciclina 100mg', 13.90, true, false, DATE '2027-03-31', 'Genéricos Perú', 'Antibióticos'),
  ('Clindamicina 300mg x 16 cápsulas', 'Clindamicina 300mg', 24.90, false, false, DATE '2027-06-30', 'Genfar', 'Antibióticos'),
  ('Eritromicina 500mg x 20 tabletas', 'Eritromicina 500mg', 17.90, true, false, DATE '2027-09-30', 'Genéricos Perú', 'Antibióticos'),
  ('Levofloxacino 500mg x 7 tabletas', 'Levofloxacino 500mg', 26.90, false, true, DATE '2027-12-31', 'Genfar', 'Antibióticos'),
  -- ===== Antialérgicos =====
  ('Loratadina 10mg x 10 tabletas', 'Loratadina 10mg', 9.80, true, false, DATE '2028-03-31', 'Genéricos Perú', 'Antialérgicos'),
  ('Cetirizina 10mg x 10 tabletas', 'Cetirizina 10mg', 11.90, true, false, DATE '2028-06-30', 'Genfar', 'Antialérgicos'),
  ('Clorfenamina 4mg x 20 tabletas', 'Clorfenamina maleato 4mg', 5.90, true, true, DATE '2028-12-31', 'Genéricos Perú', 'Antialérgicos'),
  ('Desloratadina 5mg x 10 tabletas', 'Desloratadina 5mg', 16.90, false, false, DATE '2029-06-30', 'Genfar', 'Antialérgicos'),
  ('Loratadina jarabe 60ml', 'Loratadina 5mg/5ml', 12.90, true, false, DATE '2029-12-31', 'Genéricos Perú', 'Antialérgicos'),
  ('Aerius 5mg x 10 tabletas', 'Desloratadina 5mg', 22.90, false, false, DATE '2027-03-31', 'Genéricos Perú', 'Antialérgicos'),
  ('Fexofenadina 180mg x 10 tabletas', 'Fexofenadina 180mg', 19.90, false, false, DATE '2027-06-30', 'Genfar', 'Antialérgicos'),
  ('Ebastina 10mg x 10 tabletas', 'Ebastina 10mg', 14.90, true, false, DATE '2027-09-30', 'Genéricos Perú', 'Antialérgicos'),
  ('Levocetirizina 5mg x 10 tabletas', 'Levocetirizina 5mg', 15.90, true, false, DATE '2027-12-31', 'Genfar', 'Antialérgicos'),
  ('Betametasona crema 0.05% x 30g', 'Betametasona 0.05%', 13.90, true, true, DATE '2028-03-31', 'Genéricos Perú', 'Antialérgicos'),
  -- ===== Cuidado Personal =====
  ('Alcohol Medicinal 96° x 250ml', 'Etanol 96°', 7.50, false, false, DATE '2028-06-30', 'Genéricos Perú', 'Cuidado Personal'),
  ('Curitas adhesivas surtidas x 100 unidades', NULL, 11.90, false, true, DATE '2028-12-31', 'Genéricos Perú', 'Cuidado Personal'),
  ('Crema dental Colgate Total 12 x 75g', 'Triclosán', 6.90, false, false, DATE '2029-06-30', 'Procter & Gamble', 'Cuidado Personal'),
  ('Gel antibacterial 500ml', 'Alcohol en gel 70%', 12.90, false, false, DATE '2029-12-31', 'Genéricos Perú', 'Cuidado Personal'),
  ('Jabón antibacterial líquido 250ml', NULL, 9.90, false, false, DATE '2027-03-31', 'Procter & Gamble', 'Cuidado Personal'),
  ('Algodón hidrófilo 100g', NULL, 5.90, false, false, DATE '2027-06-30', 'Genéricos Perú', 'Cuidado Personal'),
  ('Alcohol en gel 250ml', 'Alcohol 70%', 7.90, false, true, DATE '2027-09-30', 'Genéricos Perú', 'Cuidado Personal'),
  ('Enjuague bucal Listerine 250ml', NULL, 15.90, false, false, DATE '2027-12-31', 'Procter & Gamble', 'Cuidado Personal'),
  ('Hisopos de algodón x 100 unidades', NULL, 4.90, false, false, DATE '2028-03-31', 'Genéricos Perú', 'Cuidado Personal'),
  ('Toallas higiénicas Always x 16 unidades', NULL, 8.90, false, false, DATE '2028-06-30', 'Procter & Gamble', 'Cuidado Personal'),
  -- ===== Dermatología =====
  ('Protector solar facial FPS50 50ml', NULL, 42.90, false, false, DATE '2028-12-31', 'Bayer', 'Dermatología'),
  ('Crema hidratante Cetaphil 100ml', NULL, 38.90, false, true, DATE '2029-06-30', 'Genéricos Perú', 'Dermatología'),
  ('Clotrimazol crema 1% x 20g', 'Clotrimazol 1%', 9.90, true, false, DATE '2029-12-31', 'Genfar', 'Dermatología'),
  ('Ketoconazol shampoo 2% 120ml', 'Ketoconazol 2%', 24.90, false, false, DATE '2027-03-31', 'Genéricos Perú', 'Dermatología'),
  ('Crema cicatrizante Cicalfate 40ml', NULL, 44.90, false, false, DATE '2027-06-30', 'Genéricos Perú', 'Dermatología'),
  ('Ácido salicílico gel antiacné 30g', 'Ácido salicílico', 16.90, false, false, DATE '2027-09-30', 'Genéricos Perú', 'Dermatología'),
  ('Calamina loción 120ml', 'Calamina', 11.90, true, false, DATE '2027-12-31', 'Genéricos Perú', 'Dermatología'),
  ('Mupirocina ungüento 2% x 15g', 'Mupirocina 2%', 19.90, false, false, DATE '2028-03-31', 'GSK', 'Dermatología'),
  ('Crema humectante con urea 10% 100g', 'Urea 10%', 22.90, false, true, DATE '2028-06-30', 'Genéricos Perú', 'Dermatología'),
  ('Gel de aloe vera 200ml', 'Aloe vera', 14.90, false, false, DATE '2028-12-31', 'Genéricos Perú', 'Dermatología'),
  -- ===== Cuidado del Hogar =====
  ('Lejía concentrada 1L', 'Hipoclorito de sodio', 4.90, false, false, DATE '2029-06-30', 'Genéricos Perú', 'Cuidado del Hogar'),
  ('Alcohol isopropílico 1L', 'Isopropanol', 14.90, false, false, DATE '2029-12-31', 'Genéricos Perú', 'Cuidado del Hogar'),
  ('Desinfectante multiusos Lysol 900ml', NULL, 16.90, false, true, DATE '2027-03-31', 'Genéricos Perú', 'Cuidado del Hogar'),
  ('Guantes de látex descartables x 100 unidades', NULL, 19.90, false, false, DATE '2027-06-30', 'Genéricos Perú', 'Cuidado del Hogar'),
  ('Mascarillas quirúrgicas x 50 unidades', NULL, 12.90, false, false, DATE '2027-09-30', 'Genéricos Perú', 'Cuidado del Hogar'),
  ('Jabón en barra antibacterial x 3 unidades', NULL, 8.90, false, false, DATE '2027-12-31', 'Procter & Gamble', 'Cuidado del Hogar'),
  ('Spray desinfectante de superficies 400ml', NULL, 13.90, false, false, DATE '2028-03-31', 'Genéricos Perú', 'Cuidado del Hogar'),
  ('Bolsas para desechos biológicos x 20 unidades', NULL, 9.90, false, false, DATE '2028-06-30', 'Genéricos Perú', 'Cuidado del Hogar'),
  ('Repelente de insectos 120ml', 'DEET', 17.90, false, true, DATE '2028-12-31', 'Genéricos Perú', 'Cuidado del Hogar'),
  ('Papel toalla institucional x 6 unidades', NULL, 15.90, false, false, DATE '2029-06-30', 'Genéricos Perú', 'Cuidado del Hogar'),
  -- ===== Gastroenterología =====
  ('Omeprazol 20mg x 30 cápsulas', 'Omeprazol 20mg', 12.90, true, true, DATE '2029-12-31', 'Genéricos Perú', 'Gastroenterología'),
  ('Ranitidina 300mg x 20 tabletas', 'Ranitidina 300mg', 9.90, true, false, DATE '2027-03-31', 'Genéricos Perú', 'Gastroenterología'),
  ('Sal de Andrews x 12 sobres', 'Bicarbonato de sodio', 7.90, false, false, DATE '2027-06-30', 'GSK', 'Gastroenterología'),
  ('Hidróxido de aluminio suspensión 360ml', 'Hidróxido de aluminio', 11.90, true, false, DATE '2027-09-30', 'Genéricos Perú', 'Gastroenterología'),
  ('Loperamida 2mg x 12 tabletas', 'Loperamida 2mg', 7.50, true, false, DATE '2027-12-31', 'Genfar', 'Gastroenterología'),
  ('Pantoprazol 40mg x 30 tabletas', 'Pantoprazol 40mg', 18.90, true, false, DATE '2028-03-31', 'Genfar', 'Gastroenterología'),
  ('Esomeprazol 40mg x 14 tabletas', 'Esomeprazol 40mg', 24.90, true, false, DATE '2028-06-30', 'Genéricos Perú', 'Gastroenterología'),
  ('Dimenhidrinato 50mg x 10 tabletas', 'Dimenhidrinato 50mg', 8.90, true, false, DATE '2028-12-31', 'Genéricos Perú', 'Gastroenterología'),
  ('Probióticos Floratil x 6 cápsulas', 'Saccharomyces boulardii', 28.90, false, false, DATE '2029-06-30', 'Genéricos Perú', 'Gastroenterología'),
  ('Sales de rehidratación oral x 5 sobres', 'Electrolitos orales', 8.90, true, true, DATE '2029-12-31', 'Genéricos Perú', 'Gastroenterología'),
  -- ===== Cardiovascular =====
  ('Losartán 50mg x 30 tabletas', 'Losartán potásico 50mg', 11.90, true, true, DATE '2027-03-31', 'Genfar', 'Cardiovascular'),
  ('Enalapril 10mg x 30 tabletas', 'Enalapril maleato 10mg', 7.90, true, false, DATE '2027-06-30', 'Genéricos Perú', 'Cardiovascular'),
  ('Amlodipino 5mg x 30 tabletas', 'Amlodipino 5mg', 9.90, true, false, DATE '2027-09-30', 'Genfar', 'Cardiovascular'),
  ('Atorvastatina 20mg x 30 tabletas', 'Atorvastatina 20mg', 26.90, false, false, DATE '2027-12-31', 'Pfizer', 'Cardiovascular'),
  ('Aspirina 100mg Cardio x 28 tabletas', 'Ácido acetilsalicílico 100mg', 13.90, false, false, DATE '2028-03-31', 'Bayer', 'Cardiovascular'),
  ('Atenolol 50mg x 30 tabletas', 'Atenolol 50mg', 8.90, true, false, DATE '2028-06-30', 'Genéricos Perú', 'Cardiovascular'),
  ('Valsartán 80mg x 28 tabletas', 'Valsartán 80mg', 19.90, true, false, DATE '2028-12-31', 'Genfar', 'Cardiovascular'),
  ('Carvedilol 25mg x 30 tabletas', 'Carvedilol 25mg', 16.90, true, false, DATE '2029-06-30', 'Genéricos Perú', 'Cardiovascular'),
  ('Clopidogrel 75mg x 28 tabletas', 'Clopidogrel 75mg', 32.90, false, true, DATE '2029-12-31', 'Sanofi', 'Cardiovascular'),
  ('Rosuvastatina 10mg x 30 tabletas', 'Rosuvastatina 10mg', 28.90, true, false, DATE '2027-03-31', 'Genfar', 'Cardiovascular'),
  -- ===== Diabetes =====
  ('Metformina 850mg x 30 tabletas', 'Metformina clorhidrato 850mg', 11.90, true, true, DATE '2027-06-30', 'Genfar', 'Diabetes'),
  ('Metformina 1000mg x 30 tabletas', 'Metformina clorhidrato 1000mg', 13.90, true, false, DATE '2027-09-30', 'Genéricos Perú', 'Diabetes'),
  ('Glibenclamida 5mg x 30 tabletas', 'Glibenclamida 5mg', 7.90, true, false, DATE '2027-12-31', 'Genéricos Perú', 'Diabetes'),
  ('Glimepirida 2mg x 30 tabletas', 'Glimepirida 2mg', 18.90, false, false, DATE '2028-03-31', 'Sanofi', 'Diabetes'),
  ('Tiras reactivas de glucosa x 50 unidades', NULL, 64.90, false, false, DATE '2028-06-30', 'Roche', 'Diabetes'),
  ('Glucómetro Accu-Chek Active', NULL, 89.90, false, true, DATE '2028-12-31', 'Roche', 'Diabetes'),
  ('Lancetas para glucómetro x 100 unidades', NULL, 24.90, false, false, DATE '2029-06-30', 'Roche', 'Diabetes'),
  ('Insulina NPH 100UI/ml 10ml', 'Insulina humana NPH', 38.90, false, false, DATE '2029-12-31', 'Sanofi', 'Diabetes'),
  ('Sitagliptina 50mg x 28 tabletas', 'Sitagliptina 50mg', 44.90, false, false, DATE '2027-03-31', 'Genfar', 'Diabetes'),
  ('Jeringas para insulina x 10 unidades', NULL, 9.90, false, false, DATE '2027-06-30', 'Genéricos Perú', 'Diabetes'),
  -- ===== Respiratorio =====
  ('Salbutamol inhalador 100mcg x 200 dosis', 'Salbutamol 100mcg', 18.90, false, true, DATE '2027-09-30', 'GSK', 'Respiratorio'),
  ('Ambroxol jarabe 120ml', 'Ambroxol clorhidrato', 12.90, true, false, DATE '2027-12-31', 'Genéricos Perú', 'Respiratorio'),
  ('Bromhexina jarabe 120ml', 'Bromhexina', 11.90, true, false, DATE '2028-03-31', 'Genéricos Perú', 'Respiratorio'),
  ('Salbutamol + Ipratropio inhalador', 'Salbutamol + ipratropio', 32.90, false, false, DATE '2028-06-30', 'GSK', 'Respiratorio'),
  ('Budesonida inhalador 200mcg', 'Budesonida 200mcg', 38.90, false, false, DATE '2028-12-31', 'Genfar', 'Respiratorio'),
  ('Loratadina + Pseudoefedrina x 10 tabletas', 'Loratadina + pseudoefedrina', 15.90, false, false, DATE '2029-06-30', 'Genéricos Perú', 'Respiratorio'),
  ('Suero fisiológico para nebulizar x 25 ampollas', 'Cloruro de sodio 0.9%', 16.90, true, false, DATE '2029-12-31', 'Genéricos Perú', 'Respiratorio'),
  ('Acetilcisteína 600mg x 10 sobres', 'Acetilcisteína 600mg', 19.90, true, false, DATE '2027-03-31', 'Genéricos Perú', 'Respiratorio'),
  ('Beclometasona spray nasal', 'Beclometasona', 27.90, false, false, DATE '2027-06-30', 'GSK', 'Respiratorio'),
  ('Dextrometorfano jarabe 120ml', 'Dextrometorfano', 13.90, true, true, DATE '2027-09-30', 'Genéricos Perú', 'Respiratorio')
) AS v(name, ai, price, gen, offer, exp, lab, cat);

-- ------------------------------------------------------------
-- INVENTARIO POR SEDE (1 fila por producto x sede; cubre TODOS)
-- Ate (location_id=1) más stock; Santa Anita (location_id=2) menos.
-- ------------------------------------------------------------
INSERT INTO inventory (current_stock, min_stock, product_id, location_id)
SELECT
  CASE
    WHEN l.location_id = 1 THEN
      CASE (p.product_id % 4) WHEN 0 THEN 80 WHEN 1 THEN 50 WHEN 2 THEN 35 ELSE 25 END
    ELSE
      CASE (p.product_id % 4) WHEN 0 THEN 40 WHEN 1 THEN 25 WHEN 2 THEN 15 ELSE 10 END
  END,
  10, p.product_id, l.location_id
FROM product p CROSS JOIN location l;

-- ------------------------------------------------------------
-- IMÁGENES placeholder (se reemplazan luego por las de S3/CloudFront)
-- Una 'main' por producto. Usa el product_id para evitar caracteres raros.
-- ------------------------------------------------------------
INSERT INTO image (url, type, product_id)
SELECT 'https://placehold.co/400x400/FFF4EE/F26430?text=Producto+' || product_id,
       'main', product_id
FROM product;

COMMIT;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
SELECT 'Productos' AS tabla, COUNT(*) AS total FROM product
UNION ALL SELECT 'En oferta', COUNT(*) FROM product WHERE is_offer
UNION ALL SELECT 'Genéricos', COUNT(*) FROM product WHERE is_generic
UNION ALL SELECT 'Inventario (filas)', COUNT(*) FROM inventory
UNION ALL SELECT 'Imágenes', COUNT(*) FROM image;

SELECT c.category_name, COUNT(p.product_id) AS productos
FROM category c LEFT JOIN product p ON p.category_id = c.category_id
GROUP BY c.category_name ORDER BY productos DESC, c.category_name;

-- Comprobar que NINGÚN producto quedó sin laboratorio o categoría:
SELECT product_id, product_name FROM product
WHERE laboratory_id IS NULL OR category_id IS NULL;
