# Botica Central — Contexto del Proyecto

> Este archivo es leído por Claude Code en cada conversación. Define la **realidad actual** del proyecto y las reglas que deben respetarse SIEMPRE.
> **Regla de oro**: el backend es la fuente de verdad. El frontend se adapta al backend. El backend solo se modifica cuando es estrictamente necesario.

## Estructura del repositorio

```
botica-central/
├── backend/          # Node.js + Express 5 + PostgreSQL (pg pool, sin ORM)
├── frontend/         # React 18 + Vite + TS + Tailwind v4 + shadcn/ui
└── docs/
    └── schema.sql    # Esquema PostgreSQL ya ejecutado
```

- Backend: `http://localhost:3000` (rutas bajo `/api`)
- Frontend: `http://localhost:5173`

## Estado actual de la BD

La base de datos `botica` YA fue ejecutada con el schema definitivo. Contiene:

- **Tablas creadas con CHECK constraints**: roles, estados, métodos de pago, etc. ya están validados a nivel BD.
- **2 locations**: Ate (id=1), Santa Anita (id=2).
- **3 users**: ADMIN01 (admin), TRAB01 (emp, sede Ate), TRAB02 (emp, sede Santa Anita).
- **2 customers**: Matteo Arteaga (`matteo@test.com`), Ivanna Santos (`ivanna@test.com`).
- **VACÍO todavía**: product, category, laboratory, inventory, image, orders, order_detail, payment.

> **NO insertar productos/categorías/etc todavía**. Cuando se necesiten para probar páginas, el usuario los meterá manualmente o se generará un seed en su momento.

## Backend — nombres y convenciones REALES

### Roles del sistema

El backend usa estos identificadores en `users.role` y en payloads JWT:

- `'admin'` — administrador con acceso total
- `'emp'` — empleado/trabajador de botica
- `'cust'` — cliente / customer (NO existe en tabla users; los clientes viven en tabla customer)

### Tablas y columnas (snake_case)

- **users** → `user_id, user_code (UNIQUE), user_password (bcrypt), full_name, role ('admin'|'emp'), location_id, is_active`
- **customer** → `customer_id, full_name, dni, address, phone, email, customer_password (bcrypt), is_active, created_at`
- **product** → `product_id, product_name, active_ingredient, product_composition, contraindications, adverse_effects, product_batch, expiration_date, health_record, is_generic, product_price (≥0), is_active, is_offer, laboratory_id, category_id`
- **category** → `category_id, category_name (UNIQUE), category_description`
- **laboratory** → `laboratory_id, laboratory_name, laboratory_country`
- **location** → `location_id, location_name, location_address, district, location_phone, is_active`
- **inventory** → `inventory_id, current_stock (≥0), min_stock (≥0), product_id, location_id` | **UNIQUE(product_id, location_id)** — el mismo producto vive en múltiples sedes
- **image** → `image_id, url, type ('main'|'gallery'|'thumbnail'), product_id` | una sola imagen 'main' por producto
- **orders** → `order_id, order_state, delivery_type, order_date (TIMESTAMP), total_price (≥0), customer_id, user_id, location_id`
- **order_detail** → `detail_id, amount (>0), unit_price (≥0), sub_total_price (≥0), product_id, order_id`
- **payment** → `payment_id, payment_method, total_price (≥0), voucher_type, email_pay, phone_pay, order_id`

### Valores VALIDADOS a nivel BD (CHECK constraints)

```
users.role:           'admin' | 'emp'
orders.order_state:   'pendiente' | 'en proceso' | 'entregado' | 'cancelado'
orders.delivery_type: 'delivery' | 'pickup' | NULL
payment.payment_method: 'efectivo' | 'yape' | 'plin' | 'tarjeta' | 'transferencia'
payment.voucher_type:   'boleta' | 'factura' | 'ticket' | NULL
image.type:           'main' | 'gallery' | 'thumbnail'
```

> Cualquier INSERT con valores fuera de esta lista falla con error de constraint. NO inventar otros valores.

### Endpoints actuales del backend (según auditoría)

