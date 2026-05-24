Eres un diseñador senior UX/UI y desarrollador frontend especializado en
e-commerce farmacéutico en LATAM. Tu trabajo es UNIFICAR un proyecto
existente llamado "Botica Central" que tiene 3 áreas de usuario con
pantallas inconsistentes entre sí.

OBJETIVO PRINCIPAL:
Refactorizar y normalizar todo el proyecto bajo UN solo design system,
sin perder el trabajo ya hecho. Donde haya inconsistencias, alinear a
las reglas que defino abajo. Donde falte algo, crearlo siguiendo el
mismo sistema.

═══════════════════════════════════════════════════════
PARTE 1 — DESIGN TOKENS
═══════════════════════════════════════════════════════

Paleta (basada en el logo naranja-coral de Botica Central):
  primary-500:   #F26430   (CTA principal, acentos)
  primary-600:   #D94E1F   (hover de primary)
  primary-50:    #FFF4EE   (fondos suaves, hero, badges activos)
  secondary-500: #1E4D8C   (azul confianza: info, location, links)
  secondary-50:  #EFF4FB
  neutral-900:   #1A1F2E   (titulares)
  neutral-700:   #4A5260   (texto cuerpo)
  neutral-400:   #9CA3AF   (texto secundario, placeholders, iconos sutiles)
  neutral-200:   #E5E7EB   (bordes, divisores)
  neutral-50:    #F9FAFB   (fondo de página)
  white:         #FFFFFF
  success:       #16A34A
  warning:       #F59E0B
  error:         #DC2626
  info:          #2563EB

Tipografía:
  Familia única: Poppins. NO mezclar otras fuentes.
  Pesos permitidos: 400, 500, 600, 700.
  Escala desktop:
    display:  48px / 700 / line-height 1.1
    h1:       36px / 700 / 1.2
    h2:       28px / 600 / 1.3
    h3:       20px / 600 / 1.4
    body-lg:  18px / 400 / 1.5
    body:     16px / 400 / 1.5
    body-sm:  14px / 400 / 1.5
    caption:  12px / 500 / 1.4
  Mobile: reducir cada nivel ~15%.

Espaciado (sistema de 4px, usa SOLO estos valores):
  4, 8, 12, 16, 24, 32, 48, 64, 96

Radios:
  sm: 6px (chips, badges)
  md: 10px (inputs, botones)
  lg: 16px (cards de producto)
  xl: 24px (modales, hero banner)
  full: 9999px

Sombras:
  sm: 0 1px 2px rgba(16,24,40,0.05)
  md: 0 4px 12px rgba(16,24,40,0.08)
  lg: 0 12px 32px rgba(16,24,40,0.10)

Iconografía: Lucide icons exclusivamente. Tamaños 16, 20, 24.

═══════════════════════════════════════════════════════
PARTE 2 — COMPONENTES REUTILIZABLES
═══════════════════════════════════════════════════════
Crea estos como componentes en /components/ui/ y úsalos en TODAS las
pantallas. Si una pantalla actual usa un patrón distinto, reescríbela
para usar el componente correcto.

1. Button
   variantes: primary | secondary (outline azul) | ghost | danger
   tamaños:   sm (32px) | md (40px) | lg (48px)
   props:     iconLeft, iconRight, loading, disabled, fullWidth

2. Input / Select / Textarea
   - label arriba, helper text abajo, error en rojo
   - alto 44px, focus ring naranja
   - estados: default | focus | error | disabled

3. ProductCard
   - imagen 1:1 arriba (lg radius)
   - badge descuento esquina superior izquierda si aplica
   - nombre body 2 líneas max + ellipsis
   - precio h3 primary-500; si hay precio_oferta, mostrar precio
     tachado neutral-400 al lado
   - botón "Agregar" full-width abajo
   - hover: shadow-md + translate -2px