```
POST   /api/auth/login              { user_code, user_password } → staff/admin

# POR CREAR (el frontend los necesita, no existen aún):
POST   /api/auth/customer-login     { email, customer_password }
POST   /api/auth/customer-register  { full_name, email, customer_password, ... }
GET    /api/dashboard/summary
GET    /api/reports/sales
GET    /api/orders/stats
GET    /api/orders/shift-summary

GET    /api/products                ?nombre=&laboratory_id=&location_id=
GET    /api/products/stock          ?productId=&location_id=
GET    /api/products/:id
POST   /api/products                (admin)
PUT    /api/products/:id            (admin)
PATCH  /api/products/:id            (admin)
DELETE /api/products/:id            (admin)
POST   /api/products/offers/:id     (admin)
# NOTA: GET /api/products requiere token actualmente. Se hará público en fix.
# NOTA: el filtro no soporta category_id ni is_offer todavía. Se ampliará.

GET    /api/orders                  (admin/emp)
GET    /api/orders/my-orders        ?customer_id=
GET    /api/orders/:id
POST   /api/orders                  (cust)  body: { order: {...}, details: [...] }
PATCH  /api/orders/:id/status       body: { order_state }

GET    /api/users                   (admin)
GET    /api/users/me
GET    /api/users/:id
POST   /api/users                   ⚠️ AGUJERO: actualmente SIN auth, hay que cerrarlo
POST   /api/users/register          ⚠️ AGUJERO: actualmente SIN auth, eliminar
POST   /api/users/login             ⚠️ DUPLICADO de /auth/login con payload distinto
PUT    /api/users/:id
PATCH  /api/users/:id/role          (admin)
DELETE /api/users/:id               (admin)

GET    /api/inventory               (admin/emp)
GET    /api/inventory/low-stock     (admin/emp)
GET    /api/inventory/:id
POST   /api/inventory               (admin)
PUT    /api/inventory/:id           (admin)
POST   /api/inventory/transfer      (admin)

GET    /api/customers               (admin/emp)
GET    /api/customers/dni/:dni
GET    /api/customers/:id
POST   /api/customers               (público — actualmente sin password)
PUT    /api/customers/:id
DELETE /api/customers/:id           (admin)

GET    /api/categories              (con token; se hará público)
POST/PUT/PATCH/DELETE               (admin)

GET    /api/laboratories            (con token; se hará público) — NO TIENE DELETE
POST/PUT/PATCH                      (admin)

GET    /api/locations               (con token; se hará público)
POST/PUT/PATCH/DELETE               (admin)

GET    /api/payment-methods         (admin/emp)
GET    /api/payment-methods/order/:order_id
POST   /api/payment-methods         (auth)
PUT/PATCH/DELETE                    (admin)
```

### Endpoints que serán PÚBLICOS

Para que el catálogo funcione sin login, estos endpoints deben quitar `verifyToken`:

- `GET /api/products` (lista) y `GET /api/products/:id` y `GET /api/products/stock`
- `GET /api/categories`, `GET /api/laboratories`, `GET /api/locations`

### Autenticación

- JWT en header: `Authorization: Bearer <token>`
- **Payload unificado** (después del fix de seguridad):
  - Staff/admin: `{ user_id, role: 'admin'|'emp', full_name, location_id }`
  - Customer: `{ customer_id, role: 'cust', full_name, email }`
- Expira en 8h
- Middleware: `verifyToken`, `verifyRole('admin','emp','cust')`

## Frontend — rutas y stack

### Rutas (ver `src/app/routes.tsx`)

**Públicas / customer**:
`/` `/catalogo` `/producto/:id` `/carrito` `/checkout` `/confirmacion` `/login` `/registro` (POR CREAR) `/mis-pedidos` `/mis-pedidos/:id` (POR CREAR)

**Staff (rol `emp`)**:
`/staff` (login) → `/staff/dashboard` `/staff/nueva-venta` `/staff/pedidos` `/staff/pedidos/:id` `/staff/cierre`

**Admin (rol `admin`)**:
`/admin` (login) → `/admin/dashboard` `/admin/productos` `/admin/stock` `/admin/pedidos` `/admin/usuarios` `/admin/reportes`

### Stack confirmado

React 18, Vite 6, TypeScript, Tailwind v4, shadcn/ui (Radix), lucide-react, react-router v7, sonner (toasts), recharts (gráficos), motion, embla-carousel-react, react-hook-form, date-fns.

## Reglas de código (no negociables)

1. **Toda llamada al backend pasa por `src/app/lib/api.ts`**. Cero `fetch` sueltos en componentes.
2. **Tipos TypeScript en snake_case** para matchear el backend. NO convertir a camelCase.
3. **Token JWT y user en `AuthContext`** (POR CREAR), no en localStorage accedido directo.
4. **Carrito en `CartContext`** (POR CREAR) con persistencia en localStorage.
5. **Rutas protegidas con `<RequireRole role="...">`** (POR CREAR) envolviendo los layouts staff y admin.
6. **Estados obligatorios en toda lista**: loading (Skeleton), error (con retry), empty (icono + mensaje + CTA opcional).
7. **Mensajes y UI en español** (Perú). Precios con prefijo `S/ ` y 2 decimales.
8. **Sin emojis en UI**. Solo iconos Lucide.
9. **Sin lorem ipsum**: nombres reales de medicamentos peruanos.
10. **Sin nombres hardcoded de personas** en layouts ("Carlos Quispe", "Jorge Pérez"). Todo viene del user del AuthContext.
11. **Sin `confirm()` ni `alert()` nativos**. Usar `sonner` para toasts y `Dialog` de shadcn para confirmaciones.

## Problemas conocidos del proyecto (auditoría + validación)

### Seguridad
- ❌ `POST /api/users` y `POST /api/users/register` permiten crear admins sin auth — **CERRAR**
- ❌ CORS totalmente abierto sin allowlist
- ❌ Dos endpoints de login duplicados (`/auth/login` y `/users/login`) con payloads JWT distintos
- ❌ `req.user.id` usado en `orderController.updateStatus:88` Y `userController.getMe:72` — el token de `/auth/login` trae `user_id`, no `id` → ambos quedan undefined
- ❌ `userController.create` usa default `role = 'cust'`, incompatible con CHECK `users.role IN ('admin','emp')` — cambiar default a `'emp'` o exigir role obligatorio
- ❌ Comentario en `middleware/auth.js:15` (`// { id, nombre, rol }`) no coincide con ningún payload real — actualizar al payload unificado tras el fix

### Funcionalidad
- ❌ No existen endpoints customer-login, customer-register, reportes, dashboard summary, cierre de caja
- ❌ `GET /api/products` exige token pero el catálogo es público en el frontend
- ❌ `POST /api/orders` exige `verifyRole('cust')` — **bloquea ventas POS del trabajador** (NuevaVenta.tsx). Ampliar a `verifyRole('cust','emp','admin')` o crear ruta dedicada `POST /api/orders/walk-in` para emp
- ❌ Estados de pedido descoordinados entre archivos del frontend:
  - `api.ts`: `'preparando'`/`'listo'` (no existen en backend)
  - `MisPedidos.tsx:8`: keys en inglés `'pending'/'processing'/'delivered'/'cancelled'`
  - `PedidosWeb.tsx:14` y `DetallePedido.tsx:8`: omiten `'en proceso'`
  - Unificar todos a los 4 estados del backend: `'pendiente'|'en proceso'|'entregado'|'cancelado'`
- ❌ Filtros del frontend (`category_id`, `is_offer`, rangos de precio) no soportados por `ProductModel.findAll`
- ❌ JOIN de productos puede duplicar filas (LEFT JOIN inventory + image sin filtrar type='main') — usar DISTINCT ON o subqueries
- ❌ `customerController.create` NO hashea password (solo `findByDni` + create plano)

### Frontend
- ❌ `lib/api.ts` completamente desincronizado (rutas en español `/productos`, `/pedidos`, `/usuarios`, nombres camelCase inventados)
- ❌ Cero páginas conectadas al backend (todo es mock local)
- ❌ Logins falsos: `StaffLogin`, `AdminLogin`, `ClientLogin` aceptan cualquier credencial sin fetch
- ❌ No existen `AuthContext`, `CartContext`, ni `<RequireRole>` en /lib o /components
- ❌ Rutas faltantes: `/registro` y `/mis-pedidos/:id` (MisPedidos.tsx:228 enlaza a esta última → 404)
- ❌ Modal de usuarios usa roles `'admin'|'worker'` (cuarto naming distinto a corregir)
- ❌ Nombres de persona hardcoded en layouts (`WorkerLayout.tsx:94`, `AdminLayout.tsx:126`)
- ❌ `confirm()` y `alert()` nativos en producción

## Design system

### Colores

```
--primary-500: #F26430    /* naranja CTA */
--primary-600: #D94E1F    /* hover */
--primary-50:  #FFF4EE    /* fondo suave */
--secondary-500: #1E4D8C  /* azul info */
--secondary-50:  #EFF4FB
--neutral-900: #1A1F2E
--neutral-700: #4A5260
--neutral-400: #9CA3AF
--neutral-200: #E5E7EB
--neutral-50:  #F9FAFB
--success: #16A34A   --warning: #F59E0B   --error: #DC2626   --info: #2563EB
```

### Tipografía

- Poppins única (400, 500, 600, 700). No mezclar.
- Escala: display 48 / h1 36 / h2 28 / h3 20 / body-lg 18 / body 16 / body-sm 14 / caption 12.

### Reglas visuales

- UN solo CTA naranja sólido por sección visible.
- SecondaryNav de categorías en **BLANCO**, no naranja.
- Cards de producto: radius lg, hover shadow-md + translate-y -2px.
- Inputs: alto 44px, focus ring naranja.
- Contraste WCAG AA mínimo.

## Convenciones

- Precios: `S/ 12.50` (2 decimales)
- Fechas: `dd/MM/yyyy` con date-fns en español
- Estados pedido (StatusChip):
  - `pendiente` → warning (ámbar)
  - `en proceso` → info (azul)
  - `entregado` → success (verde)
  - `cancelado` → error (rojo)

## Mapeo conceptual (UI → backend)

Cuando el frontend habla en español natural, lo mapeamos así al backend:

| UI dice | Backend espera |
|---------|---------------|
| "trabajador / personal / staff" | `role = 'emp'` |
| "cliente / customer" | `role = 'cust'` |
| "pedido" | tabla `orders` |
| "estado pendiente" | `'pendiente'` |
| "estado en preparación" | `'en proceso'` |
| "estado completado / entregado" | `'entregado'` |
| "nombre del producto" | `product_name` |
| "precio" | `product_price` |
| "stock" | `inventory.current_stock` |
| "imagen" | `image.url` (JOIN con product, type='main') |