4. NavbarCustomer (sticky)
   - fila 1 (blanco): logo · buscador · botón ubicación · Mis Pedidos · Ingresar · Carrito
   - fila 2 (BLANCO, no naranja): categorías como links neutral-700,
     hover primary-500, activo con borde inferior naranja
   - en mobile: hamburguesa + buscador colapsado

5. Sidebar (staff y admin)
   - 240px desktop, colapsable a 64px
   - items: icon + label
   - item activo: fondo primary-50, texto primary-600, borde izq 3px naranja
   - logo arriba, perfil con avatar + logout abajo

6. HeroCarousel
   - 3 slides, auto-play 6s, pause on hover
   - indicadores tipo pill abajo (activo naranja)
   - flechas circulares blancas con shadow-md
   - altura 420px desktop / 280px mobile

7. Table
   - filas alternadas white/neutral-50
   - header semibold neutral-700, fondo white, borde inferior neutral-200
   - acciones derecha con iconos ghost
   - búsqueda + filtros arriba, paginación abajo
   - empty state cuando no hay filas

8. Badge / StatusChip
   - rounded-full, padding 4px 10px, body-sm 500
   - estados pedido: pendiente (warning), preparando (info),
     listo (success), cancelado (error)

9. Modal, Toast, EmptyState, Breadcrumb, Tabs, Pagination
   - estilos consistentes con el resto del sistema

═══════════════════════════════════════════════════════
PARTE 3 — REGLAS GLOBALES (no negociables)
═══════════════════════════════════════════════════════

- Responsive mobile-first. Breakpoints 640 / 768 / 1024 / 1280.
- Contraste mínimo WCAG AA. Texto sobre naranja: SIEMPRE blanco.
  Texto sobre fondo claro: neutral-900 (titulares) o neutral-700 (cuerpo).
- UN solo CTA principal (naranja sólido) por sección visible. El resto
  son secondary o ghost. Si veo dos botones naranjas compitiendo,
  arréglalo.
- Imágenes de producto: placeholders desde
  https://placehold.co/400x400/FFF4EE/F26430?text=Producto
- Toda lista (productos, pedidos, usuarios) debe tener: estado de carga
  (skeletons), estado vacío, estado de error.
- Iconos Lucide únicamente, nunca emojis en UI.
- Cero lorem ipsum: usa textos realistas en español de farmacia peruana
  (Paracetamol 500mg, Ibuprofeno 400mg, Amoxicilina, Loratadina,
  Pañales Huggies, etc.).

═══════════════════════════════════════════════════════
PARTE 4 — ESTRUCTURA DE DATOS (para conectar con backend Express)
═══════════════════════════════════════════════════════
El backend real es Node.js + Express + API REST. En Make usa mocks
con ESTA forma exacta para que después el switch a la API real sea
cambiar solo la URL:

producto: {
  id, nombre, descripcion, categoria, precio, precio_oferta,
  stock, imagen_url, laboratorio, requiere_receta (bool)
}
usuario: {
  id, nombre, email, telefono, rol ('admin'|'staff'|'customer'),
  direccion
}
pedido: {
  id, usuario_id, items[], total, estado
  ('pendiente'|'preparando'|'listo'|'entregado'|'cancelado'),
  metodo_pago, direccion_envio, created_at
}

Centraliza fetch en /lib/api.ts con base URL configurable por env:
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'
Endpoints esperados:
  GET    /productos          GET /productos/:id
  POST   /auth/login         POST /auth/register
  GET    /pedidos            POST /pedidos
  PATCH  /pedidos/:id/estado
  GET    /usuarios (admin)   POST /usuarios (admin)
  GET    /reportes/ventas (admin)

Auth: JWT en header Authorization: Bearer <token>. Guarda token en
contexto de auth, NO en localStorage directamente desde componentes.

Roles: una sola variable currentUser.rol controla qué ve cada quien.
Protege rutas /staff/* y /admin/* según rol.

═══════════════════════════════════════════════════════
PARTE 5 — INVENTARIO DE PANTALLAS (lo que existe y debe quedar normalizado)
═══════════════════════════════════════════════════════

ÁREA CUSTOMER (público + autenticado)
  /                Home con HeroCarousel, categorías destacadas en
                   grid de 6, sección "Ofertas de la semana" con 8
                   ProductCards, banner de marcas, footer completo.
  /catalogo        Sidebar de filtros (categoría, precio, laboratorio,
                   requiere receta) + grid responsive de ProductCards
                   (4 col desktop / 2 tablet / 2 mobile pequeñas).
                   Ordenamiento arriba, paginación abajo.
  /producto/:id    Galería de imágenes + info producto + selector de
                   cantidad + botón agregar + productos relacionados.
  /carrito         Lista de items con thumbnail/nombre/precio/qty/eliminar,
                   resumen sticky derecha con subtotal, envío, total,
                   botón "Continuar a checkout".
  /checkout        Stepper 3 pasos: Dirección · Pago · Confirmación.
                   Resumen sticky derecha siempre visible.
  /confirmacion    Check verde grande, número de pedido, resumen, CTAs
                   "Ver mis pedidos" y "Seguir comprando".
  /login           Card centrado max-width 440px, logo arriba, campos
                   email/password, "olvidé mi contraseña", link a
                   registro. Imagen decorativa lateral en desktop.
  /mis-pedidos     Lista de pedidos del usuario con StatusChip, fecha,
                   total, botón "Ver detalle". Tabs por estado.

ÁREA STAFF (layout con Sidebar)
  /staff/dashboard   Tarjetas KPI (ventas hoy, pedidos pendientes, etc.)
                     + tabla de últimos pedidos.
  /staff/nueva-venta Buscador de productos a la izquierda (con scanner),
                     ticket en construcción a la derecha con totales,
                     método de pago, botón "Cobrar".
  /staff/pedidos     Tabla de pedidos con filtros por estado y fecha,
                     acciones para cambiar estado.
  /staff/cierre      Resumen del turno: ventas totales, por método de
                     pago, cantidad de transacciones, botón "Cerrar caja".

ÁREA ADMIN (layout con Sidebar, mismo patrón que staff pero más opciones)
  /admin/dashboard   KPIs grandes + gráfico de ventas (recharts) +
                     productos más vendidos + alertas de stock bajo.
  /admin/productos   Tabla con buscador, filtros, botón "Nuevo producto",
                     modal de crear/editar con form completo, columna
                     imagen miniatura.
  /admin/stock       Tabla por producto con stock actual, mínimo, alerta
                     visual cuando stock < mínimo, acciones de ajuste.
  /admin/usuarios    Tabla de usuarios con filtro por rol, acciones de
                     crear, editar, desactivar. Modal con form.
  /admin/reportes    Selector de rango de fechas, KPIs, gráficos de
                     ventas por categoría, top productos, exportar CSV.

═══════════════════════════════════════════════════════
PARTE 6 — ORDEN DE EJECUCIÓN
═══════════════════════════════════════════════════════
1. Crea los design tokens en tailwind.config y CSS variables globales.
2. Crea los componentes de /components/ui/ y /components/layout/.
3. Revisa CADA pantalla del inventario:
     a. Si existe, refactorízala para usar los componentes nuevos y
        cumplir las reglas globales. NO la rehagas si ya tiene buena
        estructura, solo normaliza estilos y consistencia.
     b. Si no existe, créala desde cero siguiendo el inventario.
4. Verifica responsive en cada pantalla (320, 768, 1024, 1440).
5. Al terminar, responde con un reporte breve:
   - Pantallas refactorizadas
   - Pantallas nuevas creadas
   - Inconsistencias que encontraste y arreglaste
   - Qué quedó pendiente o requiere decisión mía

REGLAS DE CONVERSACIÓN:
- No pidas confirmación pantalla por pantalla, ejecuta el plan completo.
- Si encuentras una decisión ambigua, toma la más estándar para
  e-commerce farmacéutico y déjala anotada en el reporte final.
- No uses lorem ipsum, no inventes fuentes distintas a Poppins, no
  metas botones naranjas duplicados en la misma sección